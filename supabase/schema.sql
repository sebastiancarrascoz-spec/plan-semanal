-- Ejecutar en un proyecto Supabase propio. Ninguna clave service_role en el navegador.
create extension if not exists pgcrypto;
create table public.users (id uuid primary key references auth.users on delete cascade, consent_at timestamptz not null default now(), consent_version text not null default '1', created_at timestamptz default now());
create table public.plans (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users on delete cascade, version int not null, diet text not null, objective text not null, unique(user_id,version));
create table public.plan_groups (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users on delete cascade, plan_id uuid references plans on delete cascade, name text not null, daily numeric not null check(daily>=0), distribution jsonb not null);
create table public.plan_foods (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users on delete cascade, plan_id uuid references plans on delete cascade, group_name text not null, name text not null, quantity numeric not null, unit text not null, diets jsonb not null);
create table public.weekly_menus (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users on delete cascade, plan_id uuid references plans, week date not null, unique(user_id,week));
create table public.menu_meals (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users on delete cascade, menu_id uuid references weekly_menus on delete cascade, day date not null, slot int not null, food_snapshot jsonb not null);
-- El MVP sincroniza un documento de estado por cuenta. Las tablas normalizadas
-- permiten una migración posterior; no son un segundo origen de verdad activo.
create table public.app_states (user_id uuid primary key references auth.users on delete cascade, data jsonb not null, updated_at timestamptz default now());
do $$ declare t text; begin
 foreach t in array array['shopping_items','meal_logs','walk_logs','workout_templates','workout_sessions','workout_sets','measurements','lab_results','reminders'] loop
 execute format('create table public.%I (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users on delete cascade, recorded_at timestamptz default now(), data jsonb not null)',t);
 end loop;
 foreach t in array array['users','plans','plan_groups','plan_foods','weekly_menus','menu_meals','app_states','shopping_items','meal_logs','walk_logs','workout_templates','workout_sessions','workout_sets','measurements','lab_results','reminders'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('create policy owner_access on public.%I for all to authenticated using (auth.uid() = %I) with check (auth.uid() = %I)',t,case when t='users' then 'id' else 'user_id' end,case when t='users' then 'id' else 'user_id' end);
 end loop; end $$;
create table public.nutritionist_links (id uuid primary key default gen_random_uuid(), patient_id uuid not null references auth.users on delete cascade, professional_id uuid references auth.users on delete cascade, code_hash text not null, share_body boolean not null default false, expires_at timestamptz not null default now()+interval '24 hours', created_at timestamptz default now());
alter table public.nutritionist_links enable row level security;
create policy owner_link on public.nutritionist_links for select to authenticated using (auth.uid()=patient_id or auth.uid()=professional_id);
create policy revoke_link on public.nutritionist_links for delete to authenticated using (auth.uid()=patient_id);
create function public.create_link(share_composition boolean default false) returns text language plpgsql security definer set search_path=public as $$ declare code text; begin
 if auth.uid() is null then raise exception 'Inicia sesión'; end if;
 code:=encode(gen_random_bytes(16),'hex');
 insert into nutritionist_links(patient_id,code_hash,share_body) values(auth.uid(),encode(digest(code,'sha256'),'hex'),share_composition); return code; end $$;
create function public.claim_link(code text) returns void language plpgsql security definer set search_path=public as $$ begin
 if auth.uid() is null then raise exception 'Inicia sesión'; end if;
 update nutritionist_links set professional_id=auth.uid() where code_hash=encode(digest(code,'sha256'),'hex') and expires_at>now() and professional_id is null and patient_id<>auth.uid();
 if not found then raise exception 'Código inválido o vencido'; end if; end $$;
create function public.patient_summary(patient uuid) returns jsonb language plpgsql security definer set search_path=public as $$ declare d jsonb; body_shared boolean; begin
 if not exists(select 1 from nutritionist_links where patient_id=patient and professional_id=auth.uid()) then raise exception 'Sin autorización'; end if;
 select coalesce(bool_or(share_body),false) into body_shared from nutritionist_links where patient_id=patient and professional_id=auth.uid();
 select data into d from app_states where user_id=patient;
 return jsonb_build_object('profile',jsonb_build_object('name',d->'profile'->'name'),'checks',d->'checks','measurements',d->'measurements','labs',d->'labs','bodyShared',body_shared,'bodyScans',case when body_shared then coalesce(d->'bodyScans','[]'::jsonb) else '[]'::jsonb end); end $$;
create function public.delete_my_account() returns void language plpgsql security definer set search_path=public as $$ begin delete from auth.users where id=auth.uid(); end $$;
revoke all on function public.create_link(boolean), public.claim_link(text), public.patient_summary(uuid), public.delete_my_account() from public, anon;
grant execute on function public.create_link(boolean), public.claim_link(text), public.patient_summary(uuid), public.delete_my_account() to authenticated;
