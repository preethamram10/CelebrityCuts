-- Insert staff list for Branch 1
INSERT INTO staff (id, name, role, "branchId", status, mobile, join_date)
VALUES
  ('staff-mouni', 'Mouni kumari', 'Management', 'branch1', 'Active', '7288094903', CURRENT_DATE::text),
  ('staff-divya', 'divya', 'Beautician', 'branch1', 'Active', '7396935279', CURRENT_DATE::text),
  ('staff-vinayaka', 'vinayaka lakshmi', 'Beautician', 'branch1', 'Active', '8919564629', CURRENT_DATE::text),
  ('staff-bhuvana', 'bhuvana', 'Beautician', 'branch1', 'Active', '7075042382', CURRENT_DATE::text),
  ('staff-krupa', 'krupa', 'Beautician', 'branch1', 'Active', '9392511836', CURRENT_DATE::text),
  ('staff-ankitha', 'Ankitha', 'Beautician', 'branch1', 'Active', '9381493155', CURRENT_DATE::text),
  ('staff-tulasi', 'tulasi', 'telecaller', 'branch1', 'Active', '8143819087', CURRENT_DATE::text),
  ('staff-biman', 'Biman', 'Super Sr.unisex hairdreser', 'branch1', 'Active', '6295159960', CURRENT_DATE::text),
  ('staff-sameer', 'sameer', 'Jr.Unisex hairdresser', 'branch1', 'Active', '7501946626', CURRENT_DATE::text),
  ('staff-nawaz', 'nawaz', 'Jr.unisex hairdresser', 'branch1', 'Active', '7075132911', CURRENT_DATE::text),
  ('staff-samsad', 'Mohamad samsad', 'Jr.unisex hairdresser', 'branch1', 'Active', '8433083460', CURRENT_DATE::text),
  ('staff-kismath', 'kismath', 'Jr.female stylist', 'branch1', 'Active', '7303632359', CURRENT_DATE::text),
  ('staff-sharan', 'sharan', 'Jr.male stylist', 'branch1', 'Active', '9734066307', CURRENT_DATE::text);
