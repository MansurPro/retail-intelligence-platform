import time

from fastapi import HTTPException

from db.connection import get_engine
from .config import logger


engine = get_engine()


def get_sqlalchemy_connection(max_retries: int = 3, delay_seconds: int = 5):
    """
    Get SQLAlchemy connection with retry.

    Azure SQL serverless/free databases may pause or cold-start.
    Azure App Service may also reuse stale pooled connections.
    """
    last_error = None

    for attempt in range(1, max_retries + 1):
        try:
            return engine.connect()

        except Exception as ex:
            last_error = ex
            logger.error(
                f"SQLAlchemy connection attempt {attempt}/{max_retries} failed: {ex}"
            )

            # Clear stale pooled connections.
            try:
                engine.dispose()
            except Exception as dispose_error:
                logger.warning(f"Engine dispose failed: {dispose_error}")

            if attempt < max_retries:
                time.sleep(delay_seconds)

    logger.error(f"SQLAlchemy connection failed after retries: {last_error}")
    return None


def get_pyodbc_connection(max_retries: int = 3, delay_seconds: int = 5):
    """
    Get raw DB connection with retry.
    Used by auth/register/login.
    """
    last_error = None

    for attempt in range(1, max_retries + 1):
        try:
            return engine.raw_connection()

        except Exception as ex:
            last_error = ex
            logger.error(
                f"Raw DB connection attempt {attempt}/{max_retries} failed: {ex}"
            )

            try:
                engine.dispose()
            except Exception as dispose_error:
                logger.warning(f"Engine dispose failed: {dispose_error}")

            if attempt < max_retries:
                time.sleep(delay_seconds)

    logger.error(f"Raw DB connection failed after retries: {last_error}")
    raise HTTPException(status_code=500, detail="Database connection failed")