-- Fix RLS policies to use auth.jwt() instead of querying auth.users
-- Root cause: raw_user_meta_data from auth.users is not accessible in RLS policies
-- Solution: Use auth.jwt() which includes user_metadata from the JWT token

-- Drop existing policies
DROP POLICY IF EXISTS "Allow admin and operations to insert shipments" ON shipments;
DROP POLICY IF EXISTS "Allow admin and operations to view shipments" ON shipments;
DROP POLICY IF EXISTS "Allow admin and operations to insert shipment items" ON shipment_items;
DROP POLICY IF EXISTS "Allow admin and operations to view shipment items" ON shipment_items;

-- Recreate policies using auth.jwt() to access user role
CREATE POLICY "Allow admin and operations to insert shipments"
ON shipments
FOR INSERT
TO authenticated
WITH CHECK (
  (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'operations')
);

CREATE POLICY "Allow admin and operations to view shipments"
ON shipments
FOR SELECT
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'operations')
);

CREATE POLICY "Allow admin and operations to insert shipment items"
ON shipment_items
FOR INSERT
TO authenticated
WITH CHECK (
  (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'operations')
);

CREATE POLICY "Allow admin and operations to view shipment items"
ON shipment_items
FOR SELECT
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'operations')
);
