create or replace function set_theory_lessons(
  p_student_id uuid,
  p_count integer
)
returns void as $$
declare
  old_count integer;
begin
  if get_my_role() not in ('admin', 'office') then
    raise exception E'Nur B\u00fcro oder Administratoren d\u00fcrfen Theoriestunden \u00e4ndern.';
  end if;

  if p_count is null or p_count < 0 or p_count > 99 then
    raise exception E'Ung\u00fcltige Anzahl. Erlaubt sind Werte von 0 bis 99.';
  end if;

  select theory_lessons_completed into old_count
  from training_progress where student_id = p_student_id;

  if not found then
    raise exception E'Fahrsch\u00fcler nicht gefunden.';
  end if;

  -- Nothing to change.
  if old_count = p_count then
    return;
  end if;

  update training_progress
  set theory_lessons_completed = p_count, updated_at = now()
  where student_id = p_student_id;

  insert into audit_log (actor_id, action, entity_type, entity_id, metadata)
  values (
    auth.uid(), 'theory_lessons_set', 'training_progress', p_student_id,
    jsonb_build_object('old', old_count, 'new', p_count)
  );
end;
$$ language plpgsql security definer set search_path = public;