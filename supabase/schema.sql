-- ============================================================
--  VERSO LIVRE — Banco de dados inicial (MVP)
-- ============================================================
--
--  PASSO A PASSO (faça uma vez, no site do Supabase):
--
--  1) Acesse https://supabase.com e crie uma conta (pode usar GitHub/Google).
--
--  2) Clique em "New project".
--       - Name: verso-livre
--       - Database Password: crie uma senha forte e GUARDE (não é a senha de login do app).
--       - Region: South America (São Paulo) — mais perto = mais rápido.
--     Aguarde ~2 min enquanto o projeto provisiona.
--
--  3) Pegue as chaves do projeto:
--       - Menu lateral > Project Settings (engrenagem) > "Data API"
--           copie o "Project URL"  -> vai em VITE_SUPABASE_URL no arquivo .env
--       - Project Settings > "API Keys"
--           copie a chave "anon" "public" -> vai em VITE_SUPABASE_ANON_KEY no .env
--       (A chave "anon" é pública, pode ir pro front-end. NUNCA use a "service_role" no front.)
--
--  4) Crie a tabela: menu lateral > "SQL Editor" > "New query",
--     cole TODO o conteúdo abaixo e clique em "Run".
--
--  5) (Opcional, recomendado p/ testar rápido) Desligar confirmação de e-mail:
--       Authentication > Sign In / Providers > Email > desmarque "Confirm email".
--       Assim o cadastro já entra direto, sem precisar clicar em link no e-mail.
--
--  Pronto. O Supabase Auth cuida de e-mail+senha (criptografados). A tabela
--  "profiles" abaixo guarda só o PERFIL (aluno/professor/escola) de cada usuário.
--
--  REGRA DE NEGÓCIO:
--    - Apenas ESCOLAS se cadastram sozinhas (signup pelo app -> role 'escola').
--    - ALUNOS e PROFESSORES NÃO se cadastram: só fazem login. As contas deles
--      serão criadas por uma conta administrativa da escola (fluxo de admin,
--      a ser construído depois — criar usuários exige a chave service_role no
--      servidor/edge function, nunca no front-end).
-- ============================================================


-- 1. Tipos de perfil possíveis ------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('aluno', 'professor', 'escola');
  end if;
end$$;


-- 2. Tabela de perfis ---------------------------------------------------------
--    Cada linha está ligada a um usuário do Supabase Auth (auth.users).
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text not null,
  role       public.user_role not null default 'aluno',
  created_at timestamptz not null default now()
);


-- 3. Segurança em nível de linha (RLS) ----------------------------------------
--    Garante que cada pessoa só lê/edita o próprio perfil.
alter table public.profiles enable row level security;

drop policy if exists "profiles: ler o proprio" on public.profiles;
create policy "profiles: ler o proprio"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles: editar o proprio" on public.profiles;
create policy "profiles: editar o proprio"
  on public.profiles for update
  using (auth.uid() = id);


-- 4. Criar o perfil automaticamente quando alguém se cadastra -----------------
--    O "role" vem do cadastro (metadata). Se não vier, assume 'aluno'.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (
    new.id,
    new.email,
    coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'aluno')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
