from pathlib import Path

import pandas as pd
from sqlalchemy import text

from db.connection import get_engine


BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"

HOUSEHOLDS_CSV = DATA_DIR / "400_households.csv"
TRANSACTIONS_CSV = DATA_DIR / "400_transactions.csv"
PRODUCTS_CSV = DATA_DIR / "400_products.csv"


def normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    """
    Normalize messy CSV headers like:
    '     SPEND' -> 'spend'
    'PURCHASE_' -> 'purchase'
    'BRAND_TY' -> 'brand_ty'
    """
    df = df.copy()
    df.columns = (
        df.columns
        .str.strip()
        .str.lower()
        .str.replace(" ", "_", regex=False)
        .str.replace("-", "_", regex=False)
    )
    df.columns = df.columns.str.replace("_+", "_", regex=True).str.strip("_")
    return df


def clean_text_values(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()

    # Strip whitespace from all string/object columns
    for col in df.select_dtypes(include=["object", "string"]).columns:
        df[col] = df[col].astype(str).str.strip()

    # Convert common missing-value strings back to None
    df = df.replace(
        {
            "": None,
            "nan": None,
            "NaN": None,
            "NULL": None,
            "null": None,
            "None": None,
        }
    )

    return df


def ensure_columns(df: pd.DataFrame, expected: list[str]) -> pd.DataFrame:
    df = df.copy()
    for col in expected:
        if col not in df.columns:
            df[col] = None
    return df[expected]


def clean_households() -> pd.DataFrame:
    df = pd.read_csv(HOUSEHOLDS_CSV)
    df = normalize_columns(df)

    rename_map = {
        "hshd_num": "hshd_num",
        "l": "loyalty_flag",
        "loyalty_flag": "loyalty_flag",
        "age_range": "age_range",
        "marital": "marital_status",
        "marital_status": "marital_status",
        "income_range": "income_range",
        "homeowner": "homeowner_desc",
        "homeowner_desc": "homeowner_desc",
        "hshd_composition": "hshd_composition",
        "hh_size": "hshd_size",
        "hshd_size": "hshd_size",
        "children": "children",
    }

    df = df.rename(columns=rename_map)

    expected = [
        "hshd_num",
        "loyalty_flag",
        "age_range",
        "marital_status",
        "income_range",
        "homeowner_desc",
        "hshd_composition",
        "hshd_size",
        "children",
    ]

    df = ensure_columns(df, expected)
    df = clean_text_values(df)

    df["hshd_num"] = pd.to_numeric(df["hshd_num"], errors="coerce")
    df["hshd_size"] = pd.to_numeric(df["hshd_size"], errors="coerce")
    df["children"] = pd.to_numeric(df["children"], errors="coerce")

    df = df.dropna(subset=["hshd_num"])
    df["hshd_num"] = df["hshd_num"].astype(int)

    # SQL Server accepts None better than NaN
    df = df.where(pd.notnull(df), None)

    return df[expected]


def clean_products() -> pd.DataFrame:
    df = pd.read_csv(PRODUCTS_CSV)
    df = normalize_columns(df)

    rename_map = {
        "product_num": "product_num",
        "department": "department",
        "commodity": "commodity",
        "brand_ty": "brand_type",
        "brand_type": "brand_type",
        "natural_organic_flag": "natural_organic_flag",
    }

    df = df.rename(columns=rename_map)

    expected = [
        "product_num",
        "department",
        "commodity",
        "brand_type",
        "natural_organic_flag",
    ]

    df = ensure_columns(df, expected)
    df = clean_text_values(df)

    df["product_num"] = pd.to_numeric(df["product_num"], errors="coerce")
    df = df.dropna(subset=["product_num"])
    df["product_num"] = df["product_num"].astype(int)

    # Avoid duplicate product primary keys
    df = df.drop_duplicates(subset=["product_num"], keep="first")

    df = df.where(pd.notnull(df), None)

    return df[expected]


def clean_transactions() -> pd.DataFrame:
    df = pd.read_csv(TRANSACTIONS_CSV)
    df = normalize_columns(df)

    rename_map = {
        "basket_num": "basket_num",
        "hshd_num": "hshd_num",
        "purchase": "purchase_date",
        "purchase_": "purchase_date",
        "date": "purchase_date",
        "purchase_date": "purchase_date",
        "product_num": "product_num",
        "spend": "spend",
        "units": "units",
        "store_r": "store_region",
        "store_region": "store_region",
        "week_num": "week_num",
        "year": "year",
    }

    df = df.rename(columns=rename_map)

    expected = [
        "hshd_num",
        "basket_num",
        "purchase_date",
        "product_num",
        "spend",
        "units",
        "store_region",
        "week_num",
        "year",
    ]

    df = ensure_columns(df, expected)
    df = clean_text_values(df)

    df["hshd_num"] = pd.to_numeric(df["hshd_num"], errors="coerce")
    df["basket_num"] = pd.to_numeric(df["basket_num"], errors="coerce")
    df["product_num"] = pd.to_numeric(df["product_num"], errors="coerce")
    df["spend"] = pd.to_numeric(df["spend"], errors="coerce")
    df["units"] = pd.to_numeric(df["units"], errors="coerce")
    df["week_num"] = pd.to_numeric(df["week_num"], errors="coerce")
    df["year"] = pd.to_numeric(df["year"], errors="coerce")

    # Your file uses dates like 18-JUL-19
    df["purchase_date"] = pd.to_datetime(
        df["purchase_date"],
        errors="coerce",
        format="%d-%b-%y",
    )

    df = df.dropna(
        subset=[
            "hshd_num",
            "basket_num",
            "product_num",
            "purchase_date",
        ]
    )

    int_cols = [
        "hshd_num",
        "basket_num",
        "product_num",
        "units",
        "week_num",
        "year",
    ]

    for col in int_cols:
        df[col] = df[col].fillna(0).astype(int)

    df["spend"] = df["spend"].fillna(0.0).astype(float)

    # Remove exact duplicate rows, if any
    df = df.drop_duplicates()

    df = df.where(pd.notnull(df), None)

    return df[expected]


def truncate_tables(engine):
    with engine.begin() as conn:
        conn.execute(text("DELETE FROM transactions"))
        conn.execute(text("DELETE FROM products"))
        conn.execute(text("DELETE FROM households"))


def load_data():
    engine = get_engine()

    print("Cleaning households...")
    households = clean_households()

    print("Cleaning products...")
    products = clean_products()

    print("Cleaning transactions...")
    transactions = clean_transactions()

    print(f"Households rows: {len(households)}")
    print(f"Products rows: {len(products)}")
    print(f"Transactions rows: {len(transactions)}")

    truncate_tables(engine)

    print("Loading households...")
    households.to_sql(
        "households",
        engine,
        if_exists="append",
        index=False,
        chunksize=1000,
        method=None,
    )

    print("Loading products...")
    products.to_sql(
        "products",
        engine,
        if_exists="append",
        index=False,
        chunksize=1000,
        method=None,
    )

    print("Loading transactions...")
    transactions.to_sql(
        "transactions",
        engine,
        if_exists="append",
        index=False,
        chunksize=5000,
        method=None,
    )

    print("CSV data loaded successfully.")


if __name__ == "__main__":
    load_data()