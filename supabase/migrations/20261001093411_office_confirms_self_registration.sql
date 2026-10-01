-- Office approval workflow for self-registered students. Per client
-- answer: self-registration is allowed, but an account stays "pending"
-- until Office confirms it in person. If not confirmed within the
-- configured window, it is deleted automatically.

create type registration_status as enum ('pending', 'confirmed');

alter table student_records
  add column registration_status registration_status not null default 'confirmed',
  add column registration_deadline timestamptz;

insert into business_config (key, value)
values ('registration_activation_window_days', '14');

-- Replaces yesterday's version. 'created_by_office' can only ever be set
-- by a server-side admin action (Office creating an account directly,
-- Phase 8), never by the public signup form a student uses, so it's safe
-- to trust here the same way role is never trusted from client metadata.
create or replace function handle_new_user()
returns trigger as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  parsed_birth date;
  parsed_class license_class;
  created_by_office boolean := coalesce((meta->>'created_by_office')::boolean, false);
  activation_days integer;
begin
  insert into public.profiles (id, role, first_name, last_name, phone)
  values (
    new.id, 'student',
    left(coalesce(meta->>'first_name', ''), 100),
    left(coalesce(meta->>'last_name', ''), 100),
    nullif(left(coalesce(meta->>'phone', ''), 30), '')
  );

  begin
    parsed_birth := (meta->>'birth_date')::date;
  exception when others then
    parsed_birth := null;
  end;

  begin
    parsed_class := coalesce(nullif(meta->>'license_class', ''), 'B')::license_class;
  exception when others then
    parsed_class := 'B';
  end;

  if created_by_office then
    insert into public.student_records
      (profile_id, address, date_of_birth, license_class, registration_status, registration_deadline)
    values (
      new.id, nullif(left(coalesce(meta->>'address', ''), 300), ''),
      parsed_birth, parsed_class, 'confirmed', null
    );
  else
    select (value::integer) into activation_days
    from public.business_config where key = 'registration_activation_window_days';

    insert into public.student_records
      (profile_id, address, date_of_birth, license_class, registration_status, registration_deadline)
    values (
      new.id, nullif(left(coalesce(meta->>'address', ''), 300), ''),
      parsed_birth, parsed_class, 'pending',
      now() + (coalesce(activation_days, 14) || ' days')::interval
    );
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- Office confirms a pending student. Manual SQL call for now; a real
-- button arrives with the Office dashboard (Phase 8).
create function confirm_student_registration(student uuid)
returns void as $$
begin
  if get_my_role() not in ('admin', 'office') then
    raise exception 'Only Office or Admin can confirm a registration.';
  end if;

  update student_records
  set registration_status = 'confirmed', registration_deadline = null
  where profile_id = student;
end;
$$ language plpgsql security definer;

-- Daily cleanup: deletes any still-pending account past its deadline.
-- Scoped only to what a brand-new pending signup can have. If a pending
-- account unexpectedly has appointments/payments/invoices already,
-- deletion is skipped for manual review rather than cascading.
create function delete_expired_pending_registrations()
returns void as $$
declare
  expired record;
begin
  for expired in
    select profile_id from student_records
    where registration_status = 'pending' and registration_deadline < now()
  loop
    if exists (select 1 from appointments where student_id = expired.profile_id)
      or exists (select 1 from payments where student_id = expired.profile_id)
      or exists (select 1 from invoices where student_id = expired.profile_id)
    then
      continue;
    end if;

    delete from training_progress where student_id = expired.profile_id;
    delete from student_records where profile_id = expired.profile_id;
    delete from profiles where id = expired.profile_id;
    delete from auth.users where id = expired.profile_id;
  end loop;
end;
$$ language plpgsql security definer;

create extension if not exists pg_cron with schema extensions;

select cron.schedule(
  'delete-expired-pending-registrations',
  '0 3 * * *',
  $$ select delete_expired_pending_registrations(); $$
);

-- Defense in depth: a pending student can't request appointments through
-- the API even if the app's own gating were ever bypassed.
drop policy if exists "student create own appointment request" on appointments;
create policy "student create own appointment request"
  on appointments for insert
  with check (
    student_id = auth.uid()
    and status = 'requested'
    and exists (
      select 1 from student_records
      where profile_id = auth.uid() and registration_status = 'confirmed'
    )
  );