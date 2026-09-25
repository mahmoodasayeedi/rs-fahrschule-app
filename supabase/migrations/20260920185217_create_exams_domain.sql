-- EXAMS domain
-- Exam events (theory/practical), participant assignment with
-- self-travel vs. ride-along choice, and results.

create type exam_type as enum ('theory', 'practical');
create type travel_choice as enum ('self', 'with_fahrschule');
create type exam_result as enum ('pending', 'passed', 'failed', 'no_show');

create table exam_events (
  id uuid primary key default gen_random_uuid(),
  exam_type exam_type not null,
  title text not null,
  exam_date date not null,
  exam_time time not null,
  exam_location text not null,
  meeting_point text,
  departure_time time,
  instructions text,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

create table exam_participants (
  id uuid primary key default gen_random_uuid(),
  exam_event_id uuid not null references exam_events(id),
  student_id uuid not null references profiles(id),
  travel_choice travel_choice,
  result exam_result not null default 'pending',
  created_at timestamptz not null default now(),
  unique (exam_event_id, student_id)
);

-- When a result is recorded as passed/failed, sync it into the student's
-- training_progress — same principle as lesson counters: one source of
-- truth, not hand-duplicated data.
create function sync_exam_result_to_progress()
returns trigger as $$
begin
  if new.result in ('passed', 'failed') and new.result != old.result then
    if (select exam_type from exam_events where id = new.exam_event_id) = 'theory' then
      update public.training_progress
      set theory_exam_status = new.result::text::exam_status, updated_at = now()
      where student_id = new.student_id;
    else
      update public.training_progress
      set practical_exam_status = new.result::text::exam_status, updated_at = now()
      where student_id = new.student_id;
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_exam_result_update_progress
  after update on exam_participants
  for each row execute function sync_exam_result_to_progress();

alter table exam_events enable row level security;
alter table exam_participants enable row level security;