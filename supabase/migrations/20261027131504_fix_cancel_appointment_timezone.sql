create or replace function cancel_appointment(appointment_id uuid)
returns void as $$
declare
  appt appointments%rowtype;
  window_hours integer;
  appointment_datetime timestamptz;
begin
  select * into appt from appointments where id = appointment_id;

  if appt.id is null then
    raise exception E'Termin nicht gefunden.';
  end if;

  if appt.student_id != auth.uid() then
    raise exception E'Sie k\u00f6nnen nur eigene Termine stornieren.';
  end if;

  if appt.status != 'confirmed' then
    raise exception E'Nur best\u00e4tigte Termine k\u00f6nnen storniert werden.';
  end if;

  select (value::integer) into window_hours
  from business_config where key = 'cancellation_window_hours';

  -- Lesson times are German local time, so convert explicitly.
  -- (The old cast used the database timezone, which is UTC.)
  appointment_datetime :=
    (appt.requested_date + appt.requested_time) at time zone 'Europe/Berlin';

  if appointment_datetime - now() < (window_hours || ' hours')::interval then
    raise exception E'Dieser Termin liegt innerhalb der %-Stunden-Frist und kann nicht mehr regul\u00e4r storniert werden. Bitte kontaktiere das B\u00fcro.', window_hours;
  end if;

  update appointments
  set status = 'cancelled', cancellation_reason = 'on_time'
  where id = appointment_id;
end;
$$ language plpgsql security definer;