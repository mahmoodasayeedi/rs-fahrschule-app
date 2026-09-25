create policy "admin read audit log"
  on audit_log for select
  using (get_my_role() = 'admin');

-- No INSERT/UPDATE/DELETE policy for any role — entries are created only
-- via the security-definer trigger functions above, and are never edited
-- or removed through the normal API by anyone, including Admin.