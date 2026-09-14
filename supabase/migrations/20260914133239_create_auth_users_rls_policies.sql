-- Helper function: safely get the current user's role without recursive RLS issues.
create function get_my_role()
returns user_role as $$
  select role from public.profiles where id = auth.uid();
$$ language sql security definer stable;

-- Helper function: is the current user an active instructor assigned to this student?
create function is_my_assigned_student(student uuid)
returns boolean as $$
  select exists (
    select 1 from public.instructor_student_assignments
    where instructor_id = auth.uid()
      and student_id = student
      and is_active = true
  );
$$ language sql security definer stable;

-- === profiles policies ===

-- Everyone can read their own profile.
create policy "read own profile"
  on profiles for select
  using (id = auth.uid());

-- Admin and Office can read all profiles.
create policy "admin office read all profiles"
  on profiles for select
  using (get_my_role() in ('admin', 'office'));

-- Instructor can read profiles of their assigned students.
create policy "instructor read assigned student profiles"
  on profiles for select
  using (
    get_my_role() = 'instructor'
    and is_my_assigned_student(id)
  );

-- Users can update their own name/phone — but NOT their own role.
create policy "update own profile except role"
  on profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- Admin can update any profile (including role changes).
create policy "admin update any profile"
  on profiles for update
  using (get_my_role() = 'admin');

-- === instructor_student_assignments policies ===

-- Admin and Office have full access.
create policy "admin office full access assignments"
  on instructor_student_assignments for all
  using (get_my_role() in ('admin', 'office'));

-- Instructor can read their own assignments.
create policy "instructor read own assignments"
  on instructor_student_assignments for select
  using (instructor_id = auth.uid());

  -- Prevent any non-admin from changing their own role via direct update,
-- even though the UPDATE policy itself allows updating the row.
create function prevent_self_role_change()
returns trigger as $$
begin
  if new.role != old.role and get_my_role() != 'admin' then
    raise exception 'Only admin can change roles.';
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger enforce_role_change_restriction
  before update on profiles
  for each row execute function prevent_self_role_change();