# 🛒 Retail Intelligence Platform

A full-stack cloud-based retail analytics platform built with **FastAPI**, **React + Vite**, **Azure SQL Database**, and **Machine Learning**.  
The project analyzes anonymized 84.51° / Kroger-style retail transaction data to help understand customer behavior, spending patterns, churn risk, product preferences, basket relationships, and customer lifetime value.

---

## 📌 Project Overview

The **Retail Intelligence Platform** is an end-to-end data science and cloud computing application designed for the final group project:  
**Data Science and Analytics Using Azure Cloud Computing Technologies**.

The platform supports:

- Secure user registration and login
- Azure SQL-backed retail data storage
- Household-level transaction search
- Interactive dashboard visualizations
- Customer Lifetime Value prediction
- Basket and cross-sell prediction
- Churn risk analysis
- CSV upload and database refresh
- Persistent SQL-backed dashboard cache for stable Azure deployment

The system is designed around the retail objective:

> **Make the customer's life easier through data-driven insights.**

---

## 🚀 Live Deployment

### Backend API

```text
https://retail-api-group-54-hxgyadaravgjb2e9.northcentralus-01.azurewebsites.net
````

### Important API URLs

```text
/health
/docs
/household-search/10
/top-spenders
/popular-products
/churn-risk
/association-rules
```

### Frontend

```text
https://retail-intelligence-platform.netlify.app
```

---

## 🧠 Key Features

### 1. Authentication

Users can create an account and log in using:

* Username
* Email
* Password

Passwords are hashed using `passlib` with `pbkdf2_sha256`.

---

### 2. Household Transaction Search

Users can search household-level retail activity by `HSHD_NUM`.

Example:

```text
HSHD_NUM = 10
```

The backend joins:

* `households`
* `transactions`
* `products`

and returns sorted transaction records by:

```text
Hshd_num, Basket_num, Date, Product_num, Department, Commodity
```

This directly satisfies the required sample data pull for `HSHD_NUM #10`.

---

### 3. Retail Dashboard

The dashboard provides visual analytics for:

* Top spending households
* Loyalty trends
* Average spend by income bracket
* Brand preference: national vs private
* Popular product commodities
* Seasonal sales trends
* Frequent item pairs
* Association rules
* Churn risk customers
* Retention strategy insights

---

### 4. Persistent Dashboard Cache

Azure App Service restarts clear in-memory cache. To solve this, the platform includes a persistent SQL-backed dashboard cache.

Dashboard results are stored in:

```text
dashboard_cache
```

The dashboard retrieval logic works as:

```text
Memory cache → SQL dashboard_cache → 503 only if both are missing
```

This prevents dashboard failures after Azure restarts or redeployments.

---

### 5. CSV Upload and Data Loading

The app supports uploading new versions of:

* Households CSV
* Products CSV
* Transactions CSV

Upload flow:

```text
Frontend Upload Page
        ↓
FastAPI Upload Endpoint
        ↓
Pandas Cleaning + Normalization
        ↓
Azure SQL Table Replacement
        ↓
Dashboard Cache Refresh
```

The backend automatically handles messy CSV column names such as:

```text
PURCHASE_ → purchase_date
STORE_R → store_region
BRAND_TY → brand_type
L → loyalty_flag
HH_SIZE → hshd_size
```

---

### 6. Machine Learning

The platform includes ML functionality for:

#### Customer Lifetime Value Prediction

Predicts long-term customer value from:

* Income range
* Household size
* Number of children

Endpoint:

```text
POST /predict-clv
```

#### Basket / Cross-Sell Prediction

Predicts the probability that a basket will include the target item:

```text
DAIRY
```

Endpoint:

```text
POST /predict-target-item
```

---

## 🏗️ Tech Stack

### Backend

| Technology   | Purpose                                 |
| ------------ | --------------------------------------- |
| FastAPI      | REST API backend                        |
| SQLAlchemy   | Database connection and query execution |
| pyodbc       | Azure SQL Server driver                 |
| Pandas       | Data cleaning, aggregation, analytics   |
| scikit-learn | ML models                               |
| mlxtend      | Apriori association rules               |
| APScheduler  | Scheduled dashboard refresh             |
| Passlib      | Password hashing                        |
| Uvicorn      | ASGI server                             |

### Frontend

| Technology   | Purpose                 |
| ------------ | ----------------------- |
| React        | UI framework            |
| Vite         | Frontend build tool     |
| TypeScript   | Type-safe frontend code |
| Recharts     | Dashboard charts        |
| React Router | Page routing            |
| React Select | Commodity selector UI   |
| MUI          | UI components           |

### Cloud

| Azure Service         | Purpose                    |
| --------------------- | -------------------------- |
| Azure App Service     | Backend API hosting        |
| Azure SQL Database    | Data warehouse / datastore |
| Azure Static Web Apps | Frontend hosting           |
| GitHub Actions        | CI/CD deployment           |

---

## 📁 Project Structure

```text
retail-intelligence-platform-main/
│
├── backend/
│   ├── routers/
│   │   ├── auth.py
│   │   ├── dashboard.py
│   │   ├── prediction.py
│   │   ├── search.py
│   │   └── upload.py
│   │
│   ├── services/
│   │   ├── cache_service.py
│   │   ├── dashboard_service.py
│   │   ├── prediction_service.py
│   │   ├── search_service.py
│   │   └── upload_service.py
│   │
│   ├── config.py
│   ├── database.py
│   ├── main.py
│   ├── models_loader.py
│   ├── schemas.py
│   └── security.py
│
├── db/
│   ├── connection.py
│   ├── schema.sql
│   ├── setup_database.py
│   ├── load_data.py
│   └── check_data.py
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── types/
│   │   ├── App.tsx
│   │   └── main.tsx
│   │
│   ├── package.json
│   └── vite.config.ts
│
├── models/
│   ├── basket_rf_dairy_model.pkl
│   ├── clv_model.pkl
│   └── xgb_model.json
│
├── scripts/
│   └── train_basket_predictor.py
│
├── tests/
│   └── test_api.py
│
├── main.py
├── requirements.txt
└── README.md
```

The backend is organized into routers and services, with a root `main.py` exposing the FastAPI app for Azure deployment. The repository also contains database scripts, trained model artifacts, frontend pages/components, and API smoke tests. 

---

## 🗄️ Database Schema

The Azure SQL database includes the following main tables:

### `households`

Stores household demographics.

```text
hshd_num
loyalty_flag
age_range
marital_status
income_range
homeowner_desc
hshd_composition
hshd_size
children
```

### `products`

Stores product metadata.

```text
product_num
department
commodity
brand_type
natural_organic_flag
```

### `transactions`

Stores household purchase transactions.

```text
id
hshd_num
basket_num
purchase_date
product_num
spend
units
store_region
week_num
year
```

### `users`

Stores application users.

```text
id
username
email
password
```

### `dashboard_cache`

Stores persistent dashboard JSON results.

```text
cache_key
data
updated_at
```

---

## ⚙️ Environment Variables

Create a `.env` file in the project root for local backend development.

```env
DB_SERVER=your-server.database.windows.net
DB_NAME=RetailAnalyticsDB
DB_USER=your_sql_username
DB_PASSWORD=your_sql_password
DB_DRIVER=ODBC Driver 17 for SQL Server
```

For Azure App Service, add these as **Application Settings**:

```env
DB_SERVER=your-server.database.windows.net
DB_NAME=RetailAnalyticsDB
DB_USER=your_sql_username
DB_PASSWORD=your_sql_password
DB_DRIVER=ODBC Driver 17 for SQL Server
SCM_DO_BUILD_DURING_DEPLOYMENT=true
ENABLE_ORYX_BUILD=true
PYTHONUNBUFFERED=1
WEBSITES_PORT=8000
WEBSITES_CONTAINER_START_TIME_LIMIT=1800
```

Frontend environment file:

```env
VITE_API_BASE_URL=https://your-backend-url.azurewebsites.net
```

---

## 🧪 Local Setup

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd retail-intelligence-platform-main
```

### 2. Create Python virtual environment

```bash
python -m venv venv
source venv/bin/activate
```

On Windows:

```bash
venv\Scripts\activate
```

### 3. Install backend dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure `.env`

Create `.env` in the root directory:

```env
DB_SERVER=your-server.database.windows.net
DB_NAME=RetailAnalyticsDB
DB_USER=your_sql_username
DB_PASSWORD=your_sql_password
DB_DRIVER=ODBC Driver 17 for SQL Server
```

### 5. Create database tables

```bash
python -m db.setup_database
```

### 6. Load retail data

Place the official CSV files in `data/`:

```text
400_households.csv
400_products.csv
400_transactions.csv
```

Then run:

```bash
python -m db.load_data
```

### 7. Verify database

```bash
python -m db.check_data
```

Expected output:

```text
households: 400
products: 67284
transactions: 922008
```

---

## ▶️ Running the Backend

Start FastAPI locally:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Open API docs:

```text
http://localhost:8000/docs
```

Health check:

```bash
curl http://localhost:8000/health
```

Expected:

```json
{"status":"ok"}
```

---

## 💻 Running the Frontend

```bash
cd frontend
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

For local frontend development, create `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:8000
```

---

## 📊 Dashboard Cache Workflow

The dashboard cache is designed for Azure stability.

### Refresh dashboard cache

```bash
curl -X POST http://localhost:8000/refresh-dashboard
```

On Azure:

```bash
curl -X POST https://your-backend-url.azurewebsites.net/refresh-dashboard
```

This starts the refresh in the background.

### Check dashboard endpoint

```bash
curl http://localhost:8000/top-spenders
```

If the cache exists, it returns dashboard data immediately.

---

## 🔌 API Endpoints

### General

| Method | Endpoint  | Description               |
| ------ | --------- | ------------------------- |
| GET    | `/`       | Root API message          |
| GET    | `/health` | Lightweight health check  |
| GET    | `/docs`   | Swagger API documentation |

### Authentication

| Method | Endpoint    | Description         |
| ------ | ----------- | ------------------- |
| POST   | `/register` | Register a new user |
| POST   | `/login`    | Login existing user |

### Search

| Method | Endpoint                       | Description                                |
| ------ | ------------------------------ | ------------------------------------------ |
| GET    | `/household-search/{hshd_num}` | Retrieve joined household transaction data |

Example:

```bash
curl http://localhost:8000/household-search/10
```

### Dashboard

| Method | Endpoint                   | Description                        |
| ------ | -------------------------- | ---------------------------------- |
| POST   | `/refresh-dashboard`       | Start dashboard cache refresh      |
| GET    | `/dashboard-update-status` | Check refresh status               |
| GET    | `/top-spenders`            | Top 10 spending households         |
| GET    | `/loyalty-trends`          | Loyalty spend trends               |
| GET    | `/engagement-by-income`    | Average spend by income            |
| GET    | `/brand-preference-split`  | National vs private brand spend    |
| GET    | `/frequent-pairs`          | Frequent product pair combinations |
| GET    | `/popular-products`        | Top product commodities            |
| GET    | `/seasonal-trends`         | Monthly sales trends               |
| GET    | `/churn-risk`              | At-risk households                 |
| GET    | `/association-rules`       | Apriori association rules          |

### Prediction

| Method | Endpoint                   | Description                               |
| ------ | -------------------------- | ----------------------------------------- |
| POST   | `/predict-clv`             | Predict customer lifetime value           |
| POST   | `/predict-target-item`     | Predict cross-sell target probability     |
| GET    | `/get-prediction-features` | List available basket prediction features |

### Upload

| Method | Endpoint               | Description             |
| ------ | ---------------------- | ----------------------- |
| POST   | `/upload/households`   | Upload households CSV   |
| POST   | `/upload/products`     | Upload products CSV     |
| POST   | `/upload/transactions` | Upload transactions CSV |

---

## 🤖 Machine Learning Details

### Customer Lifetime Value Model

The CLV model estimates long-term customer value using household demographics:

```text
income_range
household size
children count
```

Example request:

```bash
curl -X POST http://localhost:8000/predict-clv \
  -H "Content-Type: application/json" \
  -d '{"income_range":"50-74K","hh_size":4,"children":2}'
```

Example response:

```json
{
  "predicted_clv": 19459.75
}
```

### Basket Cross-Sell Model

The basket prediction model estimates the probability that a basket will include:

```text
DAIRY
```

Example request:

```bash
curl -X POST http://localhost:8000/predict-target-item \
  -H "Content-Type: application/json" \
  -d '{"commodities":["BAKERY","GROCERY STAPLE","PRODUCE"]}'
```

Example response:

```json
{
  "target_item": "DAIRY",
  "probability": 55.17,
  "used_items": ["BAKERY", "GROCERY STAPLE", "PRODUCE"]
}
```

---

## 🧹 CSV Cleaning Logic

The backend normalizes uploaded CSV files automatically.

### Household Cleaning

Maps:

```text
L → loyalty_flag
MARITAL → marital_status
HOMEOWNER → homeowner_desc
HH_SIZE → hshd_size
```

### Product Cleaning

Maps:

```text
BRAND_TY → brand_type
```

### Transaction Cleaning

Maps:

```text
PURCHASE_ → purchase_date
STORE_R → store_region
```

Also performs:

* Numeric conversion for IDs, spend, units, week, year
* Date parsing
* Missing value handling
* Duplicate removal
* Invalid row dropping

---

## ✅ Testing

### Run backend smoke test

```bash
python -m tests.test_api
```

The test validates:

```text
/health
/household-search/10
/top-spenders
/popular-products
/seasonal-trends
/churn-risk
/brand-preference-split
/engagement-by-income
/loyalty-trends
/frequent-pairs
/association-rules
/get-prediction-features
```

Expected:

```text
Passed: 12
Failed: 0
```

### Important Testing Note

The test does **not** force dashboard refresh by default. This avoids unnecessary heavy Azure SQL queries during normal smoke testing.

To manually refresh dashboard cache:

```bash
curl -X POST http://localhost:8000/refresh-dashboard
```

---

## ☁️ Azure Deployment

### Backend: Azure App Service

Recommended startup command:

```bash
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

Azure App Service settings:

```env
SCM_DO_BUILD_DURING_DEPLOYMENT=true
ENABLE_ORYX_BUILD=true
PYTHONUNBUFFERED=1
WEBSITES_PORT=8000
WEBSITES_CONTAINER_START_TIME_LIMIT=1800
```

### Azure SQL Networking

Make sure Azure SQL allows the App Service to connect:

```text
SQL Server → Networking
Allow Azure services and resources to access this server: Yes
```

Also add App Service outbound IP addresses as SQL firewall rules if needed.

### Frontend: Azure Static Web Apps

Recommended settings:

```text
App location: frontend
API location: leave empty
Output location: dist
Build command: npm run build
```

Set production frontend environment variable:

```env
VITE_API_BASE_URL=https://your-backend-url.azurewebsites.net
```

After frontend deployment, add the frontend URL to backend CORS:

```python
CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://your-frontend-url.azurestaticapps.net",
]
```

---

## 🔁 GitHub Actions Deployment

The backend can be deployed to Azure App Service using GitHub Actions.

Recommended checkout configuration for Git LFS model files:

```yaml
- uses: actions/checkout@v4
  with:
    lfs: true

- name: Pull Git LFS files
  run: |
    git lfs install
    git lfs pull
```

This is required because model artifacts such as `.pkl` files are tracked using Git LFS.

---

## 📈 Project Requirements Coverage

| Requirement                             | Status |
| --------------------------------------- | ------ |
| ML model write-up support               | ✅      |
| Web server setup                        | ✅      |
| Username/password/email login page      | ✅      |
| Azure datastore/database                | ✅      |
| Load Transactions, Households, Products | ✅      |
| Sample data pull for HSHD_NUM #10       | ✅      |
| Interactive household search            | ✅      |
| Data loading web app                    | ✅      |
| Dashboard page                          | ✅      |
| Basket analysis / cross-sell            | ✅      |
| CLV prediction                          | ✅      |
| Churn prediction / risk analysis        | ✅      |
| Azure deployment                        | ✅      |

---

## 🔒 Security Notes

* Do not commit `.env` files.
* Do not hardcode database credentials.
* Use Azure App Service environment variables for secrets.
* Passwords are stored as hashes, not plaintext.
* Production systems should use JWT/session authentication, stricter CORS, and HTTPS-only policies.

---

## 🧾 Data Source

This project uses the sample 84.51° Complete Journey retail dataset provided for the course project. The dataset contains household-level transaction data, product metadata, and demographic information.

---

## 👥 Team

```text
Group 54
```

Add team member names here:

```text
Mansurbek Satarov
Erzhigit Kasymbaev
```

---

## 📌 Final Notes

The most important cloud engineering lesson from this project was that local success does not guarantee cloud stability. Azure App Service and Azure SQL introduce cold starts, firewall rules, deployment packaging issues, and resource constraints. The final architecture solves these issues by using:

* lightweight backend startup
* persistent SQL-backed dashboard cache
* non-blocking dashboard refresh
* Azure environment variables
* GitHub Actions deployment
* Azure SQL firewall configuration

This makes the application more reliable, demo-ready, and closer to a production-style cloud analytics system.