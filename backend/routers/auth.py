from fastapi import APIRouter, HTTPException

from ..config import logger
from ..database import get_pyodbc_connection
from ..schemas import UserCreate, UserLogin
from ..security import get_password_hash, verify_password


router = APIRouter()


@router.post("/register")
async def register_user(user: UserCreate):
    conn = get_pyodbc_connection()

    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id FROM users WHERE username = ? OR email = ?",
            (user.username, user.email),
        )

        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Username or email already taken.")

        hashed_password = get_password_hash(user.password)
        cursor.execute(
            "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
            (user.username, user.email, hashed_password),
        )
        conn.commit()

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"User registration failed for {user.username}: {e}")
        try:
            conn.rollback()
        except Exception:
            pass
        raise HTTPException(status_code=500, detail="Could not register user.")
    finally:
        conn.close()

    return {"message": "User registered successfully."}


@router.post("/login")
async def login_user(user_login: UserLogin):
    conn = get_pyodbc_connection()

    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id, username, password FROM users WHERE username = ?",
            (user_login.username,),
        )
        db_user = cursor.fetchone()

        if not db_user:
            raise HTTPException(status_code=401, detail="Incorrect username or password")

        if not verify_password(user_login.password, db_user.password):
            raise HTTPException(status_code=401, detail="Incorrect username or password")

        return {"message": "Login successful", "username": db_user.username}

    finally:
        conn.close()

