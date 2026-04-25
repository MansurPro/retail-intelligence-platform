from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from .config import CORS_ORIGINS, logger
from .routers import auth, dashboard, prediction, search, upload
from .services.dashboard_service import scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("App starting...")
    scheduler.start()
    # await update_dashboard_data()
    logger.info("App started.")

    yield

    logger.info("App shutting down...")
    scheduler.shutdown(wait=False)


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(prediction.router)
app.include_router(search.router)
app.include_router(upload.router)


@app.get("/")
async def root():
    return {"message": "Retail Intelligence API is running."}


@app.get("/health")
async def health_check():
    return {"status": "ok"}


@app.options("/{rest_of_path:path}")
async def preflight_handler(rest_of_path: str, request: Request):
    return {}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )

