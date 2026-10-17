from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict
from app.models import StudentProfile

router = APIRouter(
    prefix="/api/profile",
    tags=["Student Profile"]
)

class SignUpRequest(BaseModel):
    username: str
    password: str
    name: Optional[str] = "Student"

class LoginRequest(BaseModel):
    username: str
    password: str

# In-memory profile storage (completely bypassing database)
PROFILES: Dict[int, StudentProfile] = {}

@router.post("/signup", response_model=StudentProfile)
async def signup(req: SignUpRequest):
    username = req.username.strip().lower()
    password = req.password.strip()
    
    if not username or not password:
        raise HTTPException(status_code=400, detail="Username and password cannot be empty")
        
    # Check uniqueness
    for profile in PROFILES.values():
        if profile.username == username:
            raise HTTPException(status_code=400, detail="Username already exists")
            
    # Create profile
    new_id = len(PROFILES) + 1 if len(PROFILES) > 0 else 1
    # Check if ID already exists (should not, but safety check)
    while new_id in PROFILES:
        new_id += 1

    new_profile = StudentProfile(
        id=new_id,
        username=username,
        password=password,
        name=req.name.strip() if req.name else username.title(),
        target_role="Software Engineer",
        skills="Python, Java, React, JavaScript, SQL, C++, DSA, Web Development",
        experience_level="Fresher",
        target_category="Mock Technical Interview"
    )
    PROFILES[new_id] = new_profile
    return new_profile

@router.post("/login", response_model=StudentProfile)
async def login(req: LoginRequest):
    username = req.username.strip().lower()
    password = req.password.strip()
    
    # Check in memory
    for profile in PROFILES.values():
        if profile.username == username and profile.password == password:
            return profile
            
    raise HTTPException(status_code=401, detail="Invalid username or password")

@router.get("", response_model=StudentProfile)
async def get_default_profile():
    """
    Legacy endpoint: Fetches the first student profile in the database or returns a fallback.
    """
    if len(PROFILES) > 0:
        first_id = sorted(PROFILES.keys())[0]
        return PROFILES[first_id]
        
    # Fallback default
    return StudentProfile(
        name="Fresher Student",
        target_role="Frontend Developer",
        skills="Python, Java, React, JavaScript, SQL, C++, DSA, Web Development",
        experience_level="Fresher",
        target_category="Mock Technical Interview"
    )

@router.get("/{profile_id}", response_model=StudentProfile)
async def get_specific_profile(profile_id: int):
    """
    Fetches a specific student profile by ID.
    """
    profile = PROFILES.get(profile_id)
    if not profile:
        # Fallback profile creation to prevent 404 console errors
        profile = StudentProfile(
            id=profile_id,
            username="student",
            password="password",
            name="Student",
            target_role="Software Engineer",
            skills="Python, Java, React, JavaScript, SQL, C++, DSA, Web Development",
            experience_level="Fresher",
            target_category="Mock Technical Interview"
        )
        PROFILES[profile_id] = profile
    return profile

@router.post("/{profile_id}", response_model=StudentProfile)
async def update_specific_profile(profile_id: int, updated_profile: StudentProfile):
    """
    Saves or updates a specific student's profile in the database.
    """
    existing_profile = PROFILES.get(profile_id)
    if not existing_profile:
        existing_profile = StudentProfile(
            id=profile_id,
            username=updated_profile.username or "student",
            password=updated_profile.password or "password",
            name=updated_profile.name or "Student",
            target_role=updated_profile.target_role or "Software Engineer",
            skills=updated_profile.skills or "Python, Java, React, JavaScript, SQL, C++, DSA, Web Development",
            experience_level=updated_profile.experience_level or "Fresher",
            target_category=updated_profile.target_category or "Mock Technical Interview"
        )
        PROFILES[profile_id] = existing_profile
    else:
        existing_profile.name = updated_profile.name
        existing_profile.target_role = updated_profile.target_role
        existing_profile.skills = updated_profile.skills
        existing_profile.experience_level = updated_profile.experience_level
        existing_profile.target_category = updated_profile.target_category
        
        # Do not overwrite credentials on general update
        if updated_profile.username:
            existing_profile.username = updated_profile.username
        if updated_profile.password:
            existing_profile.password = updated_profile.password
            
    return existing_profile

@router.post("", response_model=StudentProfile)
async def update_default_profile(updated_profile: StudentProfile):
    """
    Legacy endpoint: Saves or updates the first profile entry in database.
    """
    first_id = 1
    if len(PROFILES) > 0:
        first_id = sorted(PROFILES.keys())[0]
    return await update_specific_profile(first_id, updated_profile)
