import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !anonKey) {
  // Mensagem clara no console caso o .env não esteja preenchido.
  console.warn(
    "[Supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY não configurados. " +
      "Preencha o arquivo .env (veja supabase/schema.sql) e reinicie o `npm run dev`."
  );
}

export const supabase = createClient(url ?? "", anonKey ?? "");

export type UserRole = "aluno" | "professor" | "escola";

export type Profile = {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  school_id: string | null;
  created_at: string;
};

export type StoryStatus =
  | "rascunho" | "enviado" | "em_revisao" | "aprovado" | "publicado";

export type Story = {
  id: string;
  school_id: string;
  author_id: string | null;
  author_name: string;
  title: string;
  category: string;
  content: string;
  status: StoryStatus;
  created_at: string;
};

export type Feedback = {
  id: string;
  story_id: string;
  professor_id: string;
  comment: string;
  action: "comentario" | "ajustes" | "aprovacao";
  created_at: string;
};

/** Rótulos legíveis para cada status (usados nos badges da UI). */
export const STATUS_LABEL: Record<StoryStatus, string> = {
  rascunho: "Rascunho",
  enviado: "Enviado",
  em_revisao: "Em revisão",
  aprovado: "Aprovado",
  publicado: "Publicado",
};

/** Cadastra um novo usuário com e-mail, senha e perfil. */
export async function signUp(email: string, password: string, role: UserRole) {
  return supabase.auth.signUp({
    email,
    password,
    options: { data: { role } }, // vira raw_user_meta_data -> usado pela trigger
  });
}

/** Faz login com e-mail e senha. */
export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

/** Encerra a sessão. */
export async function signOut() {
  return supabase.auth.signOut();
}

/** Busca o perfil (com o role) do usuário logado. */
export async function getMyProfile(): Promise<Profile | null> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", auth.user.id)
    .single();
  if (error) return null;
  return data as Profile;
}

/* ── Histórias / feedback (painel do professor) ───────── */

/** Lista as histórias visíveis ao professor logado (RLS limita à escola dele). */
export async function getStories(): Promise<Story[]> {
  const { data, error } = await supabase
    .from("stories")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[getStories]", error.message);
    return [];
  }
  return (data ?? []) as Story[];
}

/** Atualiza o status de uma história (ex.: aprovar, pedir ajustes). */
export async function updateStoryStatus(id: string, status: StoryStatus) {
  return supabase.from("stories").update({ status }).eq("id", id);
}

/** Cria uma história do aluno logado (rascunho ou enviada). */
export async function createStory(input: {
  title: string;
  category: string;
  content: string;
  status: StoryStatus;
}) {
  const profile = await getMyProfile();
  if (!profile) return { data: null, error: { message: "Sem sessão" } };
  if (!profile.school_id) return { data: null, error: { message: "Aluno sem escola vinculada" } };
  return supabase
    .from("stories")
    .insert({
      school_id: profile.school_id,
      author_id: profile.id,
      author_name: profile.name ?? profile.email,
      title: input.title,
      category: input.category,
      content: input.content,
      status: input.status,
    })
    .select()
    .single();
}

/** Atualiza uma história existente (do próprio aluno). */
export async function updateStory(
  id: string,
  input: Partial<{ title: string; category: string; content: string; status: StoryStatus }>
) {
  return supabase.from("stories").update(input).eq("id", id).select().single();
}

/** Lista os feedbacks de uma história (mais recentes primeiro). */
export async function getFeedbacks(storyId: string): Promise<Feedback[]> {
  const { data, error } = await supabase
    .from("feedbacks")
    .select("*")
    .eq("story_id", storyId)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[getFeedbacks]", error.message);
    return [];
  }
  return (data ?? []) as Feedback[];
}

/** Lista todos os feedbacks visíveis ao aluno logado (RLS = só os das suas histórias). */
export async function getMyFeedbacks(): Promise<Feedback[]> {
  const { data, error } = await supabase.from("feedbacks").select("*");
  if (error) {
    console.error("[getMyFeedbacks]", error.message);
    return [];
  }
  return (data ?? []) as Feedback[];
}

/** Registra um feedback do professor numa história. */
export async function addFeedback(
  storyId: string,
  comment: string,
  action: "comentario" | "ajustes" | "aprovacao" = "comentario"
) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: { message: "Sem sessão" } };
  return supabase
    .from("feedbacks")
    .insert({ story_id: storyId, professor_id: auth.user.id, comment, action });
}
