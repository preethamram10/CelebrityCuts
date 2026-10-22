-- 1. Create a function to extract custom headers from the API Request
CREATE OR REPLACE FUNCTION get_custom_branch_id()
RETURNS text AS $$
BEGIN
  RETURN current_setting('request.headers', true)::json->>'x-branch-id';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_custom_role()
RETURNS text AS $$
BEGIN
  RETURN current_setting('request.headers', true)::json->>'x-user-role';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Enable Row Level Security (RLS) on all relevant tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE hair_extensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------
-- SAFE DROP OF EXISTING POLICIES
-- -----------------------------------------------------
DO $$ DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
    END LOOP;
END $$;
-- -----------------------------------------------------
-- 3. PROFILES Table Policies
-- In a custom auth setup, we need anyone to be able to read 
-- profiles to verify login credentials since the frontend 
-- doesn't have an active session yet.
-- -----------------------------------------------------
-- View Policies
CREATE POLICY "Global Read Profiles" ON profiles
FOR SELECT USING (true);

-- Admins still need to be able to UPDATE and DELETE profiles
CREATE POLICY "Admin All Access Profiles" ON profiles
FOR ALL USING (get_custom_role() = 'admin') WITH CHECK (get_custom_role() = 'admin');

-- Note: In this simple custom auth setup, we allow open INSERT into profiles 
-- temporarily for branch creation, but ideally we only allow Admin.
CREATE POLICY "Admin Insert Profiles" ON profiles
FOR INSERT WITH CHECK (get_custom_role() = 'admin');

-- -----------------------------------------------------
-- 4. CUSTOMERS Table Policies
-- -----------------------------------------------------
CREATE POLICY "Admin All Access Customers" ON customers
FOR ALL USING (get_custom_role() = 'admin') WITH CHECK (get_custom_role() = 'admin');

CREATE POLICY "Branch Access Customers" ON customers
FOR ALL USING (
  branch_id = get_custom_branch_id()
) WITH CHECK (
  branch_id = get_custom_branch_id()
);

-- -----------------------------------------------------
-- 5. TRANSACTIONS Table Policies
-- -----------------------------------------------------
CREATE POLICY "Admin All Access Transactions" ON transactions
FOR ALL USING (get_custom_role() = 'admin') WITH CHECK (get_custom_role() = 'admin');

CREATE POLICY "Branch Access Transactions" ON transactions
FOR ALL USING (
  "branchId" = get_custom_branch_id()
) WITH CHECK (
  "branchId" = get_custom_branch_id()
);

-- -----------------------------------------------------
-- 6. ATTENDANCE Table Policies
-- -----------------------------------------------------
CREATE POLICY "Admin All Access Attendance" ON attendance
FOR ALL USING (get_custom_role() = 'admin') WITH CHECK (get_custom_role() = 'admin');

CREATE POLICY "Branch Access Attendance" ON attendance
FOR ALL USING (
  "branchId" = get_custom_branch_id()
) WITH CHECK (
  "branchId" = get_custom_branch_id()
);

-- -----------------------------------------------------
-- 7. INVOICES Table Policies
-- Invoices uses "invoice_no" which holds the branch ID.
-- -----------------------------------------------------
CREATE POLICY "Admin All Access Invoices" ON invoices
FOR ALL USING (get_custom_role() = 'admin') WITH CHECK (get_custom_role() = 'admin');

CREATE POLICY "Branch Access Invoices" ON invoices
FOR ALL USING (
  invoice_no LIKE '%' || get_custom_branch_id() || '%'
) WITH CHECK (
  invoice_no LIKE '%' || get_custom_branch_id() || '%'
);

-- -----------------------------------------------------
-- 8. PRODUCTS Table Policies
-- -----------------------------------------------------
CREATE POLICY "Admin All Access Products" ON products
FOR ALL USING (get_custom_role() = 'admin') WITH CHECK (get_custom_role() = 'admin');

CREATE POLICY "Branch Access Products" ON products
FOR ALL USING (
  branch_id = get_custom_branch_id()
) WITH CHECK (
  branch_id = get_custom_branch_id()
);

-- -----------------------------------------------------
-- 9. HAIR EXTENSIONS Table Policies
-- -----------------------------------------------------
CREATE POLICY "Admin All Access Hair Extensions" ON hair_extensions
FOR ALL USING (get_custom_role() = 'admin') WITH CHECK (get_custom_role() = 'admin');

CREATE POLICY "Branch Access Hair Extensions" ON hair_extensions
FOR ALL USING (
  branch_id = get_custom_branch_id()
) WITH CHECK (
  branch_id = get_custom_branch_id()
);

-- -----------------------------------------------------
-- 10. STAFF Table Policies
-- -----------------------------------------------------
CREATE POLICY "Admin All Access Staff" ON staff
FOR ALL USING (get_custom_role() = 'admin') WITH CHECK (get_custom_role() = 'admin');

CREATE POLICY "Branch Access Staff" ON staff
FOR ALL USING (
  "branchId" = get_custom_branch_id()
) WITH CHECK (
  "branchId" = get_custom_branch_id()
);
-- -----------------------------------------------------
-- Note: Without a secure JWT mechanism, custom headers can technically be spoofed 
-- if someone figures out your Anon Key and API URL. For true secure B2B SaaS, 
-- migrating to Supabase Auth is required.
-- -----------------------------------------------------