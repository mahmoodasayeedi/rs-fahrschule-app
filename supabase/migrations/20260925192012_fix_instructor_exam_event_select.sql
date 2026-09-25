-- Restore the real check we loosened to diagnose the RETURNING issue.
alter policy "instructor create exam events" on exam_events
  with check (get_my_role() = 'instructor' and created_by = auth.uid());

-- Close the gap: instructor can see events they created, even before
-- any participants exist yet (needed for INSERT ... RETURNING to work).
drop policy if exists "instructor read own created exam events" on exam_events;
create policy "instructor read own created exam events"
  on exam_events for select
  using (get_my_role() = 'instructor' and created_by = auth.uid());