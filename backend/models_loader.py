import joblib

from .config import BASE_DIR, logger


clv_model = None
try:
    clv_model = joblib.load(BASE_DIR / "models" / "clv_model.pkl")
    logger.info("Loaded CLV model.")
except Exception as e:
    logger.warning(f"CLV model could not be loaded: {e}")


basket_model_data = None
basket_model = None
basket_features = None
BASKET_MODEL_PATH = BASE_DIR / "models" / "basket_rf_dairy_model.pkl"
TARGET_ITEM_NAME = "DAIRY"

try:
    basket_model_data = joblib.load(BASKET_MODEL_PATH)
    basket_model = basket_model_data["model"]
    basket_features = basket_model_data["features"]
    logger.info(f"Loaded basket model with {len(basket_features)} features.")
except Exception as e:
    logger.warning(f"Basket model could not be loaded: {e}")

