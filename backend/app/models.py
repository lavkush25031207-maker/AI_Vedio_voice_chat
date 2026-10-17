from typing import Optional
from sqlmodel import SQLModel, Field, TEXT

class StudentProfile(SQLModel, table=True):
    """
    SQLModel representation mapping to the student_profile database table.
    Tracks local user profile attributes for interview customized context.
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(default="", index=True)
    password: str = Field(default="")
    name: Optional[str] = Field(default="Student")
    target_role: str = Field(default="Frontend Developer")
    skills: str = Field(default="", sa_type=TEXT)
    experience_level: str = Field(default="Fresher")
    target_category: str = Field(default="Mock Technical Interview")

class SessionHistory(SQLModel, table=True):
    """
    SQLModel representation mapping to the session_history database table.
    Stores logs of completed text chat sessions, voice practice sessions, and mock calls.
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    profile_id: Optional[int] = Field(default=None, foreign_key="studentprofile.id")
    type: str  # 'Mock Technical Interview', 'HR Behavioral Round', or 'Concept Explainer'
    score: int = Field(default=0)
    duration_seconds: int = Field(default=0)
    feedback: str = Field(default="", sa_type=TEXT)
    created_at: str = Field(default="")

class ChatMessage(SQLModel, table=True):
    """
    SQLModel representation mapping to the chat_message database table.
    Stores individual messages inside a session for context recovery.
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    session_id: int = Field(foreign_key="sessionhistory.id")
    role: str  # 'user' or 'model'
    content: str = Field(sa_type=TEXT)
    created_at: str = Field(default="")
