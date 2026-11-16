-- Gapless yearly invoice numbers (2026-0001, ...)
create table if not exists public.invoice_counters (
  year int primary key,
  last_number int not null default 0
);
alter table public.invoice_counters enable row level security;
revoke all on public.invoice_counters from anon, authenticated;

create unique index if not exists invoices_invoice_number_key
  on public.invoices(invoice_number);

-- Invoices become read-only for staff; creation only via create_invoice()
drop policy if exists "admin office full access invoices" on public.invoices;
drop policy if exists "admin office full access invoice items" on public.invoice_items;

revoke insert, update, delete on public.invoices, public.invoice_items from authenticated;
revoke all on public.invoices, public.invoice_items from anon;

create policy "staff read invoices" on public.invoices
  for select to authenticated
  using (public.get_my_role() in ('admin','office'));

create policy "staff read invoice items" on public.invoice_items
  for select to authenticated
  using (public.get_my_role() in ('admin','office'));

-- p_items example: [{"service_id":"<uuid>","quantity":2}]
create or replace function public.create_invoice(p_student_id uuid, p_items jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_year int := extract(year from (now() at time zone 'Europe/Berlin'))::int;
  v_num int;
  v_invoice_id uuid;
  v_item jsonb;
  v_service public.services_pricing%rowtype;
  v_qty int;
begin
  if public.get_my_role() not in ('admin','office') then
    raise exception 'Keine Berechtigung';
  end if;

  if not exists (select 1 from public.profiles where id = p_student_id and role = 'student') then
    raise exception 'Fahrschüler nicht gefunden';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Keine Positionen angegeben';
  end if;

  -- row lock on the counter keeps numbers gapless (rolls back with the invoice)
  insert into public.invoice_counters(year, last_number) values (v_year, 1)
  on conflict (year) do update set last_number = invoice_counters.last_number + 1
  returning last_number into v_num;

  insert into public.invoices(student_id, invoice_number, total_amount, status, created_by)
  values (p_student_id, v_year || '-' || lpad(v_num::text, 4, '0'), 0, 'issued', auth.uid())
  returning id into v_invoice_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item->>'quantity')::int;
    if v_qty is null or v_qty <= 0 then
      raise exception 'Ungültige Menge';
    end if;

    select * into v_service from public.services_pricing
    where id = (v_item->>'service_id')::uuid and is_active;
    if not found then
      raise exception 'Leistung nicht gefunden oder inaktiv';
    end if;

    -- label and price are COPIED so later price changes never alter old invoices
    insert into public.invoice_items(invoice_id, service_id, description, quantity, unit_price, line_total)
    values (v_invoice_id, v_service.id, v_service.label, v_qty, v_service.default_price,
            round(v_qty * v_service.default_price, 2));
  end loop;

  update public.invoices
  set total_amount = (select coalesce(sum(line_total), 0) from public.invoice_items where invoice_id = v_invoice_id)
  where id = v_invoice_id;

  return v_invoice_id;
end;
$$;

revoke all on function public.create_invoice(uuid, jsonb) from public, anon;
grant execute on function public.create_invoice(uuid, jsonb) to authenticated;