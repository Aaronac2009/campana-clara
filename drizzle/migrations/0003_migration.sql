
create or replace function public.has_inst_role(_inst uuid, _uid uuid, _roles public.app_role[]) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.inst_role(_inst,_uid) = any(_roles), false) or public.is_platform_admin(_uid) $$;
