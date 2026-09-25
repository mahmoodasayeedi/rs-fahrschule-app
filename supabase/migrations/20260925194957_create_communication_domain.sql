-- COMMUNICATION domain
-- In-app notifications, created automatically by triggers on real events.
-- Time-based reminders (48h/24h before a lesson) require a scheduled job
-- (pg_cron) and are deferred to the Notifications phase — flagged in
-- ASSUMPTIONS.md, not silently skipped.

create type notification_type as enum (
  'request_received', 'appointment_confirmed', 'appointment_rejected',
  'alternative_proposed', 'lesson_reminder_48h', 'lesson_reminder_24h',
  'theory_exam_reminder', 'practical_exam_reminder', 'appointment_changed'
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references profiles(id),
  type notification_type not null,
  title text not null,
  body text not null,
  related_appointment_id uuid references appointments(id),
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- New appointment request -> notify all Office/Admin, so someone actually
-- knows to review it (the PDF frames notifications as student-facing, but
-- the workflow can't function without office being alerted too).
create function notify_on_appointment_request()
returns trigger as $$
begin
  if new.status = 'requested' then
    insert into notifications (recipient_id, type, title, body, related_appointment_id)
    select id, 'request_received', 'Neue Terminanfrage',
      'Eine neue Terminanfrage für den ' || new.requested_date || ' liegt vor.',
      new.id
    from profiles
    where role in ('admin', 'office');
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_appointment_requested_notify
  after insert on appointments
  for each row execute function notify_on_appointment_request();

-- Status changes -> notify the student.
create function notify_on_appointment_status_change()
returns trigger as $$
declare
  notif_type notification_type;
  notif_title text;
  notif_body text;
begin
  if new.status = old.status then
    return new;
  end if;

  if new.status = 'confirmed' then
    notif_type := 'appointment_confirmed';
    notif_title := 'Termin bestätigt';
    notif_body := 'Dein Termin am ' || new.requested_date || ' um ' || new.requested_time || ' wurde bestätigt.';
  elsif new.status = 'rejected' then
    notif_type := 'appointment_rejected';
    notif_title := 'Termin abgelehnt';
    notif_body := coalesce(new.student_facing_reason, 'Dein Termin wurde abgelehnt. Bitte kontaktiere das Büro.');
  elsif new.status = 'alternative_proposed' then
    notif_type := 'alternative_proposed';
    notif_title := 'Alternativtermin vorgeschlagen';
    notif_body := 'Für deine Anfrage wurde ein Alternativtermin vorgeschlagen.';
  else
    return new;
  end if;

  insert into notifications (recipient_id, type, title, body, related_appointment_id)
  values (new.student_id, notif_type, notif_title, notif_body, new.id);

  return new;
end;
$$ language plpgsql security definer;

create trigger on_appointment_status_change_notify
  after update on appointments
  for each row execute function notify_on_appointment_status_change();

-- Users can only mark their own notifications as read — nothing else
-- about a notification should be editable by its recipient.
create function prevent_notification_content_change()
returns trigger as $$
begin
  if new.type != old.type or new.title != old.title or new.body != old.body
     or new.recipient_id != old.recipient_id
     or new.related_appointment_id is distinct from old.related_appointment_id then
    raise exception 'Only is_read can be updated on a notification.';
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger enforce_notification_update_restriction
  before update on notifications
  for each row execute function prevent_notification_content_change();

alter table notifications enable row level security;