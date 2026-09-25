-- SYSTEM/SECURITY domain
-- Scoped audit trail: financial actions, note creation, role changes,
-- and office/instructor-initiated cancellations. Not a general activity
-- log — deliberately narrow, per the agreed scope.

create type audit_action as enum (
  'payment_created', 'payment_updated', 'invoice_created', 'invoice_updated',
  'note_created', 'role_changed', 'appointment_cancelled_by_office'
);

create table audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles(id),
  action audit_action not null,
  entity_type text not null,
  entity_id uuid not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- Payments
create function audit_payment_change()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    insert into audit_log (actor_id, action, entity_type, entity_id, metadata)
    values (auth.uid(), 'payment_created', 'payments', new.id,
      jsonb_build_object('amount', new.amount, 'student_id', new.student_id));
  elsif tg_op = 'UPDATE' then
    insert into audit_log (actor_id, action, entity_type, entity_id, metadata)
    values (auth.uid(), 'payment_updated', 'payments', new.id,
      jsonb_build_object('old_amount', old.amount, 'new_amount', new.amount));
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_payment_change_audit
  after insert or update on payments
  for each row execute function audit_payment_change();

-- Invoices
create function audit_invoice_change()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    insert into audit_log (actor_id, action, entity_type, entity_id, metadata)
    values (auth.uid(), 'invoice_created', 'invoices', new.id,
      jsonb_build_object('invoice_number', new.invoice_number, 'student_id', new.student_id));
  elsif tg_op = 'UPDATE' and new.status != old.status then
    insert into audit_log (actor_id, action, entity_type, entity_id, metadata)
    values (auth.uid(), 'invoice_updated', 'invoices', new.id,
      jsonb_build_object('old_status', old.status, 'new_status', new.status));
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_invoice_change_audit
  after insert or update on invoices
  for each row execute function audit_invoice_change();

-- Notes (category + student only — never logging the actual note content,
-- per privacy-conscious logging)
create function audit_note_created()
returns trigger as $$
begin
  insert into audit_log (actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'note_created', 'student_notes', new.id,
    jsonb_build_object('category', new.category, 'student_id', new.student_id));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_note_created_audit
  after insert on student_notes
  for each row execute function audit_note_created();

-- Role changes
create function audit_role_change()
returns trigger as $$
begin
  if new.role != old.role then
    insert into audit_log (actor_id, action, entity_type, entity_id, metadata)
    values (auth.uid(), 'role_changed', 'profiles', new.id,
      jsonb_build_object('old_role', old.role, 'new_role', new.role));
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_role_change_audit
  after update on profiles
  for each row execute function audit_role_change();

-- Office/Instructor-initiated cancellations only — NOT ordinary student
-- self-service cancellations (those go through cancel_appointment(),
-- already guarded, and aren't in scope for this audit trail).
create function audit_office_cancellation()
returns trigger as $$
begin
  if new.status = 'cancelled' and old.status != 'cancelled'
     and get_my_role() in ('admin', 'office', 'instructor') then
    insert into audit_log (actor_id, action, entity_type, entity_id, metadata)
    values (auth.uid(), 'appointment_cancelled_by_office', 'appointments', new.id,
      jsonb_build_object('previous_status', old.status));
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_office_cancellation_audit
  after update on appointments
  for each row execute function audit_office_cancellation();

alter table audit_log enable row level security;