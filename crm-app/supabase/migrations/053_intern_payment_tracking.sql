-- Migration: Intern Payment Tracking
-- Adds payment history tracking for paid_by_student interns
-- Adds total_fee and remaining_balance fields to intern_profiles

-- Add columns to intern_profiles for payment tracking
ALTER TABLE intern_profiles
ADD COLUMN IF NOT EXISTS total_fee NUMERIC(12,2) NULL,
ADD COLUMN IF NOT EXISTS remaining_balance NUMERIC(12,2) NULL;

COMMENT ON COLUMN intern_profiles.total_fee IS 'Total fee expected from student for paid_by_student internship';
COMMENT ON COLUMN intern_profiles.remaining_balance IS 'Remaining balance to be paid (total_fee - payments made)';

-- Create intern_payments table for payment history
CREATE TABLE IF NOT EXISTS intern_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intern_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  payment_method VARCHAR(50) NOT NULL DEFAULT 'cash',
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  receipt_number VARCHAR(100) NULL,
  notes TEXT NULL,
  collected_by UUID NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ NULL
);

-- Add check for valid payment methods
ALTER TABLE intern_payments
ADD CONSTRAINT check_payment_method
CHECK (payment_method IN ('cash', 'upi', 'bank_transfer', 'card', 'cheque'));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_intern_payments_intern_id ON intern_payments(intern_id);
CREATE INDEX IF NOT EXISTS idx_intern_payments_payment_date ON intern_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_intern_payments_deleted_at ON intern_payments(deleted_at);

-- Enable RLS
ALTER TABLE intern_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for intern_payments
CREATE POLICY "Users can view intern payments based on intern access"
  ON intern_payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = intern_payments.intern_id
      AND u.deleted_at IS NULL
    )
  );

CREATE POLICY "Service role can manage all intern payments"
  ON intern_payments FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Function to calculate and update remaining balance
CREATE OR REPLACE FUNCTION update_intern_remaining_balance(p_intern_id UUID)
RETURNS VOID AS $$
DECLARE
  v_total_fee NUMERIC(12,2);
  v_total_paid NUMERIC(12,2);
  v_new_balance NUMERIC(12,2);
BEGIN
  -- Get total_fee from intern_profiles
  SELECT total_fee INTO v_total_fee
  FROM intern_profiles
  WHERE user_id = p_intern_id;
  
  -- Calculate total payments made (excluding deleted)
  SELECT COALESCE(SUM(amount), 0) INTO v_total_paid
  FROM intern_payments
  WHERE intern_id = p_intern_id
  AND deleted_at IS NULL;
  
  -- Calculate remaining balance
  v_new_balance := COALESCE(v_total_fee, 0) - v_total_paid;
  
  -- Update intern_profiles
  UPDATE intern_profiles
  SET remaining_balance = v_new_balance,
      updated_at = NOW()
  WHERE user_id = p_intern_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update balance when payment is added
CREATE OR REPLACE FUNCTION trigger_update_balance_on_payment()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.deleted_at IS NULL THEN
    PERFORM update_intern_remaining_balance(NEW.intern_id);
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
      -- Payment was deleted
      PERFORM update_intern_remaining_balance(NEW.intern_id);
    ELSIF OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL THEN
      -- Payment was restored
      PERFORM update_intern_remaining_balance(NEW.intern_id);
    ELSIF OLD.amount != NEW.amount AND NEW.deleted_at IS NULL THEN
      -- Amount changed
      PERFORM update_intern_remaining_balance(NEW.intern_id);
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM update_intern_remaining_balance(OLD.intern_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER intern_payments_balance_trigger
  AFTER INSERT OR UPDATE OR DELETE ON intern_payments
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_balance_on_payment();

-- Trigger to update balance when total_fee changes
CREATE OR REPLACE FUNCTION trigger_update_balance_on_fee_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.total_fee IS DISTINCT FROM NEW.total_fee THEN
    PERFORM update_intern_remaining_balance(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER intern_profiles_fee_balance_trigger
  AFTER UPDATE ON intern_profiles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_balance_on_fee_change();

-- Initialize remaining_balance for existing paid_by_student interns
UPDATE intern_profiles ip
SET remaining_balance = COALESCE(total_fee, 0) - COALESCE(ip.fee_paid, 0)
WHERE internship_type = 'paid_by_student'
AND total_fee IS NOT NULL;