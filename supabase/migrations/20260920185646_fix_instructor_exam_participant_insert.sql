-- Instructor can add their own assigned students as participants
-- to exam events they themselves created — closes a gap where
-- instructors could create events but not populate them.
create policy "instructor add participants to own events"
  on exam_participants for insert
  with check (
    get_my_role() = 'instructor'
    and is_my_assigned_student(student_id)
    and exists (
      select 1 from exam_events
      where exam_events.id = exam_event_id
      and exam_events.created_by = auth.uid()
    )
  );