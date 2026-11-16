drop policy if exists "admin office full access pricing" on public.services_pricing;
drop policy if exists "office read pricing" on public.services_pricing;
drop policy if exists "admin write pricing" on public.services_pricing;

create policy "office read pricing" on public.services_pricing
  for select to authenticated
  using (public.get_my_role() in ('admin','office'));

create policy "admin write pricing" on public.services_pricing
  for all to authenticated
  using (public.get_my_role() = 'admin')
  with check (public.get_my_role() = 'admin');
