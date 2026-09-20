-- === student_records policies ===

create policy "student read own record"
  on student_records for select
  using (profile_id = auth.uid());

create policy "instructor read assigned student records"
  on student_records for select
  using (get_my_role() = 'instructor' and is_my_assigned_student(profile_id));

create policy "admin office full access student records"
  on student_records for all
  using (get_my_role() in ('admin', 'office'));

-- === student_notes policies ===
-- Students have NO access to this table at all — no policy is added for
-- them, which combined with RLS being enabled means they see nothing.

create policy "instructor read own training notes"
  on student_notes for select
  using (
    get_my_role() = 'instructor'
    and category = 'training'
    and is_my_assigned_student(student_id)
  );

create policy "instructor create training notes"
  on student_notes for insert
  with check (
    get_my_role() = 'instructor'
    and category = 'training'
    and is_my_assigned_student(student_id)
    and author_id = auth.uid()
  );

create policy "admin office full access notes"
  on student_notes for all
  using (get_my_role() in ('admin', 'office'));

-- === training_progress policies ===

create policy "student read own progress"
  on training_progress for select
  using (student_id = auth.uid());

create policy "instructor read assigned progress"
  on training_progress for select
  using (get_my_role() = 'instructor' and is_my_assigned_student(student_id));

-- Admin/Office get full access, including manual correction (UPDATE) —
-- normal operation relies on the trigger, this is the deliberate exception path.
create policy "admin office full access progress"
  on training_progress for all
  using (get_my_role() in ('admin', 'office'));

-- === documents policies ===
-- Student access intentionally left out for now — see ASSUMPTIONS.md,
-- question #6 (document visibility) is explicitly unresolved.

create policy "instructor read assigned student documents"
  on documents for select
  using (get_my_role() = 'instructor' and is_my_assigned_student(student_id));

create policy "admin office full access documents"
  on documents for all
  using (get_my_role() in ('admin', 'office'));