-- Grant SELECT permission on auth.users to authenticated role
-- This is required because several tables have foreign keys to auth.users
-- (e.g., orders.cancelled_by, retailers.approved_by, retailers.created_by, shipments.created_by)
-- Even when not selecting these fields, PostgREST checks permissions due to FK relationships
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT SELECT ON auth.users TO authenticated;

-- Enable RLS on shipments table (should already be enabled)
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;

-- Policy: Allow admin and ops users to insert shipments
CREATE POLICY "Allow admin and ops to insert shipments"
ON shipments
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'ops')
  )
);

-- Policy: Allow admin and ops users to select shipments
CREATE POLICY "Allow admin and ops to view shipments"
ON shipments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'ops')
  )
);

-- Policy: Allow retailers to view their own order shipments
CREATE POLICY "Allow retailers to view their shipments"
ON shipments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM orders o
    JOIN retailers r ON r.id = o.retailer_id
    WHERE o.id = shipments.order_id
    AND r.user_id = auth.uid()
  )
);

-- Enable RLS on shipment_items table (should already be enabled)
ALTER TABLE shipment_items ENABLE ROW LEVEL SECURITY;

-- Policy: Allow admin and ops users to insert shipment items
CREATE POLICY "Allow admin and ops to insert shipment items"
ON shipment_items
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'ops')
  )
);

-- Policy: Allow admin and ops users to select shipment items
CREATE POLICY "Allow admin and ops to view shipment items"
ON shipment_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'ops')
  )
);

-- Policy: Allow retailers to view their own shipment items
CREATE POLICY "Allow retailers to view their shipment items"
ON shipment_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM shipments s
    JOIN orders o ON o.id = s.order_id
    JOIN retailers r ON r.id = o.retailer_id
    WHERE s.id = shipment_items.shipment_id
    AND r.user_id = auth.uid()
  )
);
