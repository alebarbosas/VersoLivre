-- ============================================================
--  VERSO LIVRE — Aluno (MVP) + interligação com o professor
-- ============================================================
--
--  COMO RODAR: SQL Editor > New query > cole tudo > Run.
--  (Idempotente — pode rodar de novo sem problema.)
--  PRÉ-REQUISITO: rode antes o supabase/professor.sql (cria stories/feedbacks
--  e define a escola do professor demo).
--
--  O que faz:
--   - coloca o ALUNO demo na MESMA escola do professor demo
--   - confirma o e-mail do aluno demo (libera o login)
--   - RLS: aluno cria/lê/edita as PRÓPRIAS histórias e lê os feedbacks delas
--  Assim, história que o aluno enviar aparece no painel do professor da escola.
-- ============================================================


-- 1. RLS do aluno em stories --------------------------------------------------
drop policy if exists "stories: aluno lê as suas" on public.stories;
create policy "stories: aluno lê as suas"
  on public.stories for select
  using (author_id = auth.uid());

drop policy if exists "stories: aluno cria as suas" on public.stories;
create policy "stories: aluno cria as suas"
  on public.stories for insert
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'aluno' and p.school_id = stories.school_id
    )
  );

drop policy if exists "stories: aluno edita as suas" on public.stories;
create policy "stories: aluno edita as suas"
  on public.stories for update
  using (author_id = auth.uid());

drop policy if exists "stories: aluno apaga as suas" on public.stories;
create policy "stories: aluno apaga as suas"
  on public.stories for delete
  using (author_id = auth.uid());


-- 2. RLS do aluno em feedbacks (ler os feedbacks das próprias histórias) ------
drop policy if exists "feedbacks: aluno lê os seus" on public.feedbacks;
create policy "feedbacks: aluno lê os seus"
  on public.feedbacks for select
  using (exists (
    select 1 from public.stories s
    where s.id = feedbacks.story_id and s.author_id = auth.uid()
  ));


-- 3. Interliga o aluno demo à escola do professor demo ------------------------
do $$
declare
  aluno_id     uuid;
  prof_school  uuid;
begin
  select school_id into prof_school from public.profiles where email = 'professor@versolivre.com.br';
  select id        into aluno_id    from public.profiles where email = 'aluno@versolivre.com.br';

  if aluno_id is null then
    raise notice 'Conta aluno@versolivre.com.br nao encontrada — rode o seed de contas primeiro.';
    return;
  end if;
  if prof_school is null then
    raise notice 'Professor demo sem escola — rode o supabase/professor.sql primeiro.';
    return;
  end if;

  update auth.users
     set email_confirmed_at = coalesce(email_confirmed_at, now())
   where id = aluno_id;

  update public.profiles
     set name = coalesce(name, 'Aluno Demo'),
         school_id = prof_school
   where id = aluno_id;
end$$;
