from pathlib import Path
from sqlalchemy import text

from db.connection import get_engine


BASE_DIR = Path(__file__).resolve().parent
SCHEMA_PATH = BASE_DIR / "schema.sql"


def setup_database():
    engine = get_engine()

    schema_sql = SCHEMA_PATH.read_text()

    with engine.begin() as conn:
        conn.execute(text(schema_sql))

    print("Tables created successfully.")


if __name__ == "__main__":
    setup_database()