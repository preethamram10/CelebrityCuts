-- Additional table required for Invoices functionality
CREATE TABLE invoices (
    id TEXT PRIMARY KEY,
    invoice_no TEXT UNIQUE NOT NULL,
    customer_name TEXT,
    customer_phone TEXT,
    items JSONB DEFAULT '[]'::jsonb,
    total_amount NUMERIC DEFAULT 0,
    payment_mode TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);