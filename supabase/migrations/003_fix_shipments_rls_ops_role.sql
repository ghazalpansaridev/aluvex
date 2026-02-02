-- Fix RLS policies to use 'operations' instead of 'ops'
-- Root cause: RLS policies check for 'ops' but users have role 'operations' in raw_user_meta_data

-- Drop existing policies with incorrect role name
DROP POLICY IF EXISTS "Allow admin and ops to insert shipments" ON shipments;
DROP POLICY IF EXISTS "Allow admin and ops to view shipments" ON shipments;
DROP POLICY IF EXISTS "Allow admin and ops to insert shipment items" ON shipment_items;
DROP POLICY IF EXISTS "Allow admin and ops to view shipment items" ON shipment_items;

-- Recreate policies with correct role name 'operations'
CREATE POLICY "Allow admin and operations to insert shipments"
ON shipments
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'operations')
  )
);

CREATE POLICY "Allow admin and operations to view shipments"
ON shipments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'operations')
  )
);

CREATE POLICY "Allow admin and operations to insert shipment items"
ON shipment_items
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'operations')
  )
);

CREATE POLICY "Allow admin and operations to view shipment items"
ON shipment_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'operations')
  )
);
