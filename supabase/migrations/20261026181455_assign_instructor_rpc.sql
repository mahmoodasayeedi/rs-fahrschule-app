create or replace function assign_instructor(
  p_student_id uuid,
  p_instructor_id uuid,
  p_reason text default null
)
returns void as $$
begin
  if get_my_role() not in ('admin', 'office') then
    raise exception E'Nur B\u00fcro oder Administratoren d\u00fcrfen Fahrlehrer zuweisen.';
  end if;

  if not exists (
    select 1 from profiles
    where id = p_student_id and role = 'student'
  ) then
    raise exception E'Fahrsch\u00fcler nicht gefunden.';
  end if;

  if not exists (
    select 1 from profiles
    where id = p_instructor_id and role = 'instructor' and is_active = true
  ) then
    raise exception E'Der gew\u00e4hlte Fahrlehrer ist nicht aktiv.';
  end if;

  -- Already assigned to this instructor: nothing to do.
  if exists (
    select 1 from instructor_student_assignments
    where student_id = p_student_id
      and instructor_id = p_instructor_id
      and is_active = true
  ) then
    return;
  end if;

  update instructor_student_assignments
  set is_active = false
  where student_id = p_student_id and is_active = true;

  insert into instructor_student_assignments (instructor_id, student_id)
  values (p_instructor_id, p_student_id);

  insert into audit_log (actor_id, action, entity_type, entity_id, metadata)
  values (
    auth.uid(), 'instructor_assigned', 'profiles', p_student_id,
    jsonb_build_object('instructor_id', p_instructor_id, 'reason', p_reason)
  );
end;
$$ language plpgsql security definer set search_path = public;