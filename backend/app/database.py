import os

from dotenv import load_dotenv
from sqlmodel import SQLModel, Session, create_engine

env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
load_dotenv(dotenv_path=env_path)

# Render supplies DATABASE_URL from the managed PostgreSQL database. SQLite remains
# the local-development fallback.
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./talkflow.db")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg://", 1)
elif DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(
    DATABASE_URL,
    echo=os.getenv("SQL_ECHO", "0") == "1",
    connect_args=connect_args,
)


def init_db():
    """Create any missing tables in the configured database."""
    SQLModel.metadata.create_all(engine)


def get_session():
    """Yield a database session for a request."""
    with Session(engine) as session:
        yield session
