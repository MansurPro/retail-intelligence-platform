import pandas as pd
from fastapi import HTTPException
from sqlalchemy import text

from ..config import logger
from ..database import get_sqlalchemy_connection
from .dashboard_service import rename_columns


def search_household(hshd_num: int):
    conn = get_sqlalchemy_connection()

    if conn is None:
        raise HTTPException(status_code=500, detail="Database connection failed")

    query = text("""
        SELECT
            t.hshd_num,
            t.basket_num,
            t.purchase_date,
            t.product_num,
            p.department,
            p.commodity,
            t.spend,
            t.units,
            t.store_region,
            t.week_num,
            t.year,
            h.loyalty_flag,
            h.age_range,
            h.marital_status,
            h.income_range,
            h.homeowner_desc,
            h.hshd_composition,
            h.hshd_size,
            h.children
        FROM transactions t
        JOIN households h ON t.hshd_num = h.hshd_num
        JOIN products p ON t.product_num = p.product_num
        WHERE t.hshd_num = :hshd_num
        ORDER BY
            t.hshd_num,
            t.basket_num,
            t.purchase_date,
            t.product_num,
            p.department,
            p.commodity;
    """)

    try:
        df = pd.read_sql(query, conn, params={"hshd_num": hshd_num})
        df = rename_columns(df, {
            "hshd_num": "Hshd_num",
            "basket_num": "Basket_num",
            "purchase_date": "Date",
            "product_num": "Product_num",
            "department": "Department",
            "commodity": "Commodity",
            "spend": "Spend",
            "units": "Units",
            "store_region": "Store_region",
            "week_num": "Week_num",
            "year": "Year",
            "loyalty_flag": "Loyalty_flag",
            "age_range": "Age_range",
            "marital_status": "Marital_status",
            "income_range": "Income_range",
            "homeowner_desc": "Homeowner_desc",
            "hshd_composition": "Hshd_composition",
            "hshd_size": "Hshd_size",
            "children": "Children",
        })
        df = df.astype(object).where(pd.notnull(df), None)
        return df.to_dict(orient="records")

    except Exception as e:
        logger.error(f"Error searching household {hshd_num}: {e}")
        raise HTTPException(status_code=500, detail="Error fetching household data")
    finally:
        conn.close()

