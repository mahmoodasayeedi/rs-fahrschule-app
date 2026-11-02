create or replace function sync_exam_registration_status()
returns trigger as $$
declare
  ev_type exam_type;
begin
  if tg_op = 'INSERT' then
    select exam_type into ev_type from exam_events where id = new.exam_event_id;

    if ev_type = 'theory' then
      update training_progress
      set theory_exam_status = 'scheduled', updated_at = now()
      where student_id = new.student_id
        and theory_exam_status in ('not_scheduled', 'failed');
    else
      update training_progress
      set practical_exam_status = 'scheduled', updated_at = now()
      where student_id = new.student_id
        and practical_exam_status in ('not_scheduled', 'failed');
    end if;

    return new;
  end if;

  -- DELETE
  select exam_type into ev_type from exam_events where id = old.exam_event_id;

  if ev_type = 'theory' then
    update training_progress
    set theory_exam_status = 'not_scheduled', updated_at = now()
    where student_id = old.student_id
      and theory_exam_status = 'scheduled'
      and not exists (
        select 1 from exam_participants p
        join exam_events e on e.id = p.exam_event_id
        where p.student_id = old.student_id
          and e.exam_type = 'theory'
          and p.result = 'pending'
          and p.id <> old.id
      );
  else
    update training_progress
    set practical_exam_status = 'not_scheduled', updated_at = now()
    where student_id = old.student_id
      and practical_exam_status = 'scheduled'
      and not exists (
        select 1 from exam_participants p
        join exam_events e on e.id = p.exam_event_id
        where p.student_id = old.student_id
          and e.exam_type = 'practical'
          and p.result = 'pending'
          and p.id <> old.id
      );
  end if;

  return old;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_exam_participant_added
  after insert on exam_participants
  for each row execute function sync_exam_registration_status();

create trigger on_exam_participant_removed
  after delete on exam_participants
  for each row execute function sync_exam_registration_status();

-- Backfill: students already registered for an open exam.
update training_progress t
set theory_exam_status = 'scheduled', updated_at = now()
where t.theory_exam_status in ('not_scheduled', 'failed')
  and exists (
    select 1 from exam_participants p
    join exam_events e on e.id = p.exam_event_id
    where p.student_id = t.student_id
      and e.exam_type = 'theory' and p.result = 'pending'
  );

update training_progress t
set practical_exam_status = 'scheduled', updated_at = now()
where t.practical_exam_status in ('not_scheduled', 'failed')
  and exists (
    select 1 from exam_participants p
    join exam_events e on e.id = p.exam_event_id
    where p.student_id = t.student_id
      and e.exam_type = 'practical' and p.result = 'pending'
  );