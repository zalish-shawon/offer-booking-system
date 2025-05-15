-- Add payment_method, payment_slip_url, payment_approved_at, and payment_approved_by columns to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_method VARCHAR DEFAULT 'online',
ADD COLUMN IF NOT EXISTS payment_slip_url TEXT,
ADD COLUMN IF NOT EXISTS payment_approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS payment_approved_by UUID REFERENCES profiles(id);

-- Update status enum to include awaiting_approval
-- Note: This assumes you're using a VARCHAR for status, not an actual enum type
-- If you're using an actual enum type, you'll need to use ALTER TYPE instead
