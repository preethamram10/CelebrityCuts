-- Insert staff list for Branch 2 (Vizag Branch)
INSERT INTO staff (id, name, role, "branchId", status, mobile, join_date)
VALUES
  ('staff-vizag-1', 'Raju Varma', 'Senior Stylist', 'branch2', 'Active', '9848011223', CURRENT_DATE::text),
  ('staff-vizag-2', 'Priya Sharma', 'Beautician', 'branch2', 'Active', '9848022334', CURRENT_DATE::text),
  ('staff-vizag-3', 'Suresh Kumar', 'Jr. Unisex Hairdresser', 'branch2', 'Active', '9848033445', CURRENT_DATE::text),
  ('staff-vizag-4', 'Kavitha Rao', 'Make-up Artist', 'branch2', 'Active', '9848044556', CURRENT_DATE::text);
