from fastapi import APIRouter

from ..schemas import BasketItems, CustomerFeatures
from ..services.prediction_service import (
    get_prediction_features_value,
    predict_clv_value,
    predict_target_item_value,
)


router = APIRouter()


@router.post("/predict-clv")
async def predict_clv(features: CustomerFeatures):
    return await predict_clv_value(features)


@router.post("/predict-target-item")
async def predict_target_item(basket: BasketItems):
    return await predict_target_item_value(basket)


@router.get("/get-prediction-features")
async def get_prediction_features():
    return get_prediction_features_value()

