import json

from sqlalchemy import text

from backend.database import get_sqlalchemy_connection
from backend.config import logger


def _ensure_cache_table(conn):
    conn.execute(
        text("""
            IF OBJECT_ID('dashboard_cache', 'U') IS NULL
            CREATE TABLE dashboard_cache (
                cache_key VARCHAR(100) PRIMARY KEY,
                data NVARCHAR(MAX) NOT NULL,
                updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
            );
        """)
    )
    conn.commit()


def get_cache(cache_key: str):
    conn = get_sqlalchemy_connection()

    if conn is None:
        logger.error(f"Could not connect to DB while reading cache: {cache_key}")
        return None

    try:
        _ensure_cache_table(conn)

        row = conn.execute(
            text("""
                SELECT data, updated_at
                FROM dashboard_cache
                WHERE cache_key = :cache_key
            """),
            {"cache_key": cache_key},
        ).fetchone()

        if not row:
            return None

        row_data = row._mapping
        return {
            "data": json.loads(row_data["data"]),
            "updated_at": row_data["updated_at"],
        }

    except Exception as e:
        logger.error(f"Failed to read dashboard cache {cache_key}: {e}")
        return None

    finally:
        conn.close()


def set_cache(cache_key: str, data):
    conn = get_sqlalchemy_connection()

    if conn is None:
        logger.error(f"Could not connect to DB while writing cache: {cache_key}")
        return False

    try:
        _ensure_cache_table(conn)
        json_data = json.dumps(data, default=str)

        conn.execute(
            text("""
                MERGE dashboard_cache AS target
                USING (
                    SELECT 
                        :cache_key AS cache_key,
                        :data AS data
                ) AS source
                ON target.cache_key = source.cache_key
                WHEN MATCHED THEN
                    UPDATE SET 
                        data = source.data,
                        updated_at = SYSUTCDATETIME()
                WHEN NOT MATCHED THEN
                    INSERT (cache_key, data, updated_at)
                    VALUES (source.cache_key, source.data, SYSUTCDATETIME());
            """),
            {
                "cache_key": cache_key,
                "data": json_data,
            },
        )

        conn.commit()
        return True

    except Exception as e:
        logger.error(f"Failed to write dashboard cache {cache_key}: {e}")
        return False

    finally:
        conn.close()
