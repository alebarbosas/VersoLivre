-- ============================================================
--  VERSO LIVRE — Painel do Professor (MVP)
-- ============================================================
--
--  COMO RODAR: SQL Editor > New query > cole tudo > Run.
--  (Pode rodar várias vezes — é idempotente.)
--
--  O que este script faz:
--   - adiciona "name" e "school_id" em profiles
--   - cria as tabelas "stories" (histórias) e "feedbacks"
--   - configura RLS: o professor só vê/edita histórias da SUA escola
--   - confirma o e-mail da conta demo do professor (pra conseguir logar)
--   - semeia histórias de teste ligadas à escola do professor demo
--
--  Obs.: NÃO mexe no lado do aluno. As histórias usam "author_name" (texto)
--        por enquanto; depois ligamos a contas reais de alunos (author_id).
-- ============================================================


-- 1. Colunas novas em profiles ------------------------------------------------
alter table public.profiles add column if not exists name      text;
alter table public.profiles add column if not exists school_id uuid;


-- 2. Status possíveis de uma história -----------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'story_status') then
    create type public.story_status as enum
      ('rascunho', 'enviado', 'em_revisao', 'aprovado', 'publicado');
  end if;
end$$;


-- 3. Tabela de histórias ------------------------------------------------------
create table if not exists public.stories (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null,
  author_id   uuid references auth.users (id) on delete set null, -- futuro: aluno real
  author_name text not null,
  title       text not null,
  category    text not null,
  content     text not null default '',
  status      public.story_status not null default 'enviado',
  created_at  timestamptz not null default now()
);


-- 4. Tabela de feedbacks do professor -----------------------------------------
create table if not exists public.feedbacks (
  id           uuid primary key default gen_random_uuid(),
  story_id     uuid not null references public.stories (id) on delete cascade,
  professor_id uuid not null references auth.users (id) on delete cascade,
  comment      text not null,
  action       text not null default 'comentario', -- comentario | ajustes | aprovacao
  created_at   timestamptz not null default now()
);


-- 5. Segurança (RLS) — professor só acessa a SUA escola -----------------------
alter table public.stories   enable row level security;
alter table public.feedbacks enable row level security;

-- helper: o usuário logado é professor da mesma escola da história?
-- (escrito inline nas policies abaixo)

drop policy if exists "stories: professor lê da sua escola" on public.stories;
create policy "stories: professor lê da sua escola"
  on public.stories for select
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'professor' and p.school_id = stories.school_id
  ));

drop policy if exists "stories: professor edita da sua escola" on public.stories;
create policy "stories: professor edita da sua escola"
  on public.stories for update
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'professor' and p.school_id = stories.school_id
  ));

drop policy if exists "feedbacks: professor lê" on public.feedbacks;
create policy "feedbacks: professor lê"
  on public.feedbacks for select
  using (exists (
    select 1 from public.profiles p
    join public.stories s on s.id = feedbacks.story_id
    where p.id = auth.uid() and p.role = 'professor' and p.school_id = s.school_id
  ));

drop policy if exists "feedbacks: professor cria" on public.feedbacks;
create policy "feedbacks: professor cria"
  on public.feedbacks for insert
  with check (
    feedbacks.professor_id = auth.uid()
    and exists (
      select 1 from public.profiles p
      join public.stories s on s.id = feedbacks.story_id
      where p.id = auth.uid() and p.role = 'professor' and p.school_id = s.school_id
    )
  );


-- 6. Conta demo do professor: confirmar e-mail + dar nome e escola ------------
--    (confirmar aqui evita depender da config "Confirm email")
do $$
declare
  prof_id uuid;
  sch_id  uuid;
begin
  select id into prof_id from public.profiles where email = 'professor@versolivre.com.br';

  if prof_id is null then
    raise notice 'Conta professor@versolivre.com.br nao encontrada — rode o seed de contas primeiro.';
    return;
  end if;

  -- confirma o e-mail da conta demo (libera o login)
  update auth.users
     set email_confirmed_at = coalesce(email_confirmed_at, now())
   where id = prof_id;

  -- escola do professor (reaproveita se já existir)
  select school_id into sch_id from public.profiles where id = prof_id;
  if sch_id is null then
    sch_id := gen_random_uuid();
  end if;

  update public.profiles
     set name = coalesce(name, 'Marina'),
         school_id = sch_id
   where id = prof_id;

  -- 7. Semeia histórias de teste (apenas uma vez) ----------------------------
  if not exists (select 1 from public.stories where school_id = sch_id) then
    insert into public.stories (school_id, author_name, title, category, status, content) values
      (sch_id, 'Maria Giovana', 'O céu também muda', 'Conto', 'publicado',
        'Era uma vez uma menina chamada Lua que acordava todo dia olhando para o espelho esperando ver alguém diferente. Não porque ela fosse triste — ela só ainda não sabia exatamente quem era a pessoa que vivia naquele corpo. Um dia, ela decidiu mudar o nome. Só isso. Mas mudar o nome mudou tudo.'),
      (sch_id, 'Ícaro Lima', 'A biblioteca proibida', 'Romance', 'em_revisao',
        'A biblioteca da escola fechava às 17h, mas Marcos sempre encontrava uma desculpa para ficar até mais tarde. Não era pelos livros — era por Gabriel, o bibliotecário estagiário que ria de forma silenciosa, como se o riso fosse um segredo entre ele e o mundo.'),
      (sch_id, 'Luna Paz', 'Floresta de espelhos', 'Fantasia', 'enviado',
        'Naquela floresta, cada árvore era um espelho. Não refletia o rosto, mas a alma. Sofia entrou com medo. Saiu entendendo que ela podia ser muitas coisas ao mesmo tempo.'),
      (sch_id, 'M. dos Santos', 'Poema sem título', 'Poema', 'aprovado',
        'Há versos que não cabem em título nenhum. Este é um deles: nasceu solto, e solto quer ficar.'),
      (sch_id, 'Vento do Norte', '13 de junho', 'Crônica', 'rascunho',
        'Começo a escrever sem saber onde isso vai dar. Talvez seja sobre o dia. Talvez seja sobre mim.'),
      (sch_id, 'Sol de Junho', 'Cartas para ninguém', 'Carta', 'enviado',
        'Querido ninguém, hoje finalmente tive coragem de escrever o que sinto. Mesmo que ninguém leia, eu li. E isso já mudou alguma coisa.');
  end if;
end$$;
