import logging
from pathlib import Path

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split

from db.connection import get_engine


logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


TARGET_COMMODITY = "DAIRY"
MODEL_OUTPUT_PATH = Path("models") / "basket_rf_dairy_model.pkl"
TEST_SIZE = 0.3
RANDOM_STATE = 42


def fetch_data(conn) -> pd.DataFrame:
    logger.info("Fetching basket transaction data...")

    query = """
        SELECT
            t.basket_num,
            p.commodity
        FROM transactions t
        JOIN products p ON t.product_num = p.product_num
        WHERE p.commodity IS NOT NULL
          AND p.commodity <> ''
    """

    df = pd.read_sql(query, conn)
    logger.info(f"Fetched {len(df)} transaction rows.")

    return df


def preprocess_data(df: pd.DataFrame, target_commodity: str):
    logger.info("Preprocessing basket data...")

    df = df.dropna(subset=["basket_num", "commodity"])
    df["commodity"] = df["commodity"].astype(str).str.strip().str.upper()

    target_commodity = target_commodity.upper()

    if target_commodity not in df["commodity"].unique():
        valid_commodities = sorted(df["commodity"].unique().tolist())
        logger.error(f"Target commodity '{target_commodity}' not found.")
        logger.error(f"Available commodities sample: {valid_commodities[:50]}")
        raise ValueError(f"Target commodity '{target_commodity}' is not in the data.")

    basket_matrix = pd.crosstab(df["basket_num"], df["commodity"])
    basket_matrix = (basket_matrix > 0).astype(int)

    if target_commodity not in basket_matrix.columns:
        raise ValueError(f"Target column '{target_commodity}' not found in basket matrix.")

    y = basket_matrix[target_commodity]
    X = basket_matrix.drop(columns=[target_commodity])

    if y.nunique() < 2:
        raise ValueError(f"Target variable '{target_commodity}' is constant. Cannot train model.")

    logger.info(f"Basket matrix shape: {basket_matrix.shape}")
    logger.info(f"Features shape: {X.shape}")
    logger.info(f"Target distribution:\n{y.value_counts(normalize=True)}")

    return X, y


def train_evaluate_model(X, y):
    logger.info("Splitting train/test data...")

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=TEST_SIZE,
        random_state=RANDOM_STATE,
        stratify=y,
    )

    logger.info("Training Random Forest classifier...")

    model = RandomForestClassifier(
        n_estimators=100,
        random_state=RANDOM_STATE,
        class_weight="balanced",
        n_jobs=-1,
    )

    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)

    accuracy = accuracy_score(y_test, y_pred)
    report = classification_report(y_test, y_pred, target_names=["Absent", "Present"])

    logger.info(f"Accuracy: {accuracy:.4f}")
    logger.info(f"Classification report:\n{report}")

    feature_importances = pd.Series(model.feature_importances_, index=X.columns)
    logger.info(f"Top 10 important commodities:\n{feature_importances.nlargest(10)}")

    return model


def save_model(model, features, filepath: Path):
    logger.info(f"Saving model to {filepath}...")

    filepath.parent.mkdir(parents=True, exist_ok=True)

    model_data = {
        "model": model,
        "features": features.tolist(),
    }

    joblib.dump(model_data, filepath)

    logger.info("Model saved successfully.")


def main():
    logger.info("--- Starting Basket Prediction Model Training ---")

    engine = get_engine()

    with engine.connect() as conn:
        df_transactions = fetch_data(conn)

    if df_transactions.empty:
        logger.warning("No transaction data found. Skipping training.")
        return

    X_features, y_target = preprocess_data(df_transactions, TARGET_COMMODITY)
    model = train_evaluate_model(X_features, y_target)
    save_model(model, X_features.columns, MODEL_OUTPUT_PATH)

    logger.info("--- Training finished ---")


if __name__ == "__main__":
    main()