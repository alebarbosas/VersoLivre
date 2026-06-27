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
  role: UserRole;
  created_at: string;
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
