IF OBJECT_ID('transactions', 'U') IS NOT NULL DROP TABLE transactions;
IF OBJECT_ID('products', 'U') IS NOT NULL DROP TABLE products;
IF OBJECT_ID('households', 'U') IS NOT NULL DROP TABLE households;
IF OBJECT_ID('users', 'U') IS NOT NULL DROP TABLE users;

CREATE TABLE households (
    hshd_num INT PRIMARY KEY,
    loyalty_flag VARCHAR(20),
    age_range VARCHAR(50),
    marital_status VARCHAR(50),
    income_range VARCHAR(50),
    homeowner_desc VARCHAR(100),
    hshd_composition VARCHAR(100),
    hshd_size INT,
    children INT
);

CREATE TABLE products (
    product_num INT PRIMARY KEY,
    department VARCHAR(100),
    commodity VARCHAR(150),
    brand_type VARCHAR(50),
    natural_organic_flag VARCHAR(50)
);

CREATE TABLE transactions (
    id INT IDENTITY(1,1) PRIMARY KEY,
    hshd_num INT,
    basket_num INT,
    purchase_date DATE,
    product_num INT,
    spend FLOAT,
    units INT,
    store_region VARCHAR(100),
    week_num INT,
    year INT
);

CREATE TABLE users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    password VARCHAR(255) NOT NULL
);

IF OBJECT_ID('dashboard_cache', 'U') IS NULL
CREATE TABLE dashboard_cache (
    cache_key VARCHAR(100) PRIMARY KEY,
    data NVARCHAR(MAX) NOT NULL,
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
