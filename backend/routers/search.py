from fastapi import APIRouter

from ..services.search_service import search_household


router = APIRouter()


@router.get("/household-search/{hshd_num}")
async def household_search(hshd_num: int):
    return search_household(hshd_num)

