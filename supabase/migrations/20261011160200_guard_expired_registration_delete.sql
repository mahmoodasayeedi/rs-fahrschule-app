create or replace function public.delete_expired_pending_registrations()
returns void
language plpgsql
security definer
set search_path = public
as $function$
declare
  expired record;
begin
  for expired in
    select s.profile_id
    from student_records s
    join profiles p on p.id = s.profile_id
    where s.registration_status = 'pending'
      and s.registration_deadline < now()
      and p.role::text = 'student'
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
$function$;