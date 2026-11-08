-- Para proyectos que ejecutaron la versión inicial de schema.sql.
-- Migración transaccional. No contiene datos de pacientes.
begin;
alter table public.nutritionist_links add column if not exists share_body boolean not null default false;
drop function if exists public.create_link();
create or replace function public.create_link(share_composition boolean default false) returns text language plpgsql security definer set search_path=public as $$ declare code text; begin
 if auth.uid() is null then raise exception 'Inicia sesión'; end if;
 code:=encode(gen_random_bytes(16),'hex');
 insert into nutritionist_links(patient_id,code_hash,share_body) values(auth.uid(),encode(digest(code,'sha256'),'hex'),share_composition); return code; end $$;
create or replace function public.patient_summary(patient uuid) returns jsonb language plpgsql security definer set search_path=public as $$ declare d jsonb; body_shared boolean; begin
 if not exists(select 1 from nutritionist_links where patient_id=patient and professional_id=auth.uid()) then raise exception 'Sin autorización'; end if;
 select coalesce(bool_or(share_body),false) into body_shared from nutritionist_links where patient_id=patient and professional_id=auth.uid();
 select data into d from app_states where user_id=patient;
 return jsonb_build_object('profile',jsonb_build_object('name',d->'profile'->'name'),'checks',d->'checks','measurements',d->'measurements','labs',d->'labs','bodyShared',body_shared,'bodyScans',case when body_shared then coalesce(d->'bodyScans','[]'::jsonb) else '[]'::jsonb end); end $$;
revoke all on function public.create_link(boolean), public.patient_summary(uuid) from public, anon;
grant execute on function public.create_link(boolean), public.patient_summary(uuid) to authenticated;
commit;
