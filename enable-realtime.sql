-- Enable Realtime for specific tables so the frontend can receive live updates
BEGIN;
  -- Drop the publication if it already exists to avoid errors (optional, but supabase_realtime exists by default)
  -- We just need to ADD tables to the existing supabase_realtime publication
  ALTER PUBLICATION supabase_realtime ADD TABLE staff;
  ALTER PUBLICATION supabase_realtime ADD TABLE customers;
  ALTER PUBLICATION supabase_realtime ADD TABLE products;
  ALTER PUBLICATION supabase_realtime ADD TABLE hair_extensions;
COMMIT;