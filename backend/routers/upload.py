from fastapi import APIRouter, File, UploadFile

from ..services.upload_service import process_upload


router = APIRouter()


@router.post("/upload/transactions")
async def upload_transactions(file: UploadFile = File(...)):
    return await process_upload(file, "transactions")


@router.post("/upload/households")
async def upload_households(file: UploadFile = File(...)):
    return await process_upload(file, "households")


@router.post("/upload/products")
async def upload_products(file: UploadFile = File(...)):
    return await process_upload(file, "products")

