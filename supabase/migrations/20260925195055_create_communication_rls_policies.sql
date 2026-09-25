-- Everyone reads only their own notifications.
create policy "read own notifications"
  on notifications for select
  using (recipient_id = auth.uid());

-- Everyone can update (mark read) only their own — the trigger above
-- restricts this further to just the is_read field.
create policy "update own notifications"
  on notifications for update
  using (recipient_id = auth.uid());

-- Admin can read all, for oversight/debugging purposes.
create policy "admin read all notifications"
  on notifications for select
  using (get_my_role() = 'admin');

-- No INSERT policy for any role — creation happens only via the
-- security-definer trigger functions, which bypass RLS in a controlled way.