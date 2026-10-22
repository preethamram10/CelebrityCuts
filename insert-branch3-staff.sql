-- Insert staff list for Branch 3 (Vijayawada Branch)
INSERT INTO staff (id, name, role, "branchId", status, mobile, join_date)
VALUES
  ('staff-vjw-1', 'Venkatesh Naidu', 'Super Sr. Unisex Hairdresser', 'branch3', 'Active', '9949011223', CURRENT_DATE::text),
  ('staff-vjw-2', 'Lakshmi Prasanna', 'Senior Beautician', 'branch3', 'Active', '9949022334', CURRENT_DATE::text),
  ('staff-vjw-3', 'Ramesh Babu', 'Stylist', 'branch3', 'Active', '9949033445', CURRENT_DATE::text),
  ('staff-vjw-4', 'Anusha Reddy', 'Make-up Artist', 'branch3', 'Active', '9949044556', CURRENT_DATE::text);
