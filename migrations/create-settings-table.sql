-- Create settings table
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_timeout_hours INTEGER NOT NULL DEFAULT 48,
  allow_duplicate_bookings BOOLEAN NOT NULL DEFAULT false,
  default_approval_required BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings
INSERT INTO system_settings (payment_timeout_hours, allow_duplicate_bookings, default_approval_required)
VALUES (48, false, true)
ON CONFLICT DO NOTHING;

-- Add category column to products table if it doesn't exist
ALTER TABLE products ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'mobile';
