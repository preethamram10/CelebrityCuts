-- Supabase SQL Table for Appointments
CREATE TABLE IF NOT EXISTS appointments (
    id TEXT PRIMARY KEY,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    appointment_date TEXT NOT NULL,
    appointment_time TEXT NOT NULL,
    target_branch_id TEXT NOT NULL,
    target_branch_name TEXT,
    booked_by_branch_id TEXT,
    booked_by_branch_name TEXT,
    notes TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Realtime for appointments if needed
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public full access to appointments" ON appointments FOR ALL USING (true);
