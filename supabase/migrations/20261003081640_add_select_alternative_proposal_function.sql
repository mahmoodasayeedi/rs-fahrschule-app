-- Lets a student accept one of their proposed alternative times. This is
-- the ONLY way an appointment moves from alternative_proposed to confirmed
-- by student action — no direct UPDATE policy exists for this on purpose,
-- same pattern as cancel_appointment().
create function select_alternative_proposal(proposal_id uuid)
returns void as $$
declare
  prop alternative_proposals%rowtype;
  appt appointments%rowtype;
begin
  select * into prop from alternative_proposals where id = proposal_id;

  if prop.id is null then
    raise exception 'Vorschlag nicht gefunden.';
  end if;

  select * into appt from appointments where id = prop.original_appointment_id;

  if appt.student_id != auth.uid() then
    raise exception 'Sie können nur auf eigene Terminvorschläge reagieren.';
  end if;

  if appt.status != 'alternative_proposed' then
    raise exception 'Für diesen Termin liegt aktuell kein offener Vorschlag vor.';
  end if;

  update alternative_proposals set selected = true where id = proposal_id;
  update alternative_proposals
    set selected = false
    where original_appointment_id = appt.id and id != proposal_id;

  update appointments
  set requested_date = prop.proposed_date,
      requested_time = prop.proposed_time,
      instructor_id = coalesce(prop.proposed_instructor_id, appt.instructor_id),
      status = 'confirmed'
  where id = appt.id;
end;
$$ language plpgsql security definer set search_path = public;