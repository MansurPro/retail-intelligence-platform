from fastapi import HTTPException

from db.connection import get_engine

from .config import logger


engine = get_engine()


def get_sqlalchemy_connection():
    try:
        return engine.connect()
    except Exception as ex:
        logger.error(f"SQLAlchemy connection failed: {ex}")
        return None


def get_pyodbc_connection():
    try:
        return engine.raw_connection()
    except Exception as ex:
        logger.error(f"Raw DB connection failed: {ex}")
        raise HTTPException(status_code=500, detail="Database connection failed")

