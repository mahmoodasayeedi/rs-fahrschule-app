-- AUTH/USERS domain
-- Extends Supabase's auth.users with app-specific role and profile data.

create type user_role as enum ('admin', 'office', 'instructor', 'student');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null,
  first_name text not null,
  last_name text not null,
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table instructor_student_assignments (
  id uuid primary key default gen_random_uuid(),
  instructor_id uuid not null references profiles(id),
  student_id uuid not null references profiles(id),
  assigned_at timestamptz not null default now(),
  is_active boolean not null default true
);

-- Auto-create a profile row whenever a new user signs up via Supabase Auth.
-- Defaults new users to 'student' role; role upgrades (to admin/office/instructor)
-- must be done manually by an existing admin, never by the signup flow itself.
create function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, role, first_name, last_name)
  values (
    new.id,
    'student',
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Enable Row Level Security (policies come in the next migration step,
-- once this structure is confirmed working — table stays locked down
-- by default until policies are explicitly added).
alter table profiles enable row level security;
alter table instructor_student_assignments enable row level security;