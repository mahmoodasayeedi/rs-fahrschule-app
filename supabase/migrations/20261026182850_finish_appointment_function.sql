create or replace function finish_appointment(
  p_appointment_id uuid,
  p_outcome text
)
returns void as $$
declare
  appt appointments%rowtype;
  lesson_start timestamptz;
begin
  select * into appt from appointments where id = p_appointment_id;

  if appt.id is null then
    raise exception E'Termin nicht gefunden.';
  end if;

  if not (
    get_my_role() in ('admin', 'office')
    or (get_my_role() = 'instructor' and appt.instructor_id = auth.uid())
  ) then
    raise exception E'Keine Berechtigung f\u00fcr diesen Termin.';
  end if;

  if appt.status <> 'confirmed' then
    raise exception E'Nur best\u00e4tigte Termine k\u00f6nnen abgeschlossen werden.';
  end if;

  -- Lesson times are German local time, so convert explicitly.
  lesson_start := (appt.requested_date + appt.requested_time) at time zone 'Europe/Berlin';

  if lesson_start > now() then
    raise exception E'Der Termin hat noch nicht begonnen.';
  end if;

  if p_outcome = 'completed' then
    update appointments set status = 'completed' where id = p_appointment_id;
  elsif p_outcome = 'no_show' then
    update appointments
      set status = 'no_show', cancellation_reason = 'no_show'
      where id = p_appointment_id;
  elsif p_outcome = 'excused' then
    update appointments
      set status = 'cancelled', cancellation_reason = 'excused'
      where id = p_appointment_id;
  else
    raise exception E'Unbekanntes Ergebnis.';
  end if;
end;
$$ language plpgsql security definer set search_path = public;