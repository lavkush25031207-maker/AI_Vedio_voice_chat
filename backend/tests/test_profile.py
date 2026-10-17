import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlalchemy.pool import StaticPool
from app.main import app
from app.database import get_session
from app.models import StudentProfile, SessionHistory

# Use StaticPool to force a SINGLE shared connection for the in-memory DB.
# Without this, each connection gets its own empty in-memory database,
# causing "no such table" errors when create_all and Session use different connections.
test_engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

@pytest.fixture(name="session")
def session_fixture():
    """
    Creates and drops schemas for each individual test, ensuring absolute session isolation.
    """
    from app.routers.profile import PROFILES
    PROFILES.clear()

    SQLModel.metadata.create_all(test_engine)
    with Session(test_engine) as session:
        yield session
    SQLModel.metadata.drop_all(test_engine)

@pytest.fixture(name="client")
def client_fixture(session: Session):
    """
    Overrides the FastAPI get_session dependency injection with the clean test session fixture.
    """
    def get_session_override():
        return session
    app.dependency_overrides[get_session] = get_session_override
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()

def test_get_status(client: TestClient):
    """
    Verify the basic health check status endpoint yields 200 OK.
    """
    response = client.get("/api/status")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_get_default_profile(client: TestClient):
    """
    Verify get_profile returns seed database values if table is blank.
    """
    response = client.get("/api/profile")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Fresher Student"
    assert data["target_role"] == "Frontend Developer"

def test_update_and_fetch_profile(client: TestClient):
    """
    Verify that posting to /api/profile creates a record, and a subsequent GET re-fetches it.
    """
    payload = {
        "name": "Jane Doe",
        "target_role": "Backend Developer",
        "skills": "Python, FastAPI, SQLModel, PostgreSQL",
        "experience_level": "1-2 Years Experience",
        "target_category": "Mock Technical Interview"
    }

    # 1. Post to update profile
    post_res = client.post("/api/profile", json=payload)
    assert post_res.status_code == 200
    post_data = post_res.json()
    assert post_data["name"] == "Jane Doe"
    assert post_data["target_role"] == "Backend Developer"
    assert post_data["id"] is not None

    # 2. Get profile and verify persistence
    get_res = client.get("/api/profile")
    assert get_res.status_code == 200
    get_data = get_res.json()
    assert get_data["name"] == "Jane Doe"
    assert get_data["skills"] == "Python, FastAPI, SQLModel, PostgreSQL"
    assert get_data["id"] == post_data["id"]


def test_signup_and_login(client: TestClient):
    # 1. Sign up a new user
    res_signup = client.post("/api/profile/signup", json={
        "username": "alex",
        "password": "secretpassword",
        "name": "Alex Candidate"
    })
    assert res_signup.status_code == 200
    signup_data = res_signup.json()
    assert signup_data["username"] == "alex"
    assert signup_data["name"] == "Alex Candidate"
    assert signup_data["id"] is not None

    # 2. Prevent duplicate sign ups for same username
    res_dup = client.post("/api/profile/signup", json={
        "username": "alex",
        "password": "differentpass"
    })
    assert res_dup.status_code == 400

    # 3. Successful login
    res_login = client.post("/api/profile/login", json={
        "username": "alex",
        "password": "secretpassword"
    })
    assert res_login.status_code == 200
    login_data = res_login.json()
    assert login_data["username"] == "alex"
    assert login_data["id"] == signup_data["id"]

    # 4. Failed login with invalid credentials
    res_wrong = client.post("/api/profile/login", json={
        "username": "alex",
        "password": "wrongpassword"
    })
    assert res_wrong.status_code == 401

