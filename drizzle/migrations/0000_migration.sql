
create type public.app_role as enum ('admin','editor','reviewer','reader');

create table public.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
grant select on public.platform_admins to authenticated;
grant all on public.platform_admins to service_role;
alter table public.platform_admins enable row level security;
create policy "self read" on public.platform_admins for select to authenticated using (user_id = auth.uid());

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 120),
  locale text not null default 'es' check (locale in ('es','en')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.institutions (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 160),
  kind text not null default '' check (char_length(kind) <= 80),
  region text not null default '' check (char_length(region) <= 120),
  created_by uuid not null,
  created_at timestamptz not null default now()
);
grant select, update on public.institutions to authenticated;
grant all on public.institutions to service_role;
alter table public.institutions enable row level security;

create table public.memberships (
  institution_id uuid not null references public.institutions(id) on delete cascade,
  user_id uuid not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  primary key (institution_id, user_id)
);
grant select, insert, update, delete on public.memberships to authenticated;
grant all on public.memberships to service_role;
alter table public.memberships enable row level security;

-- Role helpers (security definer avoids recursive RLS)
create or replace function public.is_platform_admin(_uid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.platform_admins where user_id = _uid) $$;

create or replace function public.inst_role(_inst uuid, _uid uuid) returns public.app_role
language sql stable security definer set search_path = public as $$
  select role from public.memberships where institution_id = _inst and user_id = _uid $$;

create or replace function public.is_member(_inst uuid, _uid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.inst_role(_inst,_uid) is not null or public.is_platform_admin(_uid) $$;

create or replace function public.has_inst_role(_inst uuid, _uid uuid, _roles public.app_role[]) returns boolean
language sql stable security definer set search_path = public as $$
  select public.inst_role(_inst,_uid) = any(_roles) or public.is_platform_admin(_uid) $$;

create or replace function public.shares_institution(_a uuid, _b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.memberships m1 join public.memberships m2 using (institution_id)
                where m1.user_id = _a and m2.user_id = _b) $$;

create policy "profile read" on public.profiles for select to authenticated
  using (user_id = auth.uid() or public.shares_institution(auth.uid(), user_id) or public.is_platform_admin(auth.uid()));
create policy "profile insert own" on public.profiles for insert to authenticated with check (user_id = auth.uid());
create policy "profile update own" on public.profiles for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "inst read" on public.institutions for select to authenticated using (public.is_member(id, auth.uid()));
create policy "inst update admin" on public.institutions for update to authenticated
  using (public.has_inst_role(id, auth.uid(), array['admin']::public.app_role[]))
  with check (public.has_inst_role(id, auth.uid(), array['admin']::public.app_role[]));

create policy "members read" on public.memberships for select to authenticated using (public.is_member(institution_id, auth.uid()));
create policy "members insert admin" on public.memberships for insert to authenticated
  with check (public.has_inst_role(institution_id, auth.uid(), array['admin']::public.app_role[]));
create policy "members update admin" on public.memberships for update to authenticated
  using (public.has_inst_role(institution_id, auth.uid(), array['admin']::public.app_role[]) and user_id <> auth.uid())
  with check (public.has_inst_role(institution_id, auth.uid(), array['admin']::public.app_role[]));
create policy "members delete admin" on public.memberships for delete to authenticated
  using (public.has_inst_role(institution_id, auth.uid(), array['admin']::public.app_role[]) and user_id <> auth.uid());

-- Campaigns
create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  local_id text,
  status text not null default 'borrador' check (status in ('borrador','revision','aprobado','observado','denegado')),
  title_es text not null default '' check (char_length(title_es) <= 300),
  title_en text not null default '' check (char_length(title_en) <= 300),
  content_es jsonb not null default '{}'::jsonb,
  content_en jsonb not null default '{}'::jsonb,
  data jsonb not null default '{}'::jsonb,
  sources text not null default '' check (char_length(sources) <= 4000),
  created_by uuid not null default auth.uid(),
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (institution_id, local_id),
  check (pg_column_size(data) < 200000)
);
grant select, insert, update, delete on public.campaigns to authenticated;
grant all on public.campaigns to service_role;
alter table public.campaigns enable row level security;
create policy "camp read" on public.campaigns for select to authenticated using (public.is_member(institution_id, auth.uid()));
create policy "camp insert" on public.campaigns for insert to authenticated
  with check (public.has_inst_role(institution_id, auth.uid(), array['admin','editor']::public.app_role[]) and created_by = auth.uid());
create policy "camp update" on public.campaigns for update to authenticated
  using (public.has_inst_role(institution_id, auth.uid(), array['admin','editor']::public.app_role[]))
  with check (public.has_inst_role(institution_id, auth.uid(), array['admin','editor']::public.app_role[]));
create policy "camp delete" on public.campaigns for delete to authenticated
  using (public.has_inst_role(institution_id, auth.uid(), array['admin']::public.app_role[]));

-- Editors cannot set approval states directly; only review decisions do.
create or replace function public.guard_campaign_write() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if current_setting('app.review_write', true) = 'on' then
    new.updated_at := now(); return new;
  end if;
  if tg_op = 'INSERT' then
    if new.status not in ('borrador','revision') then new.status := 'borrador'; end if;
  else
    if new.institution_id <> old.institution_id or new.created_by <> old.created_by then
      raise exception 'Campo no modificable';
    end if;
    if new.status <> old.status and new.status not in ('borrador','revision') then
      raise exception 'El estado de aprobación solo cambia mediante una decisión de revisión';
    end if;
    -- Any content edit on an approved campaign returns it to draft
    if old.status = 'aprobado' and new.status = old.status and
       (new.content_es <> old.content_es or new.content_en <> old.content_en or new.data <> old.data) then
      new.status := 'borrador';
    end if;
  end if;
  new.updated_by := auth.uid();
  new.updated_at := now();
  return new;
end $$;
create trigger campaigns_guard before insert or update on public.campaigns
  for each row execute function public.guard_campaign_write();

create table public.campaign_versions (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  institution_id uuid not null,
  snapshot jsonb not null,
  author uuid,
  created_at timestamptz not null default now()
);
grant select on public.campaign_versions to authenticated;
grant all on public.campaign_versions to service_role;
alter table public.campaign_versions enable row level security;
create policy "ver read" on public.campaign_versions for select to authenticated using (public.is_member(institution_id, auth.uid()));

create or replace function public.snapshot_campaign() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.campaign_versions(campaign_id, institution_id, snapshot, author)
  values (new.id, new.institution_id, jsonb_build_object('status',new.status,'title_es',new.title_es,'title_en',new.title_en,
    'content_es',new.content_es,'content_en',new.content_en,'data',new.data,'sources',new.sources), auth.uid());
  return new;
end $$;
create trigger campaigns_version after insert or update on public.campaigns
  for each row execute function public.snapshot_campaign();

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  institution_id uuid not null,
  decision text not null check (decision in ('aprobar','cambios','denegar')),
  lang text not null check (lang in ('es','en')),
  reviewer uuid not null,
  comment text not null default '' check (char_length(comment) <= 2000),
  created_at timestamptz not null default now()
);
grant select on public.reviews to authenticated;
grant all on public.reviews to service_role;
alter table public.reviews enable row level security;
create policy "rev read" on public.reviews for select to authenticated using (public.is_member(institution_id, auth.uid()));

create table public.assets (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  kind text not null check (kind in ('imagen','gif','video')),
  mime text not null check (mime in ('image/png','image/jpeg','image/webp','image/gif','video/mp4','video/webm')),
  size_bytes integer not null check (size_bytes > 0 and size_bytes <= 26214400),
  storage_path text not null unique,
  title text not null default '' check (char_length(title) <= 200),
  license text not null default '' check (char_length(license) <= 200),
  author text not null default '' check (char_length(author) <= 200),
  source_url text not null default '' check (char_length(source_url) <= 1000),
  attribution text not null default '' check (char_length(attribution) <= 1000),
  tags text[] not null default '{}',
  verified_at date,
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.assets to authenticated;
grant all on public.assets to service_role;
alter table public.assets enable row level security;
create policy "asset read" on public.assets for select to authenticated using (public.is_member(institution_id, auth.uid()));
create policy "asset write" on public.assets for insert to authenticated
  with check (public.has_inst_role(institution_id, auth.uid(), array['admin','editor']::public.app_role[]) and created_by = auth.uid());
create policy "asset update" on public.assets for update to authenticated
  using (public.has_inst_role(institution_id, auth.uid(), array['admin','editor']::public.app_role[]))
  with check (public.has_inst_role(institution_id, auth.uid(), array['admin','editor']::public.app_role[]));
create policy "asset delete" on public.assets for delete to authenticated
  using (public.has_inst_role(institution_id, auth.uid(), array['admin']::public.app_role[]));

create table public.templates (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 160),
  layout jsonb not null default '{}'::jsonb check (pg_column_size(layout) < 100000),
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.templates to authenticated;
grant all on public.templates to service_role;
alter table public.templates enable row level security;
create policy "tpl read" on public.templates for select to authenticated using (public.is_member(institution_id, auth.uid()));
create policy "tpl write" on public.templates for all to authenticated
  using (public.has_inst_role(institution_id, auth.uid(), array['admin','editor']::public.app_role[]))
  with check (public.has_inst_role(institution_id, auth.uid(), array['admin','editor']::public.app_role[]));

-- Insert-only audit log, written only by triggers/definer functions
create table public.audit_log (
  id bigint generated always as identity primary key,
  institution_id uuid,
  actor uuid,
  action text not null,
  target text not null,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
grant select on public.audit_log to authenticated;
grant all on public.audit_log to service_role;
alter table public.audit_log enable row level security;
create policy "audit read" on public.audit_log for select to authenticated
  using (public.has_inst_role(institution_id, auth.uid(), array['admin','reviewer']::public.app_role[]));
create or replace function public.block_audit_mutation() returns trigger language plpgsql as $$
begin raise exception 'audit_log es solo de inserción'; end $$;
create trigger audit_no_update before update or delete on public.audit_log
  for each row execute function public.block_audit_mutation();

create or replace function public.audit_row() returns trigger
language plpgsql security definer set search_path = public as $$
declare r record;
begin
  r := coalesce(new, old);
  insert into public.audit_log(institution_id, actor, action, target, detail)
  values (case when tg_table_name = 'institutions' then r.id else r.institution_id end,
          auth.uid(), lower(tg_op), tg_table_name || ':' || coalesce(
            case when tg_table_name = 'memberships' then r.user_id::text else r.id::text end, ''),
          case when tg_table_name = 'memberships' then jsonb_build_object('role', r.role) 
               when tg_table_name = 'campaigns' then jsonb_build_object('status', r.status) else '{}'::jsonb end);
  return null;
end $$;
create trigger audit_campaigns after insert or update or delete on public.campaigns for each row execute function public.audit_row();
create trigger audit_memberships after insert or update or delete on public.memberships for each row execute function public.audit_row();
create trigger audit_assets after insert or update or delete on public.assets for each row execute function public.audit_row();
create trigger audit_reviews after insert on public.reviews for each row execute function public.audit_row();

-- Server-side review decision: reviewers/admins only, never on own campaign.
create or replace function public.decide_review(_campaign uuid, _decision text, _lang text, _comment text) returns text
language plpgsql security definer set search_path = public as $$
declare c public.campaigns; st text;
begin
  select * into c from public.campaigns where id = _campaign for update;
  if not found then raise exception 'Campaña no encontrada'; end if;
  if not public.has_inst_role(c.institution_id, auth.uid(), array['admin','reviewer']::public.app_role[]) then
    raise exception 'Sin permiso para revisar';
  end if;
  if c.created_by = auth.uid() or c.updated_by = auth.uid() then
    raise exception 'No podés revisar una campaña creada o editada por vos';
  end if;
  if c.status <> 'revision' then raise exception 'La campaña debe estar en revisión'; end if;
  if _decision not in ('aprobar','cambios','denegar') or _lang not in ('es','en') then raise exception 'Decisión inválida'; end if;
  if _decision <> 'aprobar' and char_length(trim(coalesce(_comment,''))) = 0 then raise exception 'Indicá un motivo'; end if;
  if _decision = 'aprobar' and char_length(trim(case when _lang = 'en' then c.title_en else c.title_es end)) = 0 then
    raise exception 'Falta el título en el idioma aprobado';
  end if;
  st := case _decision when 'aprobar' then 'aprobado' when 'cambios' then 'observado' else 'denegado' end;
  insert into public.reviews(campaign_id, institution_id, decision, lang, reviewer, comment)
  values (c.id, c.institution_id, _decision, _lang, auth.uid(), left(trim(coalesce(_comment,'')), 2000));
  perform set_config('app.review_write', 'on', true);
  update public.campaigns set status = st where id = c.id;
  perform set_config('app.review_write', 'off', true);
  return st;
end $$;
revoke all on function public.decide_review(uuid,text,text,text) from public, anon;
grant execute on function public.decide_review(uuid,text,text,text) to authenticated;

-- Create an institution; caller becomes its admin.
create or replace function public.create_institution(_name text, _kind text, _region text) returns uuid
language plpgsql security definer set search_path = public as $$
declare iid uuid;
begin
  if auth.uid() is null then raise exception 'Sesión requerida'; end if;
  if (select count(*) from public.institutions where created_by = auth.uid()) >= 5 then
    raise exception 'Límite de instituciones por cuenta alcanzado';
  end if;
  insert into public.institutions(name, kind, region, created_by) values (trim(_name), coalesce(_kind,''), coalesce(_region,''), auth.uid()) returning id into iid;
  insert into public.memberships(institution_id, user_id, role) values (iid, auth.uid(), 'admin');
  return iid;
end $$;
revoke all on function public.create_institution(text,text,text) from public, anon;
grant execute on function public.create_institution(text,text,text) to authenticated;

-- Admin adds an existing account by email (no email enumeration for non-admins).
create or replace function public.add_member_by_email(_inst uuid, _email text, _role public.app_role) returns void
language plpgsql security definer set search_path = public, auth as $$
declare uid uuid;
begin
  if not public.has_inst_role(_inst, auth.uid(), array['admin']::public.app_role[]) then raise exception 'Sin permiso'; end if;
  select id into uid from auth.users where lower(email) = lower(trim(_email));
  if uid is null then raise exception 'No existe una cuenta con ese correo; debe registrarse primero'; end if;
  insert into public.memberships(institution_id, user_id, role) values (_inst, uid, _role)
  on conflict (institution_id, user_id) do update set role = excluded.role;
end $$;
revoke all on function public.add_member_by_email(uuid,text,public.app_role) from public, anon;
grant execute on function public.add_member_by_email(uuid,text,public.app_role) to authenticated;

revoke execute on function public.is_platform_admin(uuid), public.inst_role(uuid,uuid), public.is_member(uuid,uuid),
  public.has_inst_role(uuid,uuid,public.app_role[]), public.shares_institution(uuid,uuid) from anon, public;
grant execute on function public.is_platform_admin(uuid), public.inst_role(uuid,uuid), public.is_member(uuid,uuid),
  public.has_inst_role(uuid,uuid,public.app_role[]), public.shares_institution(uuid,uuid) to authenticated;

-- Profile on signup
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(user_id, display_name) values (new.id, left(coalesce(new.raw_user_meta_data->>'display_name',''),120))
  on conflict do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Private storage bucket policies are added once the bucket exists.
