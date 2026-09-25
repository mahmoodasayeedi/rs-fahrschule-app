-- === exam_events policies ===

-- Student can read events they're assigned to (via exam_participants).
create policy "student read own exam events"
  on exam_events for select
  using (
    exists (
      select 1 from exam_participants
      where exam_participants.exam_event_id = exam_events.id
      and exam_participants.student_id = auth.uid()
    )
  );

-- Instructor can read/create/edit events involving their assigned students.
create policy "instructor read relevant exam events"
  on exam_events for select
  using (
    get_my_role() = 'instructor'
    and exists (
      select 1 from exam_participants
      where exam_participants.exam_event_id = exam_events.id
      and is_my_assigned_student(exam_participants.student_id)
    )
  );

create policy "instructor create exam events"
  on exam_events for insert
  with check (get_my_role() = 'instructor' and created_by = auth.uid());

create policy "instructor update own created exam events"
  on exam_events for update
  using (get_my_role() = 'instructor' and created_by = auth.uid());

-- Office/Admin have full access.
create policy "admin office full access exam events"
  on exam_events for all
  using (get_my_role() in ('admin', 'office'));

-- === exam_participants policies ===

create policy "student read own participation"
  on exam_participants for select
  using (student_id = auth.uid());

-- Student can update ONLY their travel_choice on their own row.
-- (Column-level restriction enforced via trigger below, same pattern as role-change protection.)
create policy "student update own travel choice"
  on exam_participants for update
  using (student_id = auth.uid());

create policy "instructor read assigned participants"
  on exam_participants for select
  using (get_my_role() = 'instructor' and is_my_assigned_student(student_id));

create policy "admin office full access participants"
  on exam_participants for all
  using (get_my_role() in ('admin', 'office'));

-- Prevent a student from changing anything except travel_choice on their own row.
create function prevent_student_result_change()
returns trigger as $$
begin
  if get_my_role() = 'student' then
    if new.result != old.result or new.exam_event_id != old.exam_event_id then
      raise exception 'Students may only update their travel choice.';
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger enforce_student_participant_restriction
  before update on exam_participants
  for each row execute function prevent_student_result_change();