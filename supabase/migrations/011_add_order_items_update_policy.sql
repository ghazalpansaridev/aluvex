-- Add UPDATE RLS policy on order_items for admin/ops roles
-- This fixes the silent failure when createShipment() tries to update shipped_quantity
CREATE POLICY "Admin/Ops update order items"
  ON order_items FOR UPDATE
  USING (
    ((auth.jwt() -> 'user_metadata' ->> 'role') = ANY (ARRAY['admin', 'ops']))
  );
