import asyncio

import pandas as pd
from apscheduler.schedulers.background import BackgroundScheduler
from fastapi import HTTPException
from mlxtend.frequent_patterns import apriori, association_rules
from mlxtend.preprocessing import TransactionEncoder
from sqlalchemy import text

from ..config import logger
from ..database import get_sqlalchemy_connection


precomputed_data = {}
dashboard_update_in_progress = False
scheduler = BackgroundScheduler(daemon=True)


def rename_columns(df: pd.DataFrame, column_map: dict) -> pd.DataFrame:
    return df.rename(columns=column_map)


def _fetch_top_spenders(conn):
    query = """
        SELECT TOP 10 hshd_num, SUM(spend) AS total_spend
        FROM transactions
        GROUP BY hshd_num
        ORDER BY total_spend DESC;
    """
    df = pd.read_sql(query, conn)
    df = rename_columns(df, {"hshd_num": "Hshd_num"})
    return df.to_dict(orient="records")


def _fetch_loyalty_trends(conn):
    query = """
        SELECT h.loyalty_flag, t.year, t.week_num, SUM(t.spend) AS total_spend
        FROM transactions t
        JOIN households h ON t.hshd_num = h.hshd_num
        GROUP BY h.loyalty_flag, t.year, t.week_num
        ORDER BY t.year, t.week_num, h.loyalty_flag;
    """
    df = pd.read_sql(query, conn)
    df = rename_columns(df, {
        "loyalty_flag": "Loyalty_flag",
        "year": "Year",
        "week_num": "Week_num",
    })
    return df.to_dict(orient="records")


def _fetch_engagement_by_income(conn):
    query = """
        SELECT
            h.income_range AS income_bracket,
            AVG(t.spend) AS avg_spend
        FROM transactions t
        JOIN households h ON t.hshd_num = h.hshd_num
        WHERE h.income_range IS NOT NULL
        GROUP BY h.income_range;
    """
    df = pd.read_sql(query, conn)
    income_order = ["<25K", "25-34K", "35-49K", "50-74K", "75-99K", "100-149K", "150K+"]
    df["income_bracket"] = df["income_bracket"].fillna("Unknown").astype(str).str.strip()

    df.loc[~df["income_bracket"].isin(income_order), "income_bracket"] = "Unknown"

    income_order_with_unknown = income_order + ["Unknown"]

    df["income_bracket"] = pd.Categorical(
        df["income_bracket"],
        categories=income_order_with_unknown,
        ordered=True,
    )
    
    df = df.dropna(subset=["income_bracket"])
    df = df.sort_values("income_bracket")
    return df.to_dict(orient="records")


def _fetch_brand_preference_split(conn):
    query = """
        SELECT
            p.brand_type AS brand_type,
            SUM(t.spend) AS total_spend
        FROM transactions t
        JOIN products p ON t.product_num = p.product_num
        WHERE p.brand_type IS NOT NULL
        GROUP BY p.brand_type
        ORDER BY total_spend DESC;
    """
    df = pd.read_sql(query, conn)
    return df.to_dict(orient="records")


def _fetch_frequent_pairs(conn):
    query = """
        WITH BasketPairs AS (
            SELECT DISTINCT
                t1.basket_num,
                CASE 
                    WHEN t1.product_num < t2.product_num THEN t1.product_num 
                    ELSE t2.product_num 
                END AS product1,
                CASE 
                    WHEN t1.product_num < t2.product_num THEN t2.product_num 
                    ELSE t1.product_num 
                END AS product2
            FROM transactions t1
            JOIN transactions t2 
                ON t1.basket_num = t2.basket_num 
                AND t1.product_num < t2.product_num
        )
        SELECT TOP 10
            p1.commodity AS item1,
            p2.commodity AS item2,
            COUNT(*) AS count
        FROM BasketPairs bp
        JOIN products p1 ON bp.product1 = p1.product_num
        JOIN products p2 ON bp.product2 = p2.product_num
        WHERE p1.commodity <> p2.commodity
        GROUP BY p1.commodity, p2.commodity
        ORDER BY count DESC;
    """
    df = pd.read_sql(query, conn)
    return df.to_dict(orient="records")


def _fetch_popular_products(conn):
    query = """
        SELECT TOP 10
            p.commodity AS commodity,
            SUM(t.spend) AS total_spend
        FROM transactions t
        JOIN products p ON t.product_num = p.product_num
        GROUP BY p.commodity
        ORDER BY total_spend DESC;
    """
    df = pd.read_sql(query, conn)
    return df.to_dict(orient="records")


def _fetch_seasonal_trends(conn):
    query = """
        SELECT
            YEAR(t.purchase_date) AS year,
            MONTH(t.purchase_date) AS month,
            SUM(t.spend) AS total_spend
        FROM transactions t
        GROUP BY YEAR(t.purchase_date), MONTH(t.purchase_date)
        ORDER BY year, month;
    """
    df = pd.read_sql(query, conn)
    return df.to_dict(orient="records")


def _fetch_churn_risk(conn):
    max_date_df = pd.read_sql("SELECT MAX(purchase_date) FROM transactions", conn)

    if max_date_df.empty or max_date_df.iloc[0, 0] is None:
        return {"at_risk_list": [], "summary_stats": {}}

    max_date = pd.to_datetime(max_date_df.iloc[0, 0])
    cutoff_date = max_date - pd.Timedelta(weeks=8)

    query = text("""
        SELECT 
            h.hshd_num,
            MAX(t.purchase_date) AS last_purchase_date,
            h.loyalty_flag,
            h.income_range,
            h.hshd_size,
            h.children
        FROM households h
        JOIN transactions t ON h.hshd_num = t.hshd_num
        GROUP BY 
            h.hshd_num,
            h.loyalty_flag,
            h.income_range,
            h.hshd_size,
            h.children
        HAVING MAX(t.purchase_date) < :cutoff_date
        ORDER BY last_purchase_date ASC;
    """)
    df = pd.read_sql(query, conn, params={"cutoff_date": cutoff_date.strftime("%Y-%m-%d")})

    if df.empty:
        return {"at_risk_list": [], "summary_stats": {"count_by_loyalty": [], "count_by_income": []}}

    df = rename_columns(df, {
        "hshd_num": "Hshd_num",
        "last_purchase_date": "LastPurchaseDate",
        "loyalty_flag": "Loyalty_flag",
        "income_range": "IncomeRange",
        "hshd_size": "HshdSize",
        "children": "Children",
    })
    df["LastPurchaseDate"] = pd.to_datetime(df["LastPurchaseDate"]).dt.strftime("%Y-%m-%d")
    df = df.astype(object).where(pd.notnull(df), None)

    loyalty_counts = df["Loyalty_flag"].value_counts().reset_index()
    loyalty_counts.columns = ["loyalty_flag", "count"]
    income_counts = df["IncomeRange"].value_counts().reset_index()
    income_counts.columns = ["income_range", "count"]

    return {
        "at_risk_list": df.to_dict(orient="records"),
        "summary_stats": {
            "count_by_loyalty": loyalty_counts.to_dict(orient="records"),
            "count_by_income": income_counts.to_dict(orient="records"),
        },
    }


def _fetch_association_rules(conn, min_support=0.01, min_confidence=0.1, top_n=15):
    query = """
        SELECT 
            t.basket_num,
            p.commodity
        FROM transactions t
        JOIN products p ON t.product_num = p.product_num
        WHERE p.commodity IS NOT NULL AND p.commodity <> ''
    """

    try:
        df_trans = pd.read_sql(query, conn)
        if df_trans.empty:
            return []

        basket_groups = df_trans.groupby("basket_num")["commodity"].apply(list).values.tolist()
        basket_sets = [list(set(basket)) for basket in basket_groups]
        te = TransactionEncoder()
        te_ary = te.fit(basket_sets).transform(basket_sets)
        df_encoded = pd.DataFrame(te_ary, columns=te.columns_)
        frequent_itemsets = apriori(df_encoded, min_support=min_support, use_colnames=True)

        if frequent_itemsets.empty:
            return []

        rules = association_rules(frequent_itemsets, metric="confidence", min_threshold=min_confidence)

        if rules.empty:
            return []

        rules = rules.sort_values(by="lift", ascending=False)
        rules["antecedents"] = rules["antecedents"].apply(lambda x: ", ".join(list(x)))
        rules["consequents"] = rules["consequents"].apply(lambda x: ", ".join(list(x)))
        rules_output = rules[["antecedents", "consequents", "support", "confidence", "lift"]].head(top_n)
        rules_output = rules_output.round(4)
        return rules_output.to_dict(orient="records")

    except Exception as e:
        logger.error(f"Association rule generation failed: {e}")
        return []


async def update_dashboard_data():
    global dashboard_update_in_progress
    global precomputed_data

    if dashboard_update_in_progress:
        logger.warning("Dashboard update already in progress. Skipping.")
        return

    dashboard_update_in_progress = True
    logger.info("Updating dashboard data...")

    endpoints_to_update = {
        "top-spenders": _fetch_top_spenders,
        "loyalty-trends": _fetch_loyalty_trends,
        "engagement-by-income": _fetch_engagement_by_income,
        "brand-preference-split": _fetch_brand_preference_split,
        "frequent-pairs": _fetch_frequent_pairs,
        "popular-products": _fetch_popular_products,
        "seasonal-trends": _fetch_seasonal_trends,
        "churn-risk": _fetch_churn_risk,
        "association-rules": _fetch_association_rules,
    }

    conn = None

    try:
        conn = get_sqlalchemy_connection()
        if conn is None:
            logger.error("Could not connect to DB for dashboard update.")
            return

        temp_data = {}
        for key, fetch_func in endpoints_to_update.items():
            try:
                temp_data[key] = fetch_func(conn)
                logger.info(f"Updated dashboard data: {key}")
            except Exception as e:
                logger.error(f"Failed to update {key}: {e}")
                temp_data[key] = precomputed_data.get(key, {"error": str(e)})

        precomputed_data = temp_data

    finally:
        if conn:
            conn.close()
        dashboard_update_in_progress = False
        logger.info("Dashboard update finished.")


def scheduled_dashboard_update():
    asyncio.run(update_dashboard_data())


def is_dashboard_update_in_progress() -> bool:
    return dashboard_update_in_progress


def get_cached_dashboard_data(key: str):
    data = precomputed_data.get(key)

    if data is None:
        raise HTTPException(status_code=503, detail="Data is still calculating. Try again soon.")

    if isinstance(data, dict) and "error" in data:
        raise HTTPException(status_code=500, detail=f"Could not get data: {data['error']}")

    return data


scheduler.add_job(
    scheduled_dashboard_update,
    "interval",
    hours=1,
    id="dashboard_update_job",
    replace_existing=True,
)

