-- Supabase SQL Schema for Celebrity Cuts CRM
-- Run this in your Supabase SQL Editor to create the necessary tables.

CREATE TABLE profiles (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "branchName" TEXT,
    location TEXT,
    mobile TEXT,
    "fullName" TEXT
);

CREATE TABLE customers (
    id TEXT PRIMARY KEY,
    first_name TEXT,
    last_name TEXT,
    phone_number TEXT,
    branch_id TEXT NOT NULL,
    visit_count INTEGER DEFAULT 0,
    total_amount NUMERIC DEFAULT 0,
    visit_date TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE staff (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT,
    "branchId" TEXT NOT NULL,
    status TEXT,
    mobile TEXT,
    join_date TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE attendance (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    "checkIn" TEXT,
    "checkOut" TEXT,
    status TEXT,
    "workHours" TEXT,
    "staffId" TEXT,
    "staffName" TEXT,
    "staffRole" TEXT,
    "branchId" TEXT NOT NULL
);

CREATE TABLE products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    brand TEXT,
    category TEXT,
    cost_price NUMERIC,
    selling_price NUMERIC,
    stock INTEGER DEFAULT 0,
    min_stock INTEGER DEFAULT 0,
    branch_id TEXT NOT NULL
);

CREATE TABLE hair_extensions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT,
    color TEXT,
    length TEXT,
    cost_price NUMERIC,
    selling_price NUMERIC,
    stock INTEGER DEFAULT 0,
    branch_id TEXT NOT NULL
);

CREATE TABLE transactions (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    time TEXT,
    amount NUMERIC NOT NULL,
    subtotal NUMERIC,
    gst NUMERIC,
    discount NUMERIC,
    "customerId" TEXT,
    "customerName" TEXT,
    "branchId" TEXT NOT NULL,
    "paymentMethod" TEXT,
    items JSONB DEFAULT '[]'::jsonb
);

-- Insert default Admin user
INSERT INTO profiles (id, username, password, role, "branchId", "branchName", location, "fullName")
VALUES ('admin-id-v1', 'Admin', 'Nag@123', 'admin', 'all', 'All Branches', 'Head Office', 'Super Admin');

-- Branch 1: Main Branch
INSERT INTO profiles (id, username, password, role, "branchId", "branchName", location, "fullName")
VALUES ('bm1-id-v1', 'branchmanager1', 'madbranch1@123', 'manager', 'branch1', 'Main Branch', 'City Center', 'Branch Manager 1');

INSERT INTO profiles (id, username, password, role, "branchId", "branchName", location, "fullName")
VALUES ('bill1-id-v1', 'branch1', 'bill1', 'billing', 'branch1', 'Main Branch', 'City Center', 'Biller - Main Branch');

-- Branch 2: Vizag Branch
INSERT INTO profiles (id, username, password, role, "branchId", "branchName", location, "fullName")
VALUES ('bm2-id-v1', 'branchmanager2', 'madbranch2@123', 'manager', 'branch2', 'Vizag Branch', 'Vizag', 'Branch Manager (Vizag)');

INSERT INTO profiles (id, username, password, role, "branchId", "branchName", location, "fullName")
VALUES ('bill2-id-v1', 'branch2', 'bill2', 'billing', 'branch2', 'Vizag Branch', 'Vizag', 'Biller - Vizag Branch');

-- Branch 3: Vijayawada Branch
INSERT INTO profiles (id, username, password, role, "branchId", "branchName", location, "fullName")
VALUES ('bm3-id-v1', 'branchmanager3', 'madbranch3@123', 'manager', 'branch3', 'Vijayawada Branch', 'Vijayawada', 'Branch Manager (Vijayawada)');

INSERT INTO profiles (id, username, password, role, "branchId", "branchName", location, "fullName")
VALUES ('bill3-id-v1', 'branch3', 'bill3', 'billing', 'branch3', 'Vijayawada Branch', 'Vijayawada', 'Biller - Vijayawada Branch');
