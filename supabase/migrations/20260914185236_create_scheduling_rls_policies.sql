-- === appointments policies ===

-- Student can read their own appointments.
create policy "student read own appointments"
  on appointments for select
  using (student_id = auth.uid());

-- Student can create a new request for themselves only.
create policy "student create own appointment request"
  on appointments for insert
  with check (student_id = auth.uid() and status = 'requested');

-- Instructor can read/update appointments where they are assigned.
create policy "instructor read own appointments"
  on appointments for select
  using (instructor_id = auth.uid());

create policy "instructor update own appointments"
  on appointments for update
  using (instructor_id = auth.uid());

-- Office and Admin have full access.
create policy "admin office full access appointments"
  on appointments for all
  using (get_my_role() in ('admin', 'office'));

-- === alternative_proposals policies ===

create policy "student read own proposals"
  on alternative_proposals for select
  using (
    exists (
      select 1 from appointments
      where appointments.id = original_appointment_id
      and appointments.student_id = auth.uid()
    )
  );

-- Student can only flip 'selected' on their own proposal — handled via
-- a function below, not a direct UPDATE policy, since selecting a proposal
-- also needs to update the original appointment atomically.

create policy "instructor manage proposals for own appointments"
  on alternative_proposals for all
  using (
    exists (
      select 1 from appointments
      where appointments.id = original_appointment_id
      and appointments.instructor_id = auth.uid()
    )
  );

create policy "admin office full access proposals"
  on alternative_proposals for all
  using (get_my_role() in ('admin', 'office'));

-- === business_config policies ===

-- Everyone can read config (e.g. so the app can show "cancel until X" messaging).
create policy "everyone read business config"
  on business_config for select
  using (true);

-- Only admin can change config.
create policy "admin update business config"
  on business_config for all
  using (get_my_role() = 'admin');

-- === The 24-hour cancellation function ===
-- This is the ONLY way a student can cancel a confirmed appointment.
-- It enforces the configurable cancellation window server-side —
-- a raw UPDATE from the student is not permitted (no student UPDATE
-- policy exists on appointments for this purpose).

create function cancel_appointment(appointment_id uuid)
returns void as $$
declare
  appt appointments%rowtype;
  window_hours integer;
  appointment_datetime timestamptz;
begin
  select * into appt from appointments where id = appointment_id;

  if appt.student_id != auth.uid() then
    raise exception 'You can only cancel your own appointments.';
  end if;

  if appt.status != 'confirmed' then
    raise exception 'Only confirmed appointments can be cancelled this way.';
  end if;

  select (value::integer) into window_hours
  from business_config where key = 'cancellation_window_hours';

  appointment_datetime := (appt.requested_date + appt.requested_time)::timestamptz;

  if appointment_datetime - now() < (window_hours || ' hours')::interval then
    raise exception 'This appointment is within the % hour cancellation window and cannot be cancelled here. Please contact the office.', window_hours;
  end if;

  update appointments
  set status = 'cancelled', cancellation_reason = 'on_time'
  where id = appointment_id;
end;
$$ language plpgsql security definer;