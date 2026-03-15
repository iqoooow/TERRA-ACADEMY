-- SMS Settings table — required by Edge Functions (send-absence-sms, send-payment-reminder)
-- Run this in Supabase SQL Editor if sms_settings table doesn't exist

CREATE TABLE IF NOT EXISTS sms_settings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    attendance_sms_enabled boolean NOT NULL DEFAULT true,
    payment_sms_enabled boolean NOT NULL DEFAULT true,
    late_warning_count integer NOT NULL DEFAULT 3,
    updated_at timestamptz DEFAULT now()
);

-- Insert default settings row if table is empty
INSERT INTO sms_settings (attendance_sms_enabled, payment_sms_enabled, late_warning_count)
SELECT true, true, 3
WHERE NOT EXISTS (SELECT 1 FROM sms_settings LIMIT 1);

-- Enable RLS
ALTER TABLE sms_settings ENABLE ROW LEVEL SECURITY;

-- Only admins/owners can read/write sms_settings
CREATE POLICY "Admin can manage sms_settings"
    ON sms_settings
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'owner')
        )
    );

-- Edge Functions (service role) can always read sms_settings
-- (service role bypasses RLS by default)
