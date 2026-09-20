-- TRAINING domain
-- Digital student record (Karteikarte), categorized internal notes,
-- structured training-progress counters, and document metadata.

create type license_class as enum ('B', 'BE', 'B197', 'AM', 'A1', 'A2', 'B196');

create type training_status as enum (
  'registered', 'theory_phase', 'practice_phase',
  'ready_for_exam', 'licensed', 'paused', 'withdrawn'
);

create type exam_status as enum ('not_scheduled', 'scheduled', 'passed', 'failed');

create type note_category as enum ('training', 'office', 'financial');

create table student_records (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references profiles(id),
  address text,
  date_of_birth date,
  license_class license_class not null default 'B',
  registration_date date not null default current_date,
  assigned_instructor_id uuid references profiles(id),
  training_status training_status not null default 'registered',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table student_notes (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles(id),
  author_id uuid not null references profiles(id),
  category note_category not null,
  content text not null,
  created_at timestamptz not null default now()
);

create table training_progress (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null unique references profiles(id),
  theory_lessons_completed integer not null default 0,
  theory_exam_status exam_status not null default 'not_scheduled',
  practical_lessons_count integer not null default 0,
  uberland_lessons_count integer not null default 0,
  autobahn_lessons_count integer not null default 0,
  night_lessons_count integer not null default 0,
  special_lessons_count integer not null default 0,
  practical_exam_status exam_status not null default 'not_scheduled',
  updated_at timestamptz not null default now()
);

create table documents (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles(id),
  file_name text not null,
  document_type text,
  storage_path text,
  uploaded_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

-- Auto-create a training_progress row whenever a student_records row is created,
-- so every student has exactly one progress row without manual setup.
create function handle_new_student_record()
returns trigger as $$
begin
  insert into public.training_progress (student_id)
  values (new.profile_id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_student_record_created
  after insert on student_records
  for each row execute function handle_new_student_record();

-- Keep student_records.assigned_instructor_id in sync with the source of
-- truth (instructor_student_assignments), so the denormalized copy never drifts.
create function sync_assigned_instructor()
returns trigger as $$
begin
  if new.is_active then
    update public.student_records
    set assigned_instructor_id = new.instructor_id
    where profile_id = new.student_id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_assignment_change_sync_instructor
  after insert or update on instructor_student_assignments
  for each row execute function sync_assigned_instructor();

-- Auto-increment the correct training_progress counter whenever an
-- appointment's status changes to 'completed'. This is what makes the
-- student's progress view real data instead of a hand-typed percentage.
create function handle_appointment_completed()
returns trigger as $$
begin
  if new.status = 'completed' and old.status != 'completed' then
    update public.training_progress
    set
      practical_lessons_count = practical_lessons_count + case when new.lesson_type = 'normal' then 1 else 0 end,
      uberland_lessons_count = uberland_lessons_count + case when new.lesson_type = 'uberland' then 1 else 0 end,
      autobahn_lessons_count = autobahn_lessons_count + case when new.lesson_type = 'autobahn' then 1 else 0 end,
      night_lessons_count = night_lessons_count + case when new.lesson_type = 'night' then 1 else 0 end,
      special_lessons_count = special_lessons_count + case when new.lesson_type = 'special' then 1 else 0 end,
      updated_at = now()
    where student_id = new.student_id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_appointment_completed_update_progress
  after update on appointments
  for each row execute function handle_appointment_completed();

-- Legal minimums for license class B, per Fahrschüler-Ausbildungsordnung
-- (Anlage 4) — these are government-mandated figures, not assumptions.
-- Practical "normal" lessons have no legal minimum (instructor judgement).
insert into business_config (key, value) values
  ('theory_lessons_minimum_b', '14'),
  ('uberland_lessons_minimum_b', '5'),
  ('autobahn_lessons_minimum_b', '4'),
  ('night_lessons_minimum_b', '3');

-- Lock down until RLS policies are added next.
alter table student_records enable row level security;
alter table student_notes enable row level security;
alter table training_progress enable row level security;
alter table documents enable row level security;
