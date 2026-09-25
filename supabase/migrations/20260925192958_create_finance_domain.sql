-- FINANCE domain
-- Service/pricing catalog, payments, invoices, invoice line items,
-- and a guarded balance view. Fully internal — students have zero access.

create type service_code as enum (
  'base_fee', 'normal_lesson', 'special_lesson', 'uberland_lesson',
  'autobahn_lesson', 'night_lesson', 'theory_exam_fee', 'practical_exam_fee', 'other'
);

create type payment_method as enum ('cash', 'bank_transfer', 'card', 'other');

create type invoice_status as enum ('draft', 'issued', 'paid', 'partially_paid', 'cancelled');

create table services_pricing (
  id uuid primary key default gen_random_uuid(),
  service_code service_code not null,
  label text not null,
  default_price numeric(10,2) not null,
  is_active boolean not null default true,
  updated_at timestamptz not null default now()
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles(id),
  amount numeric(10,2) not null,
  payment_date date not null default current_date,
  payment_method payment_method not null,
  internal_remarks text,
  recorded_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

create table invoices (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles(id),
  invoice_number text unique,
  issue_date date not null default current_date,
  total_amount numeric(10,2) not null default 0,
  status invoice_status not null default 'draft',
  pdf_url text,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

create table invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  service_id uuid not null references services_pricing(id),
  description text not null,
  quantity integer not null default 1,
  unit_price numeric(10,2) not null,
  line_total numeric(10,2) not null default 0
);

-- === Invoice numbering: sequential, gapless, server-generated ===

create table invoice_number_counters (
  year integer primary key,
  last_number integer not null default 0
);

create function generate_invoice_number()
returns text as $$
declare
  this_year integer := extract(year from now());
  next_number integer;
begin
  insert into invoice_number_counters (year, last_number)
  values (this_year, 1)
  on conflict (year) do update set last_number = invoice_number_counters.last_number + 1
  returning last_number into next_number;

  return this_year || '-' || lpad(next_number::text, 4, '0');
end;
$$ language plpgsql security definer;

create function set_invoice_number()
returns trigger as $$
begin
  if new.invoice_number is null then
    new.invoice_number := generate_invoice_number();
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger before_invoice_insert_set_number
  before insert on invoices
  for each row execute function set_invoice_number();

-- === Keep invoice_items.line_total and invoices.total_amount in sync ===

create function compute_line_total()
returns trigger as $$
begin
  new.line_total := new.quantity * new.unit_price;
  return new;
end;
$$ language plpgsql;

create trigger before_invoice_item_compute_total
  before insert or update on invoice_items
  for each row execute function compute_line_total();

create function sync_invoice_total()
returns trigger as $$
declare
  affected_invoice uuid;
begin
  affected_invoice := coalesce(new.invoice_id, old.invoice_id);
  update invoices
  set total_amount = (select coalesce(sum(line_total), 0) from invoice_items where invoice_id = affected_invoice)
  where id = affected_invoice;
  return null;
end;
$$ language plpgsql security definer;

create trigger after_invoice_item_change_sync_total
  after insert or update or delete on invoice_items
  for each row execute function sync_invoice_total();

-- Reuse the updated_at trigger function already defined in SCHEDULING.
create trigger services_pricing_set_updated_at
  before update on services_pricing
  for each row execute function set_updated_at();

-- === Guarded balance view ===
-- Explicit role check baked into the view itself, not just relying on
-- underlying table RLS — this is the one area the client is most explicit
-- about students never accessing under any circumstance.

create view student_balances as
select
  p.id as student_id,
  p.first_name,
  p.last_name,
  coalesce(inv.total_invoiced, 0) as total_invoiced,
  coalesce(pay.total_paid, 0) as total_paid,
  coalesce(inv.total_invoiced, 0) - coalesce(pay.total_paid, 0) as balance
from profiles p
left join (
  select student_id, sum(total_amount) as total_invoiced
  from invoices
  where status != 'cancelled'
  group by student_id
) inv on inv.student_id = p.id
left join (
  select student_id, sum(amount) as total_paid
  from payments
  group by student_id
) pay on pay.student_id = p.id
where p.role = 'student'
  and get_my_role() in ('admin', 'office');

alter table services_pricing enable row level security;
alter table payments enable row level security;
alter table invoices enable row level security;
alter table invoice_items enable row level security;
alter table invoice_number_counters enable row level security;