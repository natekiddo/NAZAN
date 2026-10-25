-- Allow automated deadline events to be recorded without a user-created reminder row.
ALTER TABLE public.notification_deliveries
  ALTER COLUMN reminder_id DROP NOT NULL;