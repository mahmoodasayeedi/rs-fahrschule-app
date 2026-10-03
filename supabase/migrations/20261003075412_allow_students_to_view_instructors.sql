-- Students need to see active instructors' names to request an appointment
-- with one. Scoped narrowly: only role = instructor, only is_active = true,
-- nothing else becomes visible to a student through this policy.
create policy "student read active instructors"
  on profiles for select
  using (
    get_my_role() = 'student'
    and role = 'instructor'
    and is_active = true
  );