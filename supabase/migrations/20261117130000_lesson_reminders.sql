-- In-app reminders 48h and 24h before a confirmed lesson.
-- Runs every 15 minutes via pg_cron. Each reminder is created at most once
-- per appointment (checked against existing notifications). Cancelled,
-- rejected or past appointments get none. Lesson times are German local time.
create or replace function public.send_lesson_reminders()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  v_type notification_type;
  v_title text;
  v_when text;
  v_instructor text;
begin
  for r in
    select a.id, a.student_id, a.instructor_id, a.requested_date, a.requested_time,
           a.duration_minutes, a.pickup_location,
           ((a.requested_date + a.requested_time) at time zone 'Europe/Berlin') as starts_at
    from appointments a
    where a.status = 'confirmed'
      and ((a.requested_date + a.requested_time) at time zone 'Europe/Berlin')
          between now() and now() + interval '48 hours'
  loop
    if r.starts_at <= now() + interval '24 hours' then
      v_type := 'lesson_reminder_24h';
      v_title := 'Erinnerung: Fahrstunde in 24 Stunden';
    else
      v_type := 'lesson_reminder_48h';
      v_title := 'Erinnerung: Fahrstunde in 2 Tagen';
    end if;

    -- Never send the 48h reminder if the 24h one was already sent, and
    -- never send the same reminder twice.
    if exists (
      select 1 from notifications n
      where n.related_appointment_id = r.id
        and n.type in (v_type, 'lesson_reminder_24h')
    ) then
      continue;
    end if;

    select coalesce(nullif(trim(coalesce(p.first_name,'') || ' ' || coalesce(p.last_name,'')), ''), 'noch nicht zugewiesen')
      into v_instructor
    from profiles p where p.id = r.instructor_id;
    if v_instructor is null then
      v_instructor := 'noch nicht zugewiesen';
    end if;

    v_when := to_char(r.requested_date, 'DD.MM.YYYY') || ' um ' || to_char(r.requested_time, 'HH24:MI') || ' Uhr';

    insert into notifications (recipient_id, type, title, body, related_appointment_id)
    values (
      r.student_id, v_type, v_title,
      'Deine Fahrstunde am ' || v_when || '. Fahrlehrer: ' || v_instructor ||
      '. Abholort: ' || r.pickup_location || '.',
      r.id
    );
  end loop;
end;
$$;

revoke all on function public.send_lesson_reminders() from public, anon, authenticated;

select cron.schedule(
  'send-lesson-reminders',
  '*/15 * * * *',
  $$ select public.send_lesson_reminders(); $$
);
