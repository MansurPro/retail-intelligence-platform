import asyncio

from fastapi import APIRouter

from ..services.dashboard_service import (
    get_cached_dashboard_data,
    is_dashboard_update_in_progress,
    update_dashboard_data,
)


router = APIRouter()


@router.get("/dashboard-update-status")
async def get_dashboard_update_status():
    return {"updating": is_dashboard_update_in_progress()}


@router.post("/refresh-dashboard")
async def refresh_dashboard():
    asyncio.create_task(update_dashboard_data())
    return {"message": "Dashboard refresh started."}


@router.get("/top-spenders")
async def top_spenders():
    return get_cached_dashboard_data("top-spenders")


@router.get("/loyalty-trends")
async def loyalty_trends():
    return get_cached_dashboard_data("loyalty-trends")


@router.get("/engagement-by-income")
async def engagement_by_income():
    return get_cached_dashboard_data("engagement-by-income")


@router.get("/brand-preference-split")
async def brand_preference_split():
    return get_cached_dashboard_data("brand-preference-split")


@router.get("/frequent-pairs")
async def frequent_pairs():
    return get_cached_dashboard_data("frequent-pairs")


@router.get("/popular-products")
async def popular_products():
    return get_cached_dashboard_data("popular-products")


@router.get("/seasonal-trends")
async def seasonal_trends():
    return get_cached_dashboard_data("seasonal-trends")


@router.get("/churn-risk")
async def churn_risk():
    return get_cached_dashboard_data("churn-risk")


@router.get("/association-rules")
async def association_rules_endpoint():
    return get_cached_dashboard_data("association-rules")
