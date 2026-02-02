-- Drop existing check constraint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Add new constraint with 'processing' status
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
CHECK (status IN ('placed', 'processing', 'partially_shipped', 'shipped', 'cancelled'));
