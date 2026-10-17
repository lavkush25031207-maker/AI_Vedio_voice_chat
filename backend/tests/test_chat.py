import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlalchemy.pool import StaticPool
from app.main import app
from app.database import get_session
from app.models import SessionHistory, ChatMessage
from app.routers import chat as chat_router

test_engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

@pytest.fixture(name="session")
def session_fixture():
    from app.routers.profile import PROFILES
    from app.routers.chat import IN_MEMORY_SESSIONS, IN_MEMORY_SESSION_METADATA
    PROFILES.clear()
    IN_MEMORY_SESSIONS.clear()
    IN_MEMORY_SESSION_METADATA.clear()

    SQLModel.metadata.create_all(test_engine)
    with Session(test_engine) as session:
        yield session
    SQLModel.metadata.drop_all(test_engine)

@pytest.fixture(name="client")
def client_fixture(session: Session):
    def get_session_override():
        return session
    app.dependency_overrides[get_session] = get_session_override
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()

def test_start_session(client: TestClient):
    response = client.post("/api/chat/session", json={"session_type": "Mock Technical Interview"})
    assert response.status_code == 200
    data = response.json()
    assert data["type"] == "Mock Technical Interview"
    assert data["id"] is not None

def test_send_message_and_get_history(client: TestClient, monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setattr(chat_router, "generate_ai_response", lambda *_args, **_kwargs: None)
    monkeypatch.delenv("ALLOW_LOCAL_TUTOR_FALLBACK", raising=False)

    # Start session
    sess_res = client.post("/api/chat/session", json={"session_type": "Mock Technical Interview"})
    session_id = sess_res.json()["id"]

    # Send message
    msg_res = client.post("/api/chat/message", json={"session_id": session_id, "content": "Hello World!"})
    assert msg_res.status_code == 200
    msg_data = msg_res.json()
    assert msg_data["role"] == "model"
    assert msg_data["content"].strip()
    assert "AI providers" in msg_data["content"]

    # Get history
    hist_res = client.get(f"/api/chat/session/{session_id}/history")
    assert hist_res.status_code == 200
    hist_data = hist_res.json()
    
    # Expect 2 messages: user's "Hello World!" and model's response
    assert len(hist_data) == 2
    assert hist_data[0]["role"] == "user"
    assert hist_data[0]["content"] == "Hello World!"
    assert hist_data[1]["role"] == "model"

def test_multi_topic_learning_request_starts_simple(client: TestClient, monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setattr(chat_router, "generate_ai_response", lambda *_args, **_kwargs: None)
    monkeypatch.setenv("ALLOW_LOCAL_TUTOR_FALLBACK", "1")
    sess_res = client.post("/api/chat/session", json={"session_type": "HR Behavioral Round"})
    session_id = sess_res.json()["id"]

    msg_res = client.post(
        "/api/chat/message",
        json={"session_id": session_id, "content": "I want to learn about HTML CSS and JS"},
    )

    assert msg_res.status_code == 200
    content = msg_res.json()["content"]
    assert "Let's start with HTML" in content
    assert "Choose an option" not in content
    assert len(content.split()) < 50

def test_unclear_voice_input_is_not_treated_as_topic(client: TestClient, monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setattr(chat_router, "generate_ai_response", lambda *_args, **_kwargs: None)
    monkeypatch.setenv("ALLOW_LOCAL_TUTOR_FALLBACK", "1")
    sess_res = client.post("/api/chat/session", json={"session_type": "HR Behavioral Round"})
    session_id = sess_res.json()["id"]

    msg_res = client.post(
        "/api/chat/message",
        json={"session_id": session_id, "content": "bahen ke laude answer today"},
    )

    assert msg_res.status_code == 200
    content = msg_res.json()["content"]
    assert "Mujhe topic clearly samajh nahi aaya" in content
    assert "Let's start with" not in content

def test_evaluate_answer(client: TestClient):
    # Test blank answer evaluation
    res_blank = client.post("/api/chat/evaluate", json={"question": "Explain let, const, and var", "answer": ""})
    assert res_blank.status_code == 200
    assert res_blank.json()["score"] == 0
    
    # Test valid answer evaluation
    res_valid = client.post("/api/chat/evaluate", json={
        "question": "Explain the difference between let, const, and var in JavaScript.",
        "answer": "Let and const are block-scoped. Const cannot be reassigned. Var is function scoped and hoisted."
    })
    assert res_valid.status_code == 200
    data = res_valid.json()
    assert data["score"] > 50
    assert len(data["strengths"]) > 0
    assert "let" in data["improved_version"].lower() or "const" in data["improved_version"].lower()


def test_evaluate_code(client: TestClient):
    # Test blank code evaluation
    res_blank = client.post("/api/chat/evaluate_code", json={
        "problem_title": "Debounce Function Wrapper",
        "language": "javascript",
        "code": ""
    })
    assert res_blank.status_code == 200
    assert res_blank.json()["score"] == 0
    
    # Test valid debounce code evaluation
    res_valid = client.post("/api/chat/evaluate_code", json={
        "problem_title": "Debounce Function Wrapper",
        "language": "javascript",
        "code": "function debounce(func, delay) { let timeoutId; return function(...args) { clearTimeout(timeoutId); timeoutId = setTimeout(() => func.apply(this, args), delay); } }"
    })
    assert res_valid.status_code == 200
    data = res_valid.json()
    assert data["score"] > 60
    assert len(data["strengths"]) > 0
    assert "timeoutId" in data["improved_version"] or "debounce" in data["improved_version"]
    assert len(data["explanation"]) > 0
