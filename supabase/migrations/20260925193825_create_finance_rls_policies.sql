-- Every FINANCE table follows the same rule: Office/Admin full access,
-- no policy for anyone else — which combined with RLS being enabled
-- means students (and instructors) see and touch nothing here.

create policy "admin office full access pricing"
  on services_pricing for all
  using (get_my_role() in ('admin', 'office'));

create policy "admin office full access payments"
  on payments for all
  using (get_my_role() in ('admin', 'office'));

create policy "admin office full access invoices"
  on invoices for all
  using (get_my_role() in ('admin', 'office'));

create policy "admin office full access invoice items"
  on invoice_items for all
  using (get_my_role() in ('admin', 'office'));

create policy "admin office full access invoice counters"
  on invoice_number_counters for all
  using (get_my_role() in ('admin', 'office'));