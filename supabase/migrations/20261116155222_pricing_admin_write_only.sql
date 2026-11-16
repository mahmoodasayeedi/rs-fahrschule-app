drop policy if exists "admin office full access pricing" on services_pricing;

create policy "office read pricing"
  on services_pricing for select
  using (get_my_role() in ('admin', 'office'));

create policy "admin write pricing"
  on services_pricing for all
  using (get_my_role() = 'admin')
  with check (get_my_role() = 'admin');