-- Instructor (or office/admin) cancels a CONFIRMED lesson that has not started.
-- Recorded with reason 'instructor' (not a student cancellation, so the
-- 24-hour rule and billing never apply) and the student is notified
-- automatically. Started lessons are closed out with finish_appointment.
create or replace function public.instructor_cancel_appointment(
  p_appointment_id uuid,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_appt public.appointments%rowtype;
  v_role public.user_role := public.get_my_role();
  v_starts timestamptz;
  v_reason text := nullif(trim(coalesce(p_reason, '')), '');
  v_body text;
begin
  select * into v_appt from public.appointments where id = p_appointment_id for update;
  if not found then
    raise exception 'Termin nicht gefunden';
  end if;

  if not (
    v_role in ('admin', 'office')
    or (v_role = 'instructor' and v_appt.instructor_id = auth.uid())
  ) then
    raise exception 'Keine Berechtigung';
  end if;

  if v_appt.status <> 'confirmed' then
    raise exception 'Nur bestätigte Termine können abgesagt werden.';
  end if;

  v_starts := (v_appt.requested_date + v_appt.requested_time) at time zone 'Europe/Berlin';
  if v_starts <= now() then
    raise exception 'Dieser Termin hat bereits begonnen und wird über "Abschluss" erledigt.';
  end if;

  if v_reason is not null and length(v_reason) > 300 then
    raise exception 'Die Begründung ist zu lang (maximal 300 Zeichen).';
  end if;

  update public.appointments
  set status = 'cancelled',
      cancellation_reason = 'instructor',
      student_facing_reason = v_reason
  where id = p_appointment_id;

  v_body := 'Deine Fahrstunde am ' || to_char(v_appt.requested_date, 'DD.MM.YYYY')
    || ' um ' || to_char(v_appt.requested_time, 'HH24:MI')
    || ' Uhr wurde vom Fahrlehrer abgesagt.'
    || case when v_reason is not null then ' Grund: ' || v_reason || '.' else '' end
    || ' Du musst nichts bezahlen. Bitte fordere einen neuen Termin an oder melde dich im Büro.';

  insert into public.notifications (recipient_id, type, title, body, related_appointment_id)
  values (v_appt.student_id, 'appointment_changed', 'Fahrstunde abgesagt', v_body, p_appointment_id);
end;
$$;

revoke all on function public.instructor_cancel_appointment(uuid, text) from public, anon;
grant execute on function public.instructor_cancel_appointment(uuid, text) to authenticated;
