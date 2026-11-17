-- Propose 1-3 alternative times for an open request, as ONE atomic step.
-- Allowed for office/admin, or the instructor assigned to the appointment.
-- p_slots example: [{"date":"2026-11-25","time":"10:00"}]
create or replace function public.propose_alternatives(p_appointment_id uuid, p_slots jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_appt public.appointments%rowtype;
  v_role public.user_role := public.get_my_role();
  v_slot jsonb;
  v_date date;
  v_time time;
  v_today date := (now() at time zone 'Europe/Berlin')::date;
begin
  select * into v_appt from public.appointments where id = p_appointment_id;
  if not found then
    raise exception 'Termin nicht gefunden';
  end if;

  if not (
    v_role in ('admin', 'office')
    or (v_role = 'instructor' and v_appt.instructor_id = auth.uid())
  ) then
    raise exception 'Keine Berechtigung';
  end if;

  if v_appt.status not in ('requested', 'alternative_proposed') then
    raise exception 'Für diesen Termin können keine Alternativen vorgeschlagen werden.';
  end if;

  if p_slots is null or jsonb_typeof(p_slots) <> 'array'
     or jsonb_array_length(p_slots) < 1 or jsonb_array_length(p_slots) > 3 then
    raise exception 'Bitte 1 bis 3 Terminvorschläge angeben.';
  end if;

  -- validate everything before changing anything
  for v_slot in select * from jsonb_array_elements(p_slots) loop
    begin
      v_date := (v_slot->>'date')::date;
      v_time := (v_slot->>'time')::time;
    exception when others then
      raise exception 'Ungültiges Datum oder Uhrzeit.';
    end;
    if v_date is null or v_time is null then
      raise exception 'Ungültiges Datum oder Uhrzeit.';
    end if;
    if v_date < v_today then
      raise exception 'Ein Terminvorschlag liegt in der Vergangenheit.';
    end if;
  end loop;

  -- replace any earlier, not yet selected proposals
  delete from public.alternative_proposals
  where original_appointment_id = p_appointment_id and not selected;

  for v_slot in select * from jsonb_array_elements(p_slots) loop
    insert into public.alternative_proposals(original_appointment_id, proposed_date, proposed_time)
    values (p_appointment_id, (v_slot->>'date')::date, (v_slot->>'time')::time);
  end loop;

  update public.appointments
  set status = 'alternative_proposed'
  where id = p_appointment_id;
end;
$$;

revoke all on function public.propose_alternatives(uuid, jsonb) from public, anon;
grant execute on function public.propose_alternatives(uuid, jsonb) to authenticated;
