-- Allow multiple check-in / check-out cycles per calendar day (each row = one session).

ALTER TABLE attendance_records DROP CONSTRAINT IF EXISTS attendance_records_user_id_date_key;

CREATE INDEX IF NOT EXISTS idx_attendance_user_date_checkin
  ON attendance_records(user_id, date, check_in_time)
  WHERE deleted_at IS NULL;

COMMENT ON TABLE attendance_records IS 'Work sessions: multiple rows per user per day allowed; each row is one check-in to check-out block.';
