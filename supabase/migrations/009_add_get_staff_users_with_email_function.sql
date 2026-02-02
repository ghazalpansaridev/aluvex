-- Migration: 009_add_get_staff_users_with_email_function.sql
-- Create a function to get staff users with their email from auth.users
-- This is needed because we can't directly query auth.users from the client

CREATE OR REPLACE FUNCTION get_staff_users_with_email(
  p_role TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  first_name VARCHAR,
  last_name VARCHAR,
  phone VARCHAR,
  role VARCHAR,
  region VARCHAR,
  pincode VARCHAR,
  address TEXT,
  status VARCHAR,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  created_by UUID,
  email TEXT,
  last_login TIMESTAMPTZ
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    su.id,
    su.user_id,
    su.first_name,
    su.last_name,
    su.phone,
    su.role,
    su.region,
    su.pincode,
    su.address,
    su.status,
    su.created_at,
    su.updated_at,
    su.created_by,
    au.email::TEXT as email,
    au.last_sign_in_at as last_login
  FROM staff_users su
  LEFT JOIN auth.users au ON su.user_id = au.id
  WHERE (p_role IS NULL OR su.role = p_role)
    AND (p_status IS NULL OR su.status = p_status)
  ORDER BY su.created_at DESC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_staff_users_with_email TO authenticated;

-- Add comment
COMMENT ON FUNCTION get_staff_users_with_email IS 'Fetches staff users with their email addresses from auth.users. Only accessible by authenticated users with proper RLS policies.';
