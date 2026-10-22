-- ==========================================
-- DISABLE ROW LEVEL SECURITY (RLS) SCRIPT
-- ==========================================
-- Run this script in the Supabase SQL Editor.
-- 
-- WHY DO I NEED THIS?
-- Earlier we turned ON Row-Level-Security (RLS) when we tried to migrate
-- to the official Supabase Login. Because we canceled that migration and
-- went back to the simple "Admin" / "Nag@123" login, the database is now 
-- blocking you from seeing data.
-- 
-- Running this script completely turns off those security locks so your
-- fast local logins can read all the Staff, Customers, and Revenue data again.
-- ==========================================

-- 1. Turn off RLS for all tables
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE hair_extensions DISABLE ROW LEVEL SECURITY;
ALTER TABLE staff DISABLE ROW LEVEL SECURITY;

-- 2. Drop all the blocking policies we made earlier
DO $$ DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
    END LOOP;
END $$;
