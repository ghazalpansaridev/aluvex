-- Migration: 010_add_activate_staff_user_function.sql
-- Create a function to activate staff user after password is set
-- This function bypasses RLS for this specific operation

CREATE OR REPLACE FUNCTION activate_staff_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- When a user sets their password (encrypted_password is updated)
  -- and they have a staff_users record with pending_password status,
  -- automatically activate them
  
  IF NEW.encrypted_password IS DISTINCT FROM OLD.encrypted_password THEN
    UPDATE staff_users
    SET status = 'active'
    WHERE user_id = NEW.id
      AND status = 'pending_password';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger that fires after user password is updated
DROP TRIGGER IF EXISTS trigger_activate_staff_user ON auth.users;
CREATE TRIGGER trigger_activate_staff_user
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION activate_staff_user();

COMMENT ON FUNCTION activate_staff_user IS 'Automatically activates staff user when they set their password for the first time';
