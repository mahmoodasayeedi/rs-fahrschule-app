-- Security hardening: every SECURITY DEFINER function in schema public must
-- run with a fixed search_path, otherwise a user could shadow tables/functions
-- by creating objects in their own schema. This pins all that are missing it.
do $$
declare
  r record;
begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prosecdef
      and not exists (
        select 1 from unnest(coalesce(p.proconfig, '{}'::text[])) c
        where c like 'search_path=%'
      )
  loop
    execute format('alter function %s set search_path = public', r.sig);
    raise notice 'pinned search_path: %', r.sig;
  end loop;
end $$;
