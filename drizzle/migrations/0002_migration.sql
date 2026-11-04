
create or replace function public.audit_row() returns trigger
language plpgsql security definer set search_path = public as $$
declare j jsonb;
begin
  j := to_jsonb(coalesce(new, old));
  insert into public.audit_log(institution_id, actor, action, target, detail)
  values (case when tg_table_name = 'institutions' then (j->>'id')::uuid else (j->>'institution_id')::uuid end,
          auth.uid(), lower(tg_op),
          tg_table_name || ':' || coalesce(case when tg_table_name = 'memberships' then j->>'user_id' else j->>'id' end, ''),
          jsonb_strip_nulls(jsonb_build_object('role', j->>'role', 'status', j->>'status', 'decision', j->>'decision')));
  return null;
end $$;
