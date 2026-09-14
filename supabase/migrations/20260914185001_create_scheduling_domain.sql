-- SCHEDULING domain
-- Core appointment request/approval workflow, alternative proposals, and
-- centrally-configurable business rules (e.g. the 24-hour cancellation window).

create type appointment_status as enum (
  'requested',
  'confirmed',
  'rejected',
  'alternative_proposed',
  'cancelled',
  'completed',
  'no_show'
);

create type lesson_type as enum (
  'normal',
  'uberland',
  'autobahn',
  'night',
  'special'
);

create type cancellation_reason as enum (
  'on_time',
  'short_notice',
  'no_show',
  'excused'
);

create table appointments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles(id),
  instructor_id uuid references profiles(id),
  status appointment_status not null default 'requested',
  requested_date date not null,
  requested_time time not null,
  duration_minutes integer not null,
  pickup_location text not null,
  end_location text,
  lesson_type lesson_type not null,
  cancellation_reason cancellation_reason,
  office_notes text,
  student_facing_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table alternative_proposals (
  id uuid primary key default gen_random_uuid(),
  original_appointment_id uuid not null references appointments(id),
  proposed_date date not null,
  proposed_time time not null,
  proposed_instructor_id uuid references profiles(id),
  selected boolean not null default false,
  created_at timestamptz not null default now()
);

create table business_config (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

-- Seed the 24-hour cancellation rule as data, not code.
insert into business_config (key, value)
values ('cancellation_window_hours', '24');

-- Keep updated_at current whenever an appointment row changes.
create function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger appointments_set_updated_at
  before update on appointments
  for each row execute function set_updated_at();

-- Lock everything down by default until policies are added next.
alter table appointments enable row level security;
alter table alternative_proposals enable row level security;
alter table business_config enable row level security;