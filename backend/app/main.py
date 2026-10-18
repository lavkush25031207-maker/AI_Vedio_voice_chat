import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Ensure models are imported so SQLModel registers them in metadata
import app.models
from app.database import DATABASE_URL, init_db
from app.routers.profile import router as profile_router
from app.routers.chat import router as chat_router

# Load local environment variables
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
load_dotenv(dotenv_path=env_path)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Modern lifespan management hook in FastAPI. 
    Triggers local SQLite schema creation automatically upon server launch.
    """
    # Create SQLite database and tables
    init_db()
    yield

app = FastAPI(
    title="TalkFlow AI API",
    description="Backend routing API supporting student profile records, real-time doubts chat, and AI interview simulations",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS Middleware
# Allows smooth client communication from React frontend (port 5173) to FastAPI server
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        os.getenv("APP_PUBLIC_URL", "https://talkflow-frontend.onrender.com"),
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register endpoints routers
app.include_router(profile_router)
app.include_router(chat_router)

@app.get("/api/status")
async def get_status():
    """
    Health check endpoint to verify that the FastAPI backend server is active and accessible.
    """
    return {
        "status": "ok",
        "message": "TalkFlow AI server is online and running",
        "environment": DATABASE_URL
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
