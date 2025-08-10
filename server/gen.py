import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random

# Generate sales data
start_date = datetime.strptime("2025-07-01", "%Y-%m-%d")
dates = [start_date + timedelta(days=i) for i in range(15)]  # 15 days
product_ids = [f"PROD{str(i).zfill(3)}" for i in range(1, 51)]  # 50 products

data = []
for date in dates:
    for pid in product_ids:
        quantity = np.random.poisson(50)  # average 50 units sold
        day_of_week = date.strftime('%A')
        promotion = random.choice([0, 1])
        data.append([date.strftime('%Y-%m-%d'), pid, quantity, day_of_week, promotion])

sales_df = pd.DataFrame(data, columns=["date", "product_id", "quantity_sold", "day_of_week", "promotion"])
sales_df.to_csv("sales.csv", index=False)
