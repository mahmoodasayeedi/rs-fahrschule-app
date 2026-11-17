-- Prevents double-booking: an appointment cannot become (or stay) confirmed
-- if it overlaps another confirmed appointment of the same instructor or
-- the same student. Runs for every path (office, instructor, alternative
-- selection, reassignment). SECURITY DEFINER so the check sees ALL
-- appointments, not just the ones the caller may read; the error messages
-- deliberately don't name the other person.
create or replace function public.check_appointment_conflict()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_start timestamp;
  v_end timestamp;
begin
  if new.status <> 'confirmed' then
    return new;
  end if;

  -- Only re-check when something relevant changed.
  if tg_op = 'UPDATE'
     and old.status = 'confirmed'
     and old.instructor_id is not distinct from new.instructor_id
     and old.requested_date = new.requested_date
     and old.requested_time = new.requested_time
     and old.duration_minutes = new.duration_minutes then
    return new;
  end if;

  v_start := new.requested_date + new.requested_time;
  v_end := v_start + make_interval(mins => new.duration_minutes);

  if new.instructor_id is not null and exists (
    select 1 from public.appointments a
    where a.id <> new.id
      and a.status = 'confirmed'
      and a.instructor_id = new.instructor_id
      and (a.requested_date + a.requested_time,
           a.requested_date + a.requested_time + make_interval(mins => a.duration_minutes))
          overlaps (v_start, v_end)
  ) then
    raise exception 'Der Fahrlehrer hat zu dieser Zeit bereits einen bestätigten Termin.';
  end if;

  if exists (
    select 1 from public.appointments a
    where a.id <> new.id
      and a.status = 'confirmed'
      and a.student_id = new.student_id
      and (a.requested_date + a.requested_time,
           a.requested_date + a.requested_time + make_interval(mins => a.duration_minutes))
          overlaps (v_start, v_end)
  ) then
    raise exception 'Der Fahrschüler hat zu dieser Zeit bereits einen bestätigten Termin.';
  end if;

  return new;
end;
$$;

drop trigger if exists appointment_conflict_check on public.appointments;
create trigger appointment_conflict_check
  before insert or update on public.appointments
  for each row execute function public.check_appointment_conflict();
