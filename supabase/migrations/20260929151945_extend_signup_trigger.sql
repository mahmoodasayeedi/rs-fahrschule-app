-- Signup now also stores phone, and creates the Karteikarte (student_records)
-- from the registration form. training_progress is then created automatically
-- by the existing on_student_record_created trigger.
create or replace function handle_new_user()
returns trigger as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  parsed_birth date;
  parsed_class license_class;
begin
  -- Metadata is client-controlled, so it is treated as untrusted:
  -- the role is ALWAYS student and is never read from it.
  insert into public.profiles (id, role, first_name, last_name, phone)
  values (
    new.id,
    'student',
    left(coalesce(meta->>'first_name', ''), 100),
    left(coalesce(meta->>'last_name', ''), 100),
    nullif(left(coalesce(meta->>'phone', ''), 30), '')
  );

  -- Bad optional values must never block account creation.
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

  insert into public.student_records (profile_id, address, date_of_birth, license_class)
  values (
    new.id,
    nullif(left(coalesce(meta->>'address', ''), 300), ''),
    parsed_birth,
    parsed_class
  );

  return new;
end;
$$ language plpgsql security definer set search_path = public;