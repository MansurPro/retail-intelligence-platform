import logging
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent

CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "https://cloud-comp-retail.vercel.app",
]

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("backend")

