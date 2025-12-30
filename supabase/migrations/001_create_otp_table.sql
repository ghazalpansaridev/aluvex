-- Create otp_verifications table
CREATE TABLE IF NOT EXISTS otp_verifications (
  phone_number TEXT PRIMARY KEY,
  otp_code TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create index on expires_at for cleanup queries
CREATE INDEX IF NOT EXISTS idx_otp_expires_at ON otp_verifications(expires_at);

-- Enable Row Level Security (optional, but recommended)
ALTER TABLE otp_verifications ENABLE ROW LEVEL SECURITY;

-- Policy to allow service role to manage OTPs (for Edge Functions)
-- Note: Edge Functions use service role key, so this allows them to insert/delete
CREATE POLICY "Service role can manage OTPs" ON otp_verifications
  FOR ALL
  USING (true)
  WITH CHECK (true);

