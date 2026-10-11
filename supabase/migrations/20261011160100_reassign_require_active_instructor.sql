create or replace function public.reassign_appointment(
  p_appointment_id uuid,
  p_new_instructor_id uuid,
  p_reason text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_appt appointments%rowtype;
  v_start timestamp;
  v_end timestamp;
begin
  if get_my_role()::text not in ('office', 'admin') then
    raise exception 'Nicht berechtigt';
  end if;

  select * into v_appt from appointments
  where id = p_appointment_id for update;

  if not found then
    raise exception 'Termin nicht gefunden';
  end if;

  if v_appt.status::text not in ('requested', 'confirmed') then
    raise exception 'Dieser Termin kann nicht mehr neu zugewiesen werden';
  end if;

  if v_appt.instructor_id is not distinct from p_new_instructor_id then
    raise exception 'Termin ist bereits diesem Fahrlehrer zugewiesen';
  end if;

  if not exists (
    select 1 from profiles
    where id = p_new_instructor_id
      and role::text = 'instructor'
      and is_active
  ) then
    raise exception 'Ungültiger oder inaktiver Fahrlehrer';
  end if;

  v_start := v_appt.requested_date + v_appt.requested_time;
  v_end   := v_start + (v_appt.duration_minutes * interval '1 minute');

  if exists (
    select 1 from appointments a
    where a.instructor_id = p_new_instructor_id
      and a.id <> v_appt.id
      and a.status::text = 'confirmed'
      and (a.requested_date + a.requested_time) < v_end
      and (a.requested_date + a.requested_time)
          + (a.duration_minutes * interval '1 minute') > v_start
  ) then
    raise exception 'Der Fahrlehrer hat zu dieser Zeit bereits einen Termin';
  end if;

  update appointments
  set instructor_id = p_new_instructor_id,
      office_notes = concat_ws(E'\n', office_notes,
        format('[%s] Neu zugewiesen durch Büro%s',
               to_char(now(), 'DD.MM.YYYY HH24:MI'),
               case when p_reason is not null and p_reason <> ''
                    then ': ' || p_reason else '' end))
  where id = v_appt.id;

  insert into notifications (recipient_id, type, title, body, related_appointment_id)
  values (v_appt.student_id, 'appointment_reassigned', 'Fahrlehrer geändert',
          'Dein Termin am ' || to_char(v_appt.requested_date, 'DD.MM.YYYY')
            || ' wurde einem anderen Fahrlehrer zugewiesen.',
          v_appt.id);

  insert into notifications (recipient_id, type, title, body, related_appointment_id)
  values (p_new_instructor_id, 'appointment_reassigned', 'Neuer Termin zugewiesen',
          'Das Büro hat dir einen Termin am '
            || to_char(v_appt.requested_date, 'DD.MM.YYYY') || ' um '
            || to_char(v_appt.requested_time, 'HH24:MI') || ' zugewiesen.',
          v_appt.id);

  if v_appt.instructor_id is not null then
    insert into notifications (recipient_id, type, title, body, related_appointment_id)
    values (v_appt.instructor_id, 'appointment_reassigned', 'Termin neu zugewiesen',
            'Dein Termin am ' || to_char(v_appt.requested_date, 'DD.MM.YYYY')
              || ' wurde einem anderen Fahrlehrer zugewiesen.',
            v_appt.id);
  end if;
end;
$$;

revoke all on function public.reassign_appointment(uuid, uuid, text) from public;
grant execute on function public.reassign_appointment(uuid, uuid, text) to authenticated;