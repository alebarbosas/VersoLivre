import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, signIn, signUp, signOut, getMyProfile, type UserRole } from "../lib/supabase";
import {
  Menu, X, User, BookOpen, PenLine, Library, FileText,
  ChevronRight, Download, Eye, Mic, CheckCircle, Bookmark,
  Home, BarChart2, LogOut, ArrowRight, Wifi, WifiOff,
  Star, Clock, Check, Send, MessageSquare, Printer, Camera,
  Users, BookMarked, Layers, HelpCircle, ChevronLeft, ChevronDown
} from "lucide-react";

type Page =
  | "home" | "biblioteca" | "inspiracoes" | "para-escolas"
  | "acessibilidade" | "login" | "painel-aluno" | "criar-historia"
  | "minhas-historias" | "publicacao" | "painel-professor"
  | "textos-enviados" | "materiais" | "baixa-conectividade";

const ORANGE = "#FB5603";
const MAGENTA = "#D81DA0";
const NAVY = "#1B0C73";
const OFF_WHITE = "#FFF8F6";

const BOOK_GRADIENTS = [
  `linear-gradient(135deg, ${ORANGE} 0%, ${MAGENTA} 100%)`,
  `linear-gradient(135deg, ${MAGENTA} 0%, ${NAVY} 100%)`,
  `linear-gradient(135deg, ${NAVY} 0%, ${ORANGE} 100%)`,
  `linear-gradient(135deg, ${ORANGE} 0%, ${NAVY} 60%, ${MAGENTA} 100%)`,
];

const BOOKS = [
  { title: "Heartstopper", author: "Alice Oseman", genre: "Romance, drama, coming-of-age, LGBTQIAPN+", grad: BOOK_GRADIENTS[0] },
  { title: "Amora", author: "Natalia Borges Polesso", genre: "Contos, afetos e vivências lésbicas", grad: BOOK_GRADIENTS[1] },
  { title: "Enquanto eu não te encontro", author: "Pedro Rhuas", genre: "Romance jovem LGBTQIAPN+", grad: BOOK_GRADIENTS[2] },
  { title: "Vermelho, Branco e Sangue Azul", author: "Casey McQuiston", genre: "Romance LGBTQIAPN+", grad: BOOK_GRADIENTS[3] },
];

const NAV_LINKS: { label: string; page: Page }[] = [
  { label: "Início", page: "home" },
  { label: "Biblioteca", page: "biblioteca" },
  { label: "Inspirações", page: "inspiracoes" },
  { label: "Para escolas", page: "para-escolas" },
  { label: "Acessibilidade", page: "acessibilidade" },
];

/* ── Helpers ─────────────────────────────────────────── */
function Btn({ children, color = ORANGE, text = "#fff", onClick, outline = false, full = false }: {
  children: React.ReactNode; color?: string; text?: string;
  onClick?: () => void; outline?: boolean; full?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={outline
        ? { border: `2px solid ${color}`, color, background: "transparent" }
        : { background: color, color: text }}
      className={`${full ? "w-full" : ""} px-5 py-2.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90 active:scale-95 cursor-pointer`}
    >
      {children}
    </button>
  );
}

function GradBtn({ children, onClick, full = false }: { children: React.ReactNode; onClick?: () => void; full?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{ background: `linear-gradient(90deg, ${ORANGE}, ${MAGENTA})` }}
      className={`${full ? "w-full" : ""} px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90 active:scale-95 cursor-pointer`}
    >
      {children}
    </button>
  );
}

function BookCard({ book, onClick }: { book: typeof BOOKS[0]; onClick?: () => void }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
      <div style={{ background: book.grad }} className="h-40 flex items-center justify-center">
        <BookOpen className="text-white opacity-50" size={48} />
      </div>
      <div className="p-4">
        <p className="font-bold text-sm text-gray-900 leading-tight">{book.title}</p>
        <p className="text-xs text-gray-500 mt-0.5">{book.author}</p>
        <p className="text-xs mt-1" style={{ color: MAGENTA }}>{book.genre}</p>
        <div className="mt-3">
          <Btn color={ORANGE} outline>Ver inspiração</Btn>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string }> = {
    "Rascunho": { bg: "#FFF3E0", text: ORANGE },
    "Enviado": { bg: "#E3F2FD", text: "#1565C0" },
    "Em revisão": { bg: "#F3E5F5", text: "#7B1FA2" },
    "Aprovado": { bg: "#E8F5E9", text: "#2E7D32" },
    "Publicado": { bg: `${NAVY}15`, text: NAVY },
  };
  const s = map[status] || { bg: "#eee", text: "#333" };
  return (
    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ background: s.bg, color: s.text }}>
      {status}
    </span>
  );
}

function SectionTitle({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
      {accent ? <span style={{ color: ORANGE }}>{children}</span> : children}
    </h2>
  );
}

/* ── Header ──────────────────────────────────────────── */
function Header({ current, navigate }: { current: Page; navigate: (p: Page) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-black/5 shadow-sm">
      {/* Desktop */}
      <div className="hidden md:flex items-center justify-between max-w-6xl mx-auto px-6 h-16">
        <button onClick={() => navigate("home")} className="flex items-center gap-2 cursor-pointer">
          <div style={{ background: `linear-gradient(135deg, ${ORANGE}, ${MAGENTA})` }} className="w-8 h-8 rounded-lg flex items-center justify-center">
            <BookOpen size={16} className="text-white" />
          </div>
          <span className="font-extrabold text-lg" style={{ color: NAVY }}>Verso Livre</span>
        </button>
        <nav className="flex items-center gap-6">
          {NAV_LINKS.map(l => (
            <button
              key={l.page}
              onClick={() => navigate(l.page)}
              className="text-sm font-medium transition-colors cursor-pointer"
              style={{ color: current === l.page ? ORANGE : "#4B4B4B" }}
            >
              {l.label}
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Btn color={NAVY} outline onClick={() => navigate("login")}>Entrar</Btn>
          <GradBtn onClick={() => navigate("login")}>Começar agora</GradBtn>
        </div>
      </div>

      {/* Mobile */}
      <div className="flex md:hidden items-center justify-between px-5 h-14">
        <button onClick={() => setMenuOpen(o => !o)} className="p-1">
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
        <button onClick={() => navigate("home")} className="font-extrabold text-base" style={{ color: NAVY }}>
          Verso Livre
        </button>
        <button onClick={() => navigate("login")} className="p-1">
          <User size={22} style={{ color: NAVY }} />
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-white border-t border-black/5 px-5 py-4 flex flex-col gap-3">
          {NAV_LINKS.map(l => (
            <button
              key={l.page}
              onClick={() => { navigate(l.page); setMenuOpen(false); }}
              className="text-left text-sm font-semibold py-2 border-b border-black/5 last:border-0"
              style={{ color: current === l.page ? ORANGE : "#111" }}
            >
              {l.label}
            </button>
          ))}
          <GradBtn full onClick={() => { navigate("login"); setMenuOpen(false); }}>Começar agora</GradBtn>
        </div>
      )}
    </header>
  );
}

/* ── Footer ──────────────────────────────────────────── */
function Footer({ navigate }: { navigate: (p: Page) => void }) {
  return (
    <footer style={{ background: NAVY }} className="text-white pt-12 pb-6 mt-20">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div style={{ background: `linear-gradient(135deg, ${ORANGE}, ${MAGENTA})` }} className="w-8 h-8 rounded-lg flex items-center justify-center">
                <BookOpen size={16} className="text-white" />
              </div>
              <span className="font-extrabold text-lg">Verso Livre</span>
            </div>
            <p className="text-sm text-white/70 leading-relaxed max-w-xs">
              Escrita criativa, diversidade e autoria LGBTQIAPN+ dentro das escolas.
            </p>
          </div>
          <div>
            <p className="font-bold text-sm mb-3" style={{ color: ORANGE }}>Plataforma</p>
            {[
              { l: "Biblioteca Digital", p: "biblioteca" as Page },
              { l: "Inspirações", p: "inspiracoes" as Page },
              { l: "Para Escolas", p: "para-escolas" as Page },
              { l: "Acessibilidade", p: "acessibilidade" as Page },
            ].map(({ l, p }) => (
              <button key={p} onClick={() => navigate(p)} className="block text-sm text-white/60 hover:text-white mb-1.5 cursor-pointer">
                {l}
              </button>
            ))}
          </div>
          <div>
            <p className="font-bold text-sm mb-3" style={{ color: MAGENTA }}>Acesso</p>
            {[
              { l: "Painel do Aluno", p: "painel-aluno" as Page },
              { l: "Painel do Professor", p: "painel-professor" as Page },
              { l: "Materiais de Apoio", p: "materiais" as Page },
              { l: "Modo Offline", p: "baixa-conectividade" as Page },
            ].map(({ l, p }) => (
              <button key={p} onClick={() => navigate(p)} className="block text-sm text-white/60 hover:text-white mb-1.5 cursor-pointer">
                {l}
              </button>
            ))}
          </div>
        </div>
        <div className="border-t border-white/10 pt-6 text-center text-xs text-white/40">
          © 2024 Verso Livre. Todos os direitos reservados. Feito com amor e diversidade.
        </div>
      </div>
    </footer>
  );
}

/* ── Sidebar Aluno ───────────────────────────────────── */
function SidebarAluno({ current, navigate }: { current: Page; navigate: (p: Page) => void }) {
  const items: { icon: React.ReactNode; label: string; page: Page }[] = [
    { icon: <Home size={18} />, label: "Início", page: "painel-aluno" },
    { icon: <PenLine size={18} />, label: "Criar história", page: "criar-historia" },
    { icon: <FileText size={18} />, label: "Minhas histórias", page: "minhas-historias" },
    { icon: <BookOpen size={18} />, label: "Inspirações", page: "inspiracoes" },
    { icon: <Layers size={18} />, label: "Materiais", page: "materiais" },
    { icon: <Library size={18} />, label: "Biblioteca", page: "biblioteca" },
    { icon: <Send size={18} />, label: "Publicação", page: "publicacao" },
  ];
  return (
    <aside className="hidden md:flex flex-col w-56 shrink-0 bg-white rounded-2xl shadow-sm p-4 h-fit sticky top-24">
      <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: ORANGE }}>Menu do Aluno</p>
      {items.map(i => (
        <button
          key={i.page}
          onClick={() => navigate(i.page)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold mb-1 transition-all cursor-pointer"
          style={current === i.page
            ? { background: `${ORANGE}15`, color: ORANGE }
            : { color: "#4B4B4B" }}
        >
          {i.icon} {i.label}
        </button>
      ))}
      <div className="mt-4 pt-4 border-t border-black/5">
        <button
          onClick={async () => { await signOut(); navigate("home"); }}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-400 cursor-pointer w-full"
        >
          <LogOut size={18} /> Sair
        </button>
      </div>
    </aside>
  );
}

/* ── Sidebar Professor ───────────────────────────────── */
function SidebarProf({ current, navigate }: { current: Page; navigate: (p: Page) => void }) {
  const items: { icon: React.ReactNode; label: string; page: Page }[] = [
    { icon: <BarChart2 size={18} />, label: "Visão geral", page: "painel-professor" },
    { icon: <Users size={18} />, label: "Alunos", page: "painel-professor" },
    { icon: <FileText size={18} />, label: "Textos enviados", page: "textos-enviados" },
    { icon: <Layers size={18} />, label: "Materiais", page: "materiais" },
    { icon: <Library size={18} />, label: "Publicações", page: "biblioteca" },
    // { icon: <WifiOff size={18} />, label: "Baixa conectividade", page: "baixa-conectividade" },
  ];
  return (
    <aside className="hidden md:flex flex-col w-56 shrink-0 bg-white rounded-2xl shadow-sm p-4 h-fit sticky top-24">
      <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: MAGENTA }}>Menu do Professor</p>
      {items.map(i => (
        <button
          key={i.label}
          onClick={() => navigate(i.page)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold mb-1 transition-all cursor-pointer"
          style={current === i.page && i.page === current
            ? { background: `${MAGENTA}15`, color: MAGENTA }
            : { color: "#4B4B4B" }}
        >
          {i.icon} {i.label}
        </button>
      ))}
      <div className="mt-4 pt-4 border-t border-black/5">
        <button
          onClick={async () => { await signOut(); navigate("home"); }}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-400 cursor-pointer w-full"
        >
          <LogOut size={18} /> Sair
        </button>
      </div>
    </aside>
  );
}

/* ══════════════════════════════════════════════════════
   PAGES
══════════════════════════════════════════════════════ */

/* ── Home ────────────────────────────────────────────── */
function PageHome({ navigate }: { navigate: (p: Page) => void }) {
  return (
    <div>
      {/* Hero */}
      <section style={{ background: OFF_WHITE }} className="pt-12 pb-16 px-5">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-1 gap-12 items-center">
            {/* Left */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-5" style={{ background: `${ORANGE}15`, color: ORANGE }}>
                <Star size={12} /> Plataforma educacional
              </div>
              <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-5">
                Transforme eletivas escolares em espaços de{" "}
                <span style={{ color: ORANGE }}>autoria</span>,{" "}
                <span style={{ color: MAGENTA }}>diversidade</span> e{" "}
                <span style={{ color: NAVY }}>pertencimento</span>.
              </h1>
              <p className="text-base text-gray-500 leading-relaxed mb-8 max-w-lg">
                A Verso Livre apoia escolas e professores na criação de eletivas de escrita criativa com foco em protagonismo LGBTQIAPN+, acompanhamento dos estudantes e publicação acessível das histórias.
              </p>
              <div className="flex flex-wrap gap-3">
                <GradBtn onClick={() => navigate("login")}>Sou aluno</GradBtn>
                <Btn color={NAVY} onClick={() => navigate("login")}>Sou professor</Btn>
                <Btn color={ORANGE} outline onClick={() => navigate("biblioteca")}>Conhecer biblioteca</Btn>
              </div>
            </div>
            {/* Right – visual */}
            
          </div>
        </div>
      </section>

      {/* Action cards
      <section className="py-16 px-5 bg-white">
        <div className="max-w-6xl mx-auto">
          <SectionTitle>O que você quer fazer hoje?</SectionTitle>
          <p className="text-gray-500 mb-8">Escolha seu caminho na plataforma</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Minhas histórias", icon: <BookMarked size={32} />, color: ORANGE, page: "minhas-historias" as Page },
              { label: "Criar história", icon: <PenLine size={32} />, color: MAGENTA, page: "criar-historia" as Page },
              { label: "Biblioteca digital", icon: <Library size={32} />, color: NAVY, page: "biblioteca" as Page },
              { label: "Materiais", icon: <Layers size={32} />, grad: true, page: "materiais" as Page },
            ].map((c, i) => (
              <button
                key={i}
                onClick={() => navigate(c.page)}
                className="rounded-3xl p-6 text-left hover:scale-[1.02] transition-transform cursor-pointer"
                style={{ background: c.grad ? `linear-gradient(135deg, ${ORANGE}, ${MAGENTA})` : c.color }}
              >
                <div className="text-white mb-4 opacity-90">{c.icon}</div>
                <p className="text-white font-bold text-base leading-snug">{c.label}</p>
                <ChevronRight size={16} className="text-white/50 mt-2" />
              </button>
            ))}
          </div>
        </div>
      </section> */}

      {/* Books section */}
      <section className="py-16 px-5" style={{ background: OFF_WHITE }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <SectionTitle>Livros em destaque</SectionTitle>
            <Btn color={ORANGE} outline onClick={() => navigate("inspiracoes")}>Ver todos</Btn>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {BOOKS.map((b, i) => <BookCard key={i} book={b} onClick={() => navigate("inspiracoes")} />)}
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section className="py-16 px-5 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <SectionTitle>Como funciona</SectionTitle>
            <p className="text-gray-500 mt-2">Três passos para transformar histórias em publicações</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { n: "01", title: "Professor conduz a eletiva", desc: "Materiais de apoio e acompanhamento para professores organizarem atividades de escrita criativa e diversidade.", icon: <Users size={28} />, color: ORANGE },
              { n: "02", title: "Estudante cria sua história", desc: "Alunos desenvolvem contos, poemas, crônicas ou relatos ficcionais com apoio do professor.", icon: <PenLine size={28} />, color: MAGENTA },
              { n: "03", title: "Obra publicada com segurança", desc: "As histórias podem ser publicadas com nome, pseudônimo ou de forma anônima em uma biblioteca digital acessível.", icon: <CheckCircle size={28} />, color: NAVY },
            ].map((s, i) => (
              <div key={i} className="rounded-3xl p-7 border border-black/5 bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white" style={{ background: s.color }}>
                    {s.icon}
                  </div>
                  <span className="text-4xl font-extrabold" style={{ color: `${s.color}20` }}>{s.n}</span>
                </div>
                <h3 className="font-bold text-lg mb-2">{s.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-5" style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #2D1B8E 100%)` }}>
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
            Toda história merece ser contada em liberdade.
          </h2>
          <p className="text-white/60 mb-8 leading-relaxed">
            Uma plataforma de apoio para eletivas escolares de escrita criativa, onde professores acompanham estudantes na criação e publicação segura de histórias autorais.
          </p>
          <GradBtn onClick={() => navigate("login")}>Começar agora — é gratuito</GradBtn>
        </div>
      </section>
    </div>
  );
}

/* ── Biblioteca ──────────────────────────────────────── */
function PageBiblioteca() {
  const [filter, setFilter] = useState("Todos");
  const tags = ["Todos", "Conto", "Poema", "Crônica", "Carta", "Fantasia", "Romance", "Identidade", "Pertencimento", "Futuro"];
  const stories = [
    { title: "O céu também muda", author: "Sol de Junho", cat: "Conto", tags: "identidade, escola, pertencimento", sinopse: "Uma estudante descobre que mudar de nome também pode ser uma forma de voltar para casa." },
    { title: "Cartas para ninguém e todo mundo", author: "Anônimo", cat: "Carta", tags: "amor, futuro, liberdade", sinopse: "Uma série de cartas escritas para pessoas que ainda não existem mas que precisam existir." },
    { title: "Floresta de espelhos", author: "Luna Paz", cat: "Fantasia", tags: "identidade, magia, pertencimento", sinopse: "Numa floresta onde cada árvore reflete uma versão diferente de quem você poderia ser." },
    { title: "13 de junho", author: "Vento do Norte", cat: "Crônica", tags: "escola, amizade, orgulho", sinopse: "O dia em que decidi usar uma bandeira na mochila pela primeira vez." },
    { title: "Poema sem título", author: "M. dos Santos", cat: "Poema", tags: "amor, existência", sinopse: "Às vezes as palavras não cabem no tamanho que a gente sente." },
    { title: "A biblioteca proibida", author: "Ícaro Lima", cat: "Romance", tags: "romance, escola, livros", sinopse: "Dois estudantes se apaixonam pelos corredores da biblioteca escolar." },
  ];
  const filtered = filter === "Todos" ? stories : stories.filter(s => s.cat === filter || s.tags.includes(filter.toLowerCase()));

  return (
    <div className="max-w-6xl mx-auto px-5 py-12">
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-3" style={{ background: `${NAVY}15`, color: NAVY }}>
          <Library size={12} /> Biblioteca Digital
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Biblioteca Digital</h1>
        <p className="text-gray-500 max-w-xl">Histórias criadas por estudantes, publicadas com segurança, acessibilidade e protagonismo.</p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-10">
        {tags.map(t => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className="px-4 py-1.5 rounded-full text-sm font-semibold transition-all cursor-pointer"
            style={filter === t
              ? { background: ORANGE, color: "#fff" }
              : { background: "white", color: "#4B4B4B", border: "1.5px solid rgba(0,0,0,0.1)" }}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {filtered.map((s, i) => (
          <div key={i} className="rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow" style={{ background: NAVY }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold" style={{ background: ORANGE, color: "#fff" }}>{s.cat}</span>
            </div>
            <h3 className="text-white font-bold text-lg mb-1">{s.title}</h3>
            <p className="text-white/50 text-xs mb-3">{s.author}</p>
            <div className="flex flex-wrap gap-1 mb-4">
              {s.tags.split(", ").map(t => (
                <span key={t} className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${MAGENTA}30`, color: MAGENTA }}>{t}</span>
              ))}
            </div>
            <p className="text-white/70 text-sm leading-relaxed mb-5">{s.sinopse}</p>
            <div className="flex gap-2">
              <Btn color={ORANGE}>Ler</Btn>
              <Btn color="transparent" text="rgba(255,255,255,0.7)" outline>
                <span className="flex items-center gap-1.5"><Mic size={14} /> Ouvir</span>
              </Btn>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Inspirações ─────────────────────────────────────── */
function PageInspiracoes() {
  const perguntas = [
    "Que história você gostaria de ter lido quando era mais novo?",
    "Que personagem parecido com você nunca apareceu nos livros da escola?",
    "Como seria uma escola onde todo mundo pudesse existir sem medo?",
    "Que carta você escreveria para seu eu do futuro?",
    "Que personagem você criaria para representar liberdade?",
    "Qual história ainda não foi contada na sua escola?",
  ];
  const colors = [ORANGE, MAGENTA, NAVY, ORANGE, MAGENTA, NAVY];

  return (
    <div className="max-w-6xl mx-auto px-5 py-12">
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Inspirações Literárias</h1>
        <p className="text-gray-500 max-w-xl">Livros, perguntas e ideias para transformar vivências, personagens e imaginação em histórias.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-16">
        {BOOKS.map((b, i) => <BookCard key={i} book={b} />)}
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-1">Perguntas disparadoras</h2>
        <p className="text-gray-500 text-sm">Use essas perguntas para começar a escrever</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {perguntas.map((p, i) => (
          <div key={i} className="bg-white rounded-2xl p-6 border border-black/5 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm font-bold mb-4" style={{ background: colors[i] }}>
              {i + 1}
            </div>
            <p className="font-semibold text-gray-800 leading-snug">{p}</p>
            <button className="mt-4 text-xs font-bold flex items-center gap-1 cursor-pointer" style={{ color: ORANGE }}>
              Escrever a partir disso <ArrowRight size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Para Escolas ────────────────────────────────────── */
function PageParaEscolas({ navigate }: { navigate: (p: Page) => void }) {
  const beneficios = [
    "Fortalece a formação humana",
    "Estimula leitura e escrita",
    "Promove respeito e convivência",
    "Gera produção autoral dos estudantes",
    "Cria uma biblioteca digital da turma",
    "Valoriza professores LGBTQIAPN+ como agentes educadores",
    "Funciona mesmo em escolas com pouca infraestrutura digital",
  ];
  const colors = [ORANGE, MAGENTA, NAVY, ORANGE, MAGENTA, NAVY, ORANGE];

  return (
    <div>
      <section style={{ background: `linear-gradient(135deg, ${NAVY}, #2D1B8E)` }} className="py-20 px-5">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-5 leading-tight">
            Uma eletiva pronta para fortalecer autoria, diversidade e convivência escolar.
          </h1>
          <p className="text-white/70 text-base leading-relaxed mb-8 max-w-2xl mx-auto">
            A Verso Livre apoia escolas na implementação de eletivas de escrita criativa com foco em diversidade, pertencimento e protagonismo LGBTQIAPN+, sem substituir o currículo da instituição.
          </p>
          <GradBtn onClick={() => window.open(
      "https://docs.google.com/forms/d/e/1FAIpQLScIDieZ3mi10rAdP1yZncebWKw6PWTh6pRlNlz_KtKPsIGJSg/viewform?usp=dialog"
    )}>Leve o Verso Livre para sua escola</GradBtn>
        </div>
      </section>

      <section className="py-16 px-5 bg-white">
        <div className="max-w-6xl mx-auto">
          <SectionTitle>Por que a Verso Livre?</SectionTitle>
          <p className="text-gray-500 mb-10 mt-1">Benefícios concretos para professores e gestores</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {beneficios.map((b, i) => (
              <div key={i} className="flex items-start gap-4 p-5 rounded-2xl bg-white border border-black/5 shadow-sm">
                <div className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-white" style={{ background: colors[i] }}>
                  <CheckCircle size={20} />
                </div>
                <p className="font-semibold text-gray-800 text-sm">{b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-5" style={{ background: OFF_WHITE }}>
        <div className="max-w-2xl mx-auto">
          <div className="rounded-3xl p-8 text-center" style={{ background: `linear-gradient(135deg, ${ORANGE}15, ${MAGENTA}15)`, border: `2px solid ${ORANGE}30` }}>
            <p className="text-lg font-bold text-gray-900 leading-relaxed">
              "A plataforma não interfere no currículo da escola. Ela apoia a criação e condução de uma eletiva pedagógica de escrita criativa, diversidade e autoria."
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ── Acessibilidade ──────────────────────────────────── */
function PageAcessibilidade() {
  const items = [
    { icon: <Mic size={26} />, title: "Leitura em voz alta", desc: "As histórias podem ser ouvidas por estudantes com dificuldade de leitura ou deficiência visual.", color: ORANGE },
    { icon: <Mic size={26} />, title: "Audiobooks", desc: "As produções podem ganhar versões em áudio.", color: MAGENTA },
    { icon: <Eye size={26} />, title: "Fonte ampliada", desc: "Interface preparada para leitura confortável.", color: NAVY },
    { icon: <Star size={26} />, title: "Alto contraste", desc: "Modo visual para melhorar a leitura.", color: ORANGE },
    { icon: <User size={26} />, title: "Pseudônimo e anonimato", desc: "O estudante escolhe como deseja aparecer na publicação.", color: MAGENTA },
    { icon: <Printer size={26} />, title: "Materiais impressos", desc: "A eletiva também funciona sem celular ou computador individual.", color: NAVY },
  ];

  return (
    <div className="max-w-6xl mx-auto px-5 py-12">
      <div className="mb-12 text-center max-w-2xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">
          Acessibilidade para que toda história possa ser contada.
        </h1>
        <p className="text-gray-500">Recursos pensados para garantir que nenhum estudante fique de fora.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {items.map((it, i) => (
          <div key={i} className="bg-white rounded-3xl p-7 border border-black/5 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white mb-4" style={{ background: it.color }}>
              {it.icon}
            </div>
            <h3 className="font-bold text-base mb-2">{it.title}</h3>
            <p className="text-gray-500 text-sm leading-relaxed">{it.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Login ───────────────────────────────────────────── */
/** Traduz as mensagens de erro mais comuns do Supabase para português. */
function traduzErroAuth(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
  if (m.includes("email not confirmed")) return "Confirme seu e-mail antes de entrar (verifique sua caixa de entrada).";
  if (m.includes("user already registered")) return "Já existe uma conta com este e-mail.";
  if (m.includes("password should be at least")) return "A senha precisa ter no mínimo 6 caracteres.";
  if (m.includes("unable to validate email")) return "E-mail inválido.";
  if (m.includes("supabase") || m.includes("failed to fetch")) return "Não foi possível conectar. Verifique a configuração do Supabase (.env).";
  return msg;
}

function PageLogin({ navigate }: { navigate: (p: Page) => void }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const irPorPerfil = (role?: UserRole) => {
    if (role === "professor") navigate("painel-professor");
    else if (role === "escola") navigate("para-escolas");
    else navigate("painel-aluno");
  };

  const limpar = () => { setError(null); setInfo(null); };

  const aoEnviar = async (e: React.FormEvent) => {
    e.preventDefault();
    limpar();
    setLoading(true);

    if (mode === "login") {
      const { error } = await signIn(email, password);
      if (error) { setError(traduzErroAuth(error.message)); setLoading(false); return; }
      const profile = await getMyProfile();
      setLoading(false);
      irPorPerfil(profile?.role);
      return;
    }

    // signup — apenas escolas podem se cadastrar
    const { data, error } = await signUp(email, password, "escola");
    setLoading(false);
    if (error) { setError(traduzErroAuth(error.message)); return; }
    if (data.session) {
      irPorPerfil("escola"); // confirmação de e-mail desligada: já entra
    } else {
      setInfo("Conta criada! Enviamos um e-mail de confirmação. Confirme para poder entrar.");
      setMode("login");
    }
  };

  const inputCls = "w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-transparent focus:ring-2 transition-all";

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-5 py-16" style={{ background: OFF_WHITE }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div style={{ background: `linear-gradient(135deg, ${ORANGE}, ${MAGENTA})` }} className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-5">
            <BookOpen size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
            {mode === "login" ? "Bem-vindo de volta" : "Cadastre sua escola"}
          </h1>
          <p className="text-gray-500">
            {mode === "login"
              ? "Entre com seu e-mail e senha"
              : "Crie a conta da instituição para começar"}
          </p>
        </div>

        <div className="bg-white rounded-3xl p-7 shadow-sm border border-gray-100">
          {/* alternância login / cadastro */}
          <div className="flex gap-1 p-1 rounded-xl mb-6" style={{ background: "#F3F1F5" }}>
            {([["login", "Entrar"], ["signup", "Cadastrar escola"]] as const).map(([k, label]) => (
              <button
                key={k}
                onClick={() => { setMode(k); limpar(); }}
                className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer"
                style={mode === k ? { background: "#fff", color: NAVY, boxShadow: "0 1px 3px rgba(0,0,0,.1)" } : { color: "#888" }}
              >
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={aoEnviar} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">E-mail</label>
              <input
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="voce@escola.com.br"
                className={inputCls} style={{ ["--tw-ring-color" as string]: MAGENTA }}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Senha</label>
              <input
                type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className={inputCls} style={{ ["--tw-ring-color" as string]: MAGENTA }}
              />
            </div>

            {error && (
              <p className="text-sm font-medium px-3 py-2 rounded-lg" style={{ background: "#FDECEA", color: "#C0392B" }}>{error}</p>
            )}
            {info && (
              <p className="text-sm font-medium px-3 py-2 rounded-lg" style={{ background: "#E8F5E9", color: "#2E7D32" }}>{info}</p>
            )}

            <button
              type="submit" disabled={loading}
              style={{ background: `linear-gradient(90deg, ${ORANGE}, ${MAGENTA})` }}
              className="w-full px-5 py-3 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90 active:scale-95 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? "Aguarde..." : (mode === "login" ? "Entrar" : "Criar conta da escola")}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          {mode === "login" && (
            <p className="text-center text-xs text-gray-400 mt-5 leading-relaxed">
              Alunos e professores acessam com a conta criada pela escola.<br />
              É uma instituição?{" "}
              <button onClick={() => { setMode("signup"); limpar(); }} className="font-semibold cursor-pointer" style={{ color: MAGENTA }}>
                Cadastre sua escola
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Painel Aluno ────────────────────────────────────── */
function PagePainelAluno({ navigate }: { navigate: (p: Page) => void }) {
  return (
    <div className="max-w-6xl mx-auto px-5 py-8">
      <div className="flex gap-6 items-start">
        <SidebarAluno current="painel-aluno" navigate={navigate} />
        <div className="flex-1 min-w-0">
          {/* Saudação */}
          <div className="mb-8">
            <p className="text-gray-500 text-sm">Bem-vinda de volta!</p>
            <h1 className="text-2xl font-extrabold text-gray-900">Bem-vinda, Maria Giovana 👋</h1>
          </div>

          {/* Action cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Minhas histórias", val: "3", icon: <BookMarked size={22} />, color: ORANGE, page: "minhas-historias" as Page },
              { label: "Criar história", val: "+", icon: <PenLine size={22} />, color: MAGENTA, page: "criar-historia" as Page },
              { label: "Feedback recebido", val: "2", icon: <MessageSquare size={22} />, color: NAVY, page: "textos-enviados" as Page },
              { label: "Status publicação", val: "✓", icon: <CheckCircle size={22} />, grad: true, page: "publicacao" as Page },
            ].map((c, i) => (
              <button
                key={i}
                onClick={() => navigate(c.page)}
                className="rounded-2xl p-5 text-left hover:scale-[1.02] transition-transform cursor-pointer"
                style={{ background: c.grad ? `linear-gradient(135deg, ${ORANGE}, ${MAGENTA})` : c.color }}
              >
                <div className="text-white mb-2">{c.icon}</div>
                <p className="text-white text-2xl font-extrabold">{c.val}</p>
                <p className="text-white/70 text-xs">{c.label}</p>
              </button>
            ))}
          </div>

          {/* Books */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg">Livros em destaque</h2>
              <button className="text-xs font-semibold" style={{ color: ORANGE }} onClick={() => navigate("inspiracoes")}>Ver todos</button>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {BOOKS.map((b, i) => (
                <div key={i} className="shrink-0 w-36 bg-white rounded-2xl shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow">
                  <div style={{ background: b.grad }} className="h-24 flex items-center justify-center">
                    <BookOpen size={24} className="text-white opacity-60" />
                  </div>
                  <div className="p-3">
                    <p className="font-bold text-xs text-gray-900 leading-tight truncate">{b.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{b.author}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Próxima leitura */}
          <div className="rounded-3xl p-6 mb-8 cursor-pointer" style={{ background: NAVY }} onClick={() => navigate("biblioteca")}>
            <p className="text-white/50 text-xs uppercase tracking-widest mb-2">Próxima história</p>
            <h3 className="text-white font-bold text-2xl mb-1">Heartstopper</h3>
            <p className="text-white/60 text-sm mb-1">Autoria: Alice Oseman</p>
            <p className="text-white/50 text-xs mb-4">Gênero: Romance, drama, coming-of-age, LGBTQIAPN+</p>
            <p className="text-white/70 text-sm leading-relaxed mb-5">
              Uma série de quadrinhos sobre dois adolescentes, Charlie e Nick, que se conhecem na escola e desenvolvem uma amizade que vira romance.
            </p>
            <div className="flex gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-white" />
              <div className="w-2.5 h-2.5 rounded-full bg-white/30" />
              <div className="w-2.5 h-2.5 rounded-full bg-white/30" />
            </div>
          </div>

          {/* Progresso */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="font-bold text-lg mb-5">Meu progresso</h2>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {["Ideia inicial", "Rascunho", "Enviado", "Revisão", "Aprovado", "Publicado"].map((s, i) => (
                <div key={i} className="flex items-center gap-2 shrink-0">
                  <div className="flex flex-col items-center">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: i <= 2 ? ORANGE : `${ORANGE}30` }}>
                      {i <= 2 ? <Check size={16} /> : i + 1}
                    </div>
                    <p className="text-xs text-gray-500 mt-1 text-center max-w-[60px] leading-tight">{s}</p>
                  </div>
                  {i < 5 && <div className="w-8 h-0.5 mb-4" style={{ background: i < 2 ? ORANGE : "#e5e7eb" }} />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Criar História ──────────────────────────────────── */
function PageCriarHistoria({ navigate }: { navigate: (p: Page) => void }) {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [cat, setCat] = useState("Conto");
  const [tags, setTags] = useState("");

  return (
    <div className="max-w-6xl mx-auto px-5 py-8">
      <div className="flex gap-6 items-start">
        <SidebarAluno current="criar-historia" navigate={navigate} />
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-extrabold mb-6">Criar história</h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Editor */}
            <div className="md:col-span-2 flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 block">Título da história</label>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Dê um título à sua história..."
                  className="w-full border-2 rounded-xl px-4 py-3 text-base font-semibold focus:outline-none transition-colors"
                  style={{ borderColor: title ? ORANGE : "rgba(0,0,0,0.1)" }}
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 block">Categoria</label>
                  <select
                    value={cat}
                    onChange={e => setCat(e.target.value)}
                    className="w-full border-2 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none cursor-pointer"
                    style={{ borderColor: "rgba(0,0,0,0.1)" }}
                  >
                    {["Conto", "Poema", "Crônica", "Carta", "Fantasia", "Romance"].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 block">Tags</label>
                  <input
                    value={tags}
                    onChange={e => setTags(e.target.value)}
                    placeholder="identidade, escola..."
                    className="w-full border-2 rounded-xl px-4 py-3 text-sm focus:outline-none"
                    style={{ borderColor: "rgba(0,0,0,0.1)" }}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 block">Sua história</label>
                <textarea
                  value={text}
                  onChange={e => setText(e.target.value)}
                  placeholder="Era uma vez... (ou não. Comece como quiser)"
                  rows={14}
                  className="w-full border-2 rounded-2xl px-4 py-4 text-sm leading-relaxed focus:outline-none resize-none transition-colors"
                  style={{ borderColor: text ? ORANGE : "rgba(0,0,0,0.1)" }}
                />
                <p className="text-xs text-gray-400 mt-1">{text.length} caracteres</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Btn color={NAVY} outline>Salvar rascunho</Btn>
                <GradBtn onClick={() => navigate("publicacao")}>Enviar para professor</GradBtn>
                <Btn color={ORANGE} outline><span className="flex items-center gap-1.5"><Mic size={14} /> Ouvir meu texto</span></Btn>
              </div>
            </div>

            {/* Lateral */}
            <div className="flex flex-col gap-4">
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: ORANGE }}>Dicas de escrita</p>
                {[
                  "Comece pelo meio da história",
                  "Descreva o que seu personagem sente",
                  "Use diálogos para dar vida",
                  "Não se preocupe com erros agora",
                ].map((d, i) => (
                  <div key={i} className="flex items-start gap-2 mb-2.5">
                    <div className="w-4 h-4 rounded-full shrink-0 mt-0.5" style={{ background: ORANGE }} />
                    <p className="text-xs text-gray-600">{d}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl p-5" style={{ background: `${NAVY}10` }}>
                <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: NAVY }}>Status do rascunho</p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: ORANGE }} />
                  <p className="text-xs text-gray-600 font-semibold">Editando...</p>
                </div>
              </div>
              <div className="rounded-2xl p-5" style={{ background: `${MAGENTA}10` }}>
                <p className="text-xs font-bold mb-2" style={{ color: MAGENTA }}>Sobre publicação</p>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Você pode publicar com seu nome, um pseudônimo ou de forma anônima. Escolha como se sentir mais seguro.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Minhas Histórias ────────────────────────────────── */
function PageMinhasHistorias({ navigate }: { navigate: (p: Page) => void }) {
  const stories = [
    { title: "O céu também muda", cat: "Conto", status: "Publicado", updated: "12 jun 2024" },
    { title: "Carta para mim do futuro", cat: "Carta", status: "Em revisão", updated: "18 jun 2024" },
    { title: "A floresta que respirava", cat: "Fantasia", status: "Rascunho", updated: "25 jun 2024" },
    { title: "13 de junho", cat: "Crônica", status: "Enviado", updated: "20 jun 2024" },
    { title: "Poema sem título", cat: "Poema", status: "Aprovado", updated: "10 jun 2024" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-5 py-8">
      <div className="flex gap-6 items-start">
        <SidebarAluno current="minhas-historias" navigate={navigate} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-extrabold">Minhas histórias</h1>
            <GradBtn onClick={() => navigate("criar-historia")}>+ Nova história</GradBtn>
          </div>
          <div className="flex flex-col gap-4">
            {stories.map((s, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-black/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{s.cat}</span>
                    <StatusBadge status={s.status} />
                  </div>
                  <h3 className="font-bold text-base text-gray-900">{s.title}</h3>
                  <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1"><Clock size={11} /> {s.updated}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Btn color={ORANGE} onClick={() => navigate("criar-historia")}>Continuar</Btn>
                  <Btn color={NAVY} outline onClick={() => navigate("textos-enviados")}>Ver feedback</Btn>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Publicação Segura ───────────────────────────────── */
function PagePublicacao({ navigate }: { navigate: (p: Page) => void }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [pseudo, setPseudo] = useState("Sol de Junho");
  const [checks, setChecks] = useState([false, false, false]);

  const opts = [
    { title: "Com meu nome", desc: "Seu nome aparecerá junto da história.", color: ORANGE },
    { title: "Com pseudônimo", desc: "Você escolhe um nome artístico para proteger sua identidade.", color: MAGENTA },
    { title: "De forma anônima", desc: "A história será publicada sem identificar você.", color: NAVY },
  ];

  return (
    <div className="max-w-3xl mx-auto px-5 py-12">
      <div className="flex gap-6 items-start">
        <SidebarAluno current="publicacao" navigate={navigate} />
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-extrabold mb-2">Como você quer publicar sua história?</h1>
          <p className="text-gray-500 text-sm mb-8">Você pode mudar de ideia a qualquer momento antes da publicação.</p>

          <div className="flex flex-col gap-4 mb-8">
            {opts.map((o, i) => (
              <button
                key={i}
                onClick={() => setSelected(i)}
                className="w-full rounded-2xl p-5 text-left border-2 transition-all cursor-pointer"
                style={{ borderColor: selected === i ? o.color : "rgba(0,0,0,0.08)", background: selected === i ? `${o.color}08` : "white" }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center" style={{ borderColor: o.color }}>
                    {selected === i && <div className="w-2.5 h-2.5 rounded-full" style={{ background: o.color }} />}
                  </div>
                  <div>
                    <p className="font-bold text-sm">{o.title}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{o.desc}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {selected === 1 && (
            <div className="mb-8">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 block">Pseudônimo escolhido</label>
              <input
                value={pseudo}
                onChange={e => setPseudo(e.target.value)}
                placeholder="Ex: Sol de Junho"
                className="w-full border-2 rounded-xl px-4 py-3 text-base font-semibold focus:outline-none"
                style={{ borderColor: MAGENTA }}
              />
            </div>
          )}

          <div className="bg-white rounded-2xl p-5 shadow-sm mb-8">
            <p className="text-xs font-bold uppercase tracking-widest mb-4 text-gray-500">Confirmações necessárias</p>
            {[
              "Confirmo que revisei minha história",
              "Confirmo que desejo enviar para aprovação do professor",
              "Entendo que posso escolher não publicar publicamente",
            ].map((c, i) => (
              <label key={i} className="flex items-start gap-3 cursor-pointer mb-3 last:mb-0">
                <div
                  className="w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors"
                  style={{ borderColor: checks[i] ? ORANGE : "rgba(0,0,0,0.2)", background: checks[i] ? ORANGE : "transparent" }}
                  onClick={() => setChecks(ch => ch.map((v, j) => j === i ? !v : v))}
                >
                  {checks[i] && <Check size={12} className="text-white" />}
                </div>
                <span className="text-sm text-gray-700">{c}</span>
              </label>
            ))}
          </div>

          <GradBtn full onClick={() => navigate("minhas-historias")}>Enviar para aprovação</GradBtn>
        </div>
      </div>
    </div>
  );
}

/* ── Painel Professor ────────────────────────────────── */
function PagePainelProf({ navigate }: { navigate: (p: Page) => void }) {
  const alunos = [
    { nome: "Maria Giovana", historia: "O céu também muda", cat: "Conto", status: "Publicado" },
    { nome: "Ícaro Lima", historia: "A biblioteca proibida", cat: "Romance", status: "Em revisão" },
    { nome: "Luna Paz", historia: "Floresta de espelhos", cat: "Fantasia", status: "Enviado" },
    { nome: "M. dos Santos", historia: "Poema sem título", cat: "Poema", status: "Aprovado" },
    { nome: "Vento do Norte", historia: "13 de junho", cat: "Crônica", status: "Rascunho" },
    { nome: "Sol de Junho", historia: "Cartas para ninguém", cat: "Carta", status: "Enviado" },
  ];
  const stats = [
    { val: "28", label: "Alunos participantes", color: ORANGE },
    { val: "16", label: "Histórias em andamento", color: MAGENTA },
    { val: "7", label: "Aguardando revisão", color: NAVY },
    { val: "5", label: "Histórias aprovadas", color: ORANGE },
    { val: "3", label: "Publicadas na biblioteca", color: MAGENTA },
    { val: "12", label: "Materiais disponíveis", color: NAVY },
  ];

  return (
    <div className="max-w-6xl mx-auto px-5 py-8">
      <div className="flex gap-6 items-start">
        <SidebarProf current="painel-professor" navigate={navigate} />
        <div className="flex-1 min-w-0">
          <div className="mb-8">
            <p className="text-gray-500 text-sm">Bem-vinda de volta!</p>
            <h1 className="text-2xl font-extrabold">Bem-vinda, professora Marina 👋</h1>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {stats.map((s, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-black/5">
                <p className="text-3xl font-extrabold mb-1" style={{ color: s.color }}>{s.val}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Table desktop / cards mobile */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-black/5 flex items-center justify-between">
              <h2 className="font-bold">Alunos e histórias</h2>
              <Btn color={MAGENTA} outline onClick={() => navigate("textos-enviados")}>Ver textos enviados</Btn>
            </div>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-black/5">
                    {["Aluno", "História", "Categoria", "Status", "Ação"].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {alunos.map((a, i) => (
                    <tr key={i} className="border-b border-black/5 last:border-0 hover:bg-gray-50">
                      <td className="px-5 py-4 font-semibold text-sm">{a.nome}</td>
                      <td className="px-5 py-4 text-sm text-gray-600">{a.historia}</td>
                      <td className="px-5 py-4"><span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{a.cat}</span></td>
                      <td className="px-5 py-4"><StatusBadge status={a.status} /></td>
                      <td className="px-5 py-4">
                        <button className="text-xs font-bold" style={{ color: MAGENTA }} onClick={() => navigate("textos-enviados")}>
                          Ver texto
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile cards */}
            <div className="md:hidden flex flex-col gap-3 p-4">
              {alunos.map((a, i) => (
                <div key={i} className="rounded-xl border border-black/5 p-4">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-bold text-sm">{a.nome}</p>
                    <StatusBadge status={a.status} />
                  </div>
                  <p className="text-xs text-gray-500 mb-1">{a.historia}</p>
                  <p className="text-xs text-gray-400">{a.cat}</p>
                  <button className="mt-2 text-xs font-bold" style={{ color: MAGENTA }} onClick={() => navigate("textos-enviados")}>Ver texto →</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Textos Enviados ─────────────────────────────────── */
function PageTextosEnviados({ navigate }: { navigate: (p: Page) => void }) {
  const [selected, setSelected] = useState(0);
  const [feedback, setFeedback] = useState("");
  const textos = [
    { aluno: "Maria Giovana", titulo: "O céu também muda", cat: "Conto", text: "Era uma vez uma menina chamada Lua que acordava todo dia olhando para o espelho esperando ver alguém diferente. Não porque ela fosse triste — ela só ainda não sabia exatamente quem era a pessoa que vivia naquele corpo. Um dia, ela decidiu mudar o nome. Só isso. Mas mudar o nome mudou tudo." },
    { aluno: "Ícaro Lima", titulo: "A biblioteca proibida", cat: "Romance", text: "A biblioteca da escola fechava às 17h, mas Marcos sempre encontrava uma desculpa para ficar até mais tarde. Não era pelos livros — era por Gabriel, o bibliotecário estagiário que ria de forma silenciosa, como se o riso fosse um segredo entre ele e o mundo." },
    { aluno: "Luna Paz", titulo: "Floresta de espelhos", cat: "Fantasia", text: "Naquela floresta, cada árvore era um espelho. Não refletia o rosto, mas a alma. Sofia entrou com medo. Saiu entendendo que ela podia ser muitas coisas ao mesmo tempo." },
  ];
  const t = textos[selected];

  return (
    <div className="max-w-6xl mx-auto px-5 py-8">
      <div className="flex gap-6 items-start">
        <SidebarProf current="textos-enviados" navigate={navigate} />
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-extrabold mb-6">Textos enviados</h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Lista */}
            <div className="flex flex-col gap-3">
              {textos.map((tx, i) => (
                <button
                  key={i}
                  onClick={() => setSelected(i)}
                  className="w-full text-left rounded-2xl p-4 border-2 transition-all cursor-pointer"
                  style={{ borderColor: selected === i ? MAGENTA : "rgba(0,0,0,0.08)", background: selected === i ? `${MAGENTA}08` : "white" }}
                >
                  <p className="font-bold text-sm">{tx.titulo}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{tx.aluno} · {tx.cat}</p>
                </button>
              ))}
            </div>

            {/* Texto */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: NAVY }}>{t.cat}</p>
              <h2 className="font-extrabold text-xl mb-1">{t.titulo}</h2>
              <p className="text-xs text-gray-400 mb-4">por {t.aluno}</p>
              <p className="text-gray-700 text-sm leading-relaxed">{t.text}</p>
            </div>

            {/* Feedback */}
            <div className="flex flex-col gap-4">
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 block">Comentário para o aluno</label>
                <textarea
                  value={feedback}
                  onChange={e => setFeedback(e.target.value)}
                  rows={5}
                  placeholder="Escreva um feedback construtivo..."
                  className="w-full border-2 rounded-xl p-3 text-sm resize-none focus:outline-none"
                  style={{ borderColor: "rgba(0,0,0,0.1)" }}
                />
                <div className="flex flex-col gap-2 mt-3">
                  <Btn color={ORANGE} full>Enviar comentário</Btn>
                  <Btn color={NAVY} outline full>Solicitar ajustes</Btn>
                  <GradBtn full>Aprovar publicação</GradBtn>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Materiais ───────────────────────────────────────── */
function PageMateriais({ navigate }: { navigate: (p: Page) => void }) {
  const mats = [
    { title: "Como criar um personagem", desc: "Guia passo a passo para dar vida a personagens únicos.", tipo: "Guia" },
    { title: "Como começar uma história", desc: "Técnicas para superar o bloqueio criativo inicial.", tipo: "Guia" },
    { title: "Como escrever uma carta", desc: "Modelo e dicas para cartas ficcionais e reais.", tipo: "Modelo" },
    { title: "Como criar um conto", desc: "Estrutura narrativa do conto: do conflito ao desfecho.", tipo: "PDF" },
    { title: "Como escrever sobre pertencimento", desc: "Reflexões e exercícios sobre identidade e pertencer.", tipo: "Atividade" },
    { title: "Como revisar meu texto", desc: "Checklist de revisão ortográfica e narrativa.", tipo: "Ficha" },
    { title: "Como escolher um título", desc: "10 técnicas para criar títulos memoráveis.", tipo: "PDF" },
    { title: "Como publicar com segurança", desc: "Guia sobre pseudônimo, anonimato e autorização.", tipo: "Guia" },
    { title: "Ficha de personagem", desc: "Modelo para mapear seu personagem completamente.", tipo: "Ficha" },
    { title: "Roteiro de escrita", desc: "Planejamento semanal para a eletiva.", tipo: "Atividade" },
    { title: "Modelo de autorização", desc: "Documento de autorização de publicação.", tipo: "Modelo" },
    { title: "Guia do professor", desc: "Manual completo para condução da eletiva.", tipo: "PDF" },
  ];
  const tipoColor: Record<string, string> = { PDF: ORANGE, Atividade: MAGENTA, Guia: NAVY, Ficha: "#2E7D32", Modelo: "#7B1FA2" };

  return (
    <div className="max-w-6xl mx-auto px-5 py-8">
      <div className="flex gap-6 items-start">
        <SidebarAluno current="materiais" navigate={navigate} />
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-extrabold mb-2">Materiais de Apoio</h1>
          <p className="text-gray-500 text-sm mb-8">Recursos para professores e alunos da eletiva</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {mats.map((m, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 border border-black/5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full text-white" style={{ background: tipoColor[m.tipo] || ORANGE }}>{m.tipo}</span>
                </div>
                <h3 className="font-bold text-sm mb-1">{m.title}</h3>
                <p className="text-gray-500 text-xs leading-relaxed mb-4">{m.desc}</p>
                <div className="flex gap-2">
                  <Btn color={ORANGE}><span className="flex items-center gap-1.5"><Download size={12} /> Baixar</span></Btn>
                  <Btn color={NAVY} outline><span className="flex items-center gap-1.5"><Eye size={12} /> Ver</span></Btn>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Baixa Conectividade ─────────────────────────────── */
function PageBaixaConect({ navigate }: { navigate: (p: Page) => void }) {
  const cards = [
    { icon: <Printer size={28} />, title: "Kit impresso", desc: "Atividades, fichas de escrita e modelos para usar em sala.", color: ORANGE },
    { icon: <PenLine size={28} />, title: "Escrita no papel", desc: "O estudante pode criar sua história manualmente.", color: MAGENTA },
    { icon: <Users size={28} />, title: "Publicação assistida", desc: "O professor cadastra ou digitaliza a história na plataforma.", color: NAVY },
    { icon: <Camera size={28} />, title: "Foto do texto escrito à mão", desc: "A plataforma aceita o registro do texto por imagem para posterior revisão.", color: ORANGE },
    { icon: <FileText size={28} />, title: "Autorização física", desc: "Fichas impressas ajudam o estudante a escolher nome, pseudônimo ou anonimato.", color: MAGENTA },
    { icon: <Layers size={28} />, title: "Uso coletivo da tecnologia", desc: "A plataforma pode ser usada pelo professor em um único dispositivo.", color: NAVY },
  ];

  return (
    <div>
      <section style={{ background: `linear-gradient(135deg, ${NAVY}, ${MAGENTA})` }} className="py-20 px-5 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 bg-white/10">
            <WifiOff size={40} className="text-white" />
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-5 leading-tight">
            A eletiva também funciona sem celular ou computador individual.
          </h1>
          <p className="text-white/70 text-base leading-relaxed max-w-2xl mx-auto">
            O professor pode baixar materiais, imprimir atividades e cadastrar as histórias depois, garantindo que nenhum estudante fique de fora.
          </p>
        </div>
      </section>

      <section className="py-16 px-5 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
            {cards.map((c, i) => (
              <div key={i} className="rounded-3xl p-6 border border-black/5 shadow-sm hover:shadow-md transition-shadow bg-white">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white mb-4" style={{ background: c.color }}>
                  {c.icon}
                </div>
                <h3 className="font-bold text-base mb-2">{c.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>

          <div className="rounded-3xl p-8 text-center mb-10" style={{ background: `linear-gradient(135deg, ${ORANGE}15, ${MAGENTA}15)` }}>
            <p className="text-xl font-extrabold" style={{ color: NAVY }}>
              "A tecnologia não substitui o professor: ela fortalece o professor."
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            <GradBtn>Baixar kit impresso</GradBtn>
            <Btn color={NAVY} onClick={() => navigate("materiais")}>Ver guia do professor</Btn>
            <Btn color={ORANGE} outline onClick={() => navigate("criar-historia")}>Cadastrar história manualmente</Btn>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   ROOT APP
══════════════════════════════════════════════════════ */
const DASHBOARD_PAGES: Page[] = [
  "painel-aluno", "criar-historia", "minhas-historias", "publicacao",
  "painel-professor", "textos-enviados", "materiais"
];

export default function App() {
  const [page, setPage] = useState<Page>("home");
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    // sessão atual (ex.: usuário que já estava logado) + escuta mudanças
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const navigate = (p: Page) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Trava: painéis só abrem com sessão. Sem login -> manda pro login.
  const needsAuth = DASHBOARD_PAGES.includes(page) && authReady && !session;
  const view: Page = needsAuth ? "login" : page;
  const isDashboard = DASHBOARD_PAGES.includes(view);

  return (
    <div className="min-h-screen" style={{ background: OFF_WHITE, fontFamily: "'Poppins', sans-serif" }}>
      <Header current={view} navigate={navigate} />

      <main>
        {view === "home" && <PageHome navigate={navigate} />}
        {view === "biblioteca" && <PageBiblioteca />}
        {view === "inspiracoes" && <PageInspiracoes />}
        {view === "para-escolas" && <PageParaEscolas navigate={navigate} />}
        {view === "acessibilidade" && <PageAcessibilidade />}
        {view === "login" && <PageLogin navigate={navigate} />}
        {view === "painel-aluno" && <PagePainelAluno navigate={navigate} />}
        {view === "criar-historia" && <PageCriarHistoria navigate={navigate} />}
        {view === "minhas-historias" && <PageMinhasHistorias navigate={navigate} />}
        {view === "publicacao" && <PagePublicacao navigate={navigate} />}
        {view === "painel-professor" && <PagePainelProf navigate={navigate} />}
        {view === "textos-enviados" && <PageTextosEnviados navigate={navigate} />}
        {view === "materiais" && <PageMateriais navigate={navigate} />}
        {view === "baixa-conectividade" && <PageBaixaConect navigate={navigate} />}
      </main>

      {!isDashboard && <Footer navigate={navigate} />}
    </div>
  );
}
