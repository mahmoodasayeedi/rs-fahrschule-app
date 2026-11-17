-- Cancel (storno) an invoice. Invoices are never edited or deleted: the
-- number stays used so numbering remains gapless. The status change is
-- written to audit_log by the existing invoice audit trigger.
create or replace function public.cancel_invoice(p_invoice_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status public.invoice_status;
begin
  if public.get_my_role() not in ('admin', 'office') then
    raise exception 'Keine Berechtigung';
  end if;

  select status into v_status from public.invoices where id = p_invoice_id for update;
  if not found then
    raise exception 'Rechnung nicht gefunden';
  end if;

  if v_status = 'cancelled' then
    raise exception 'Diese Rechnung ist bereits storniert.';
  end if;

  if v_status not in ('draft', 'issued') then
    raise exception 'Diese Rechnung ist bereits ganz oder teilweise bezahlt und kann nicht storniert werden.';
  end if;

  update public.invoices set status = 'cancelled' where id = p_invoice_id;
end;
$$;

revoke all on function public.cancel_invoice(uuid) from public, anon;
grant execute on function public.cancel_invoice(uuid) to authenticated;
