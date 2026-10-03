-- An instructor needs to see the name of a student who has requested an
-- appointment with them, even before Office has created a formal
-- instructor_student_assignments row. Scoped narrowly: only students who
-- actually have an appointment with this instructor, nothing broader.
create policy "instructor read students with own appointments"
  on profiles for select
  using (
    get_my_role() = 'instructor'
    and exists (
      select 1 from appointments
      where appointments.student_id = profiles.id
      and appointments.instructor_id = auth.uid()
    )
  );