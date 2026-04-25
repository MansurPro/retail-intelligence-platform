import io

import pandas as pd
from fastapi import HTTPException, UploadFile
from fastapi.concurrency import run_in_threadpool
from sqlalchemy import text

from ..config import logger
from ..database import engine
from .dashboard_service import update_dashboard_data


def normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
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

    for col in df.select_dtypes(include=["object", "string"]).columns:
        df[col] = df[col].astype(str).str.strip()

    return df.replace({
        "": None,
        "nan": None,
        "NaN": None,
        "NULL": None,
        "null": None,
        "None": None,
    })


def ensure_columns(df: pd.DataFrame, expected: list[str]) -> pd.DataFrame:
    df = df.copy()
    for col in expected:
        if col not in df.columns:
            df[col] = None
    return df[expected]


def clean_uploaded_households(df: pd.DataFrame) -> pd.DataFrame:
    df = normalize_columns(df)
    df = df.rename(columns={
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
    })

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
    df = df.where(pd.notnull(df), None)
    return df[expected]


def clean_uploaded_products(df: pd.DataFrame) -> pd.DataFrame:
    df = normalize_columns(df)
    df = df.rename(columns={
        "product_num": "product_num",
        "department": "department",
        "commodity": "commodity",
        "brand_ty": "brand_type",
        "brand_type": "brand_type",
        "natural_organic_flag": "natural_organic_flag",
    })

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
    df = df.drop_duplicates(subset=["product_num"], keep="first")
    df = df.where(pd.notnull(df), None)
    return df[expected]


def clean_uploaded_transactions(df: pd.DataFrame) -> pd.DataFrame:
    df = normalize_columns(df)
    df = df.rename(columns={
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
    })

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
    df["purchase_date"] = pd.to_datetime(df["purchase_date"], errors="coerce")
    df = df.dropna(subset=["hshd_num", "basket_num", "product_num", "purchase_date"])

    for col in ["hshd_num", "basket_num", "product_num", "units", "week_num", "year"]:
        df[col] = df[col].fillna(0).astype(int)

    df["spend"] = df["spend"].fillna(0.0).astype(float)
    df = df.drop_duplicates()
    df = df.where(pd.notnull(df), None)
    return df[expected]


async def process_upload(file: UploadFile, table_name: str):
    contents = await file.read()
    data_io = io.BytesIO(contents)

    try:
        raw_df = pd.read_csv(data_io)

        if table_name == "households":
            df = clean_uploaded_households(raw_df)
            delete_sql = "DELETE FROM households"
        elif table_name == "products":
            df = clean_uploaded_products(raw_df)
            delete_sql = "DELETE FROM products"
        elif table_name == "transactions":
            df = clean_uploaded_transactions(raw_df)
            delete_sql = "DELETE FROM transactions"
        else:
            raise HTTPException(status_code=400, detail="Invalid table name.")

        if df.empty:
            raise HTTPException(status_code=400, detail="Uploaded CSV has no valid rows.")

        def load_table():
            with engine.begin() as conn:
                conn.execute(text(delete_sql))
                df.to_sql(
                    table_name,
                    conn,
                    if_exists="append",
                    index=False,
                    chunksize=5000 if table_name == "transactions" else 1000,
                    method=None,
                )

        await run_in_threadpool(load_table)
        await update_dashboard_data()

        return {
            "message": f"{table_name} uploaded and loaded successfully.",
            "rows_loaded": len(df),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Upload failed for {table_name}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Could not process {table_name} upload.")
    finally:
        await file.close()

