-- Insert staff list for Branch 4 (Hyderabad Branch)
INSERT INTO staff (id, name, role, "branchId", status, mobile, join_date)
VALUES
  ('staff-hyd-1', 'Sai Kiran', 'Senior Stylist', 'branch4', 'Active', '9949011225', CURRENT_DATE::text),
  ('staff-hyd-2', 'Anusha Reddy', 'Senior Beautician', 'branch4', 'Active', '9949022336', CURRENT_DATE::text),
  ('staff-hyd-3', 'Rahul Varma', 'Hair Extension Specialist', 'branch4', 'Active', '9949033447', CURRENT_DATE::text),
  ('staff-hyd-4', 'Pooja Rao', 'Make-up Artist & Facial Specialist', 'branch4', 'Active', '9949044558', CURRENT_DATE::text);
