from sqlalchemy import text
from db.connection import get_engine


def check_data():
    engine = get_engine()

    with engine.connect() as conn:
        for table in ["households", "products", "transactions", "users"]:
            count = conn.execute(text(f"SELECT COUNT(*) FROM {table}")).scalar()
            print(f"{table}: {count}")

        sample = conn.execute(
            text("""
                SELECT TOP 10
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
                WHERE t.hshd_num = 10
                ORDER BY
                    t.hshd_num,
                    t.basket_num,
                    t.purchase_date,
                    t.product_num,
                    p.department,
                    p.commodity
            """)
        ).fetchall()

        print("\nSample HSHD_NUM = 10:")
        for row in sample:
            print(row)


if __name__ == "__main__":
    check_data()