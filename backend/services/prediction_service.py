import pandas as pd
from fastapi import HTTPException
from fastapi.concurrency import run_in_threadpool

from ..config import logger
from ..models_loader import TARGET_ITEM_NAME, basket_features, basket_model, clv_model
from ..schemas import BasketItems, CustomerFeatures


def parse_income_range(range_str: str) -> float:
    if not range_str:
        return 0.0

    original_input = range_str
    range_str = range_str.strip().lower().replace(" ", "")
    multiplier = 1000 if "k" in range_str else 1
    range_str = range_str.replace("k", "").replace("+", "").replace("$", "")

    try:
        if "-" in range_str:
            low, high = map(float, range_str.split("-"))
            return (low + high) / 2 * multiplier
        if "<" in range_str:
            val = float(range_str.replace("<", ""))
            return val / 2 * multiplier
        if ">" in range_str:
            val = float(range_str.replace(">", ""))
            return val * 1.5 * multiplier
        return float(range_str) * multiplier
    except ValueError:
        logger.warning(f"Could not parse income range: {original_input}")
        return 0.0


async def predict_clv_value(features: CustomerFeatures):
    if clv_model is None:
        raise HTTPException(status_code=503, detail="CLV model is not available.")

    try:
        parsed_income = parse_income_range(features.income_range)
        input_df = pd.DataFrame(
            [[parsed_income, features.hh_size, features.children]],
            columns=["income_range_numeric", "HSHD_SIZE", "CHILDREN"],
        )
        prediction = await run_in_threadpool(clv_model.predict, input_df)
        return {"predicted_clv": round(float(prediction[0]), 2)}

    except Exception as e:
        logger.error(f"CLV prediction failed: {e}")
        raise HTTPException(status_code=500, detail="Could not predict CLV.")


async def predict_target_item_value(basket: BasketItems):
    if basket_model is None or basket_features is None:
        raise HTTPException(status_code=503, detail="Basket prediction model is not available.")

    try:
        input_data = pd.DataFrame(0, index=[0], columns=basket_features)
        valid_items = []

        for commodity in basket.commodities:
            if commodity in input_data.columns:
                input_data[commodity] = 1
                valid_items.append(commodity)

        probabilities = await run_in_threadpool(basket_model.predict_proba, input_data)
        target_probability = probabilities[0][1]

        return {
            "target_item": TARGET_ITEM_NAME,
            "probability": round(float(target_probability) * 100, 2),
            "used_items": valid_items,
        }

    except Exception as e:
        logger.error(f"Basket prediction failed: {e}")
        raise HTTPException(status_code=500, detail="Could not predict basket item.")


def get_prediction_features_value():
    if basket_features is None:
        raise HTTPException(status_code=503, detail="Basket features are not available.")
    return {"features": basket_features}

