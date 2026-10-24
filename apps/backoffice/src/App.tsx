import { useMemo, useState, type MouseEvent } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { AnimatedLogo, Button, Container, Notice, SiteHeader, TextField } from "@gn/ui";
import { ApiContext, httpApi, type Api } from "./lib/api";
import { useUnreadAlerts } from "./lib/equipa";
import { AvisosPage } from "./pages/AvisosPage";
import { CuidadoGatoPage } from "./pages/CuidadoGatoPage";
import { CuidadosPage } from "./pages/CuidadosPage";
import { EscalasPage } from "./pages/EscalasPage";
import { FotosPage } from "./pages/FotosPage";
import { GatosPage } from "./pages/GatosPage";
import { HojePage } from "./pages/HojePage";
import { LojaPage } from "./pages/LojaPage";
import { NoticiasPage } from "./pages/NoticiasPage";
import { NumerosPage } from "./pages/NumerosPage";
import { PatinhasPage } from "./pages/PatinhasPage";
import { PedidosPage } from "./pages/PedidosPage";
import { PromocaoPage } from "./pages/PromocaoPage";
import { SeoPage } from "./pages/SeoPage";

const nav = [
  { href: "/", label: "Hoje" },
  { href: "/cuidados", label: "Cuidados" },
  { href: "/escalas", label: "Escalas" },
  { href: "/gatos", label: "Gatos" },
  { href: "/fotos", label: "Fotos do gatil" },
  { href: "/noticias", label: "Notícias" },
  { href: "/promocao", label: "Promoção" },
  { href: "/avisos", label: "Avisos" },
  { href: "/pedidos", label: "Pedidos" },
  { href: "/loja", label: "Loja" },
  { href: "/patinhas", label: "Patinhas" },
  { href: "/numeros", label: "Números" },
  { href: "/seo", label: "SEO" },
];

const TOKEN_KEY = "gn-admin-token";
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

function readToken() {
  try { return sessionStorage.getItem(TOKEN_KEY) ?? ""; } catch { return ""; }
}

export function App() {
  const [token, setToken] = useState(readToken);
  const api = useMemo(() => (token ? httpApi(API_URL, token) : null), [token]);
  if (!api) return <Login onLogin={(t) => { try { sessionStorage.setItem(TOKEN_KEY, t); } catch { /* ignore */ } setToken(t); }} />;
  return (
    <BrowserRouter>
      <Shell api={api} onLogout={() => { try { sessionStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ } setToken(""); }} />
    </BrowserRouter>
  );
}

/** Routes and layout; also usable in tests with a fake Api and a MemoryRouter. */
export function Shell({ api, onLogout, today }: { api: Api; onLogout?: () => void; today?: Date }) {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 10_000 } } }));
  const location = useLocation();
  const navigate = useNavigate();

  // The shared UI library renders plain links; route internal ones without a page reload.
  function onClick(e: MouseEvent) {
    const a = (e.target as HTMLElement).closest("a");
    const href = a?.getAttribute("href");
    if (!a || !href?.startsWith("/") || a.target || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    navigate(href);
  }

  return (
    <ApiContext.Provider value={api}>
      <QueryClientProvider client={client}>
        <div onClick={onClick}>
          <Header currentPath={location.pathname} onLogout={onLogout} />
          <main id="conteudo" className="bo-main">
            <Container>
              <Routes>
                <Route path="/" element={<HojePage today={today} />} />
                <Route path="/cuidados" element={<CuidadosPage today={today} />} />
                <Route path="/cuidados/:catId" element={<CuidadoGatoPage today={today} />} />
                <Route path="/escalas" element={<EscalasPage today={today} />} />
                <Route path="/gatos" element={<GatosPage />} />
                <Route path="/fotos" element={<FotosPage />} />
                <Route path="/noticias" element={<NoticiasPage />} />
                <Route path="/promocao" element={<PromocaoPage />} />
                <Route path="/avisos" element={<AvisosPage />} />
                <Route path="/pedidos" element={<PedidosPage />} />
                <Route path="/loja" element={<LojaPage today={today} />} />
                <Route path="/patinhas" element={<PatinhasPage />} />
                <Route path="/numeros" element={<NumerosPage />} />
                <Route path="/seo" element={<SeoPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Container>
          </main>
        </div>
      </QueryClientProvider>
    </ApiContext.Provider>
  );
}

/** The menu shows how many care changes this person has not seen yet. */
function Header({ currentPath, onLogout }: { currentPath: string; onLogout?: () => void }) {
  const { unread } = useUnreadAlerts();
  const items = nav.map((item) => (item.href === "/cuidados" ? { ...item, count: unread.length, countLabel: unread.length === 1 ? "novidade por ver" : "novidades por ver" } : item));
  return (
    <SiteHeader
      brand={<><img className="bo-logo" src="/logo.svg" alt="Gatos de Ninguém" width={54} height={56} /><span className="bo-brand-label">Gestão</span></>}
      homeHref="/"
      items={items}
      currentPath={currentPath}
      tools={onLogout ? <Button variant="quiet" onClick={onLogout}>Sair</Button> : undefined}
    />
  );
}

function Login({ onLogin }: { onLogin: (token: string) => void }) {
  const [token, setToken] = useState("");
  const [error, setError] = useState<string>();
  const [checking, setChecking] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setChecking(true);
    try {
      await httpApi(API_URL, token).adoptionInterests();
      onLogin(token);
    } catch {
      setError("Código de acesso errado ou servidor indisponível.");
    } finally {
      setChecking(false);
    }
  }
  return (
    <main className="bo-login">
      <Container narrow>
        <form className="gn-stack gn-stack--m" onSubmit={submit}>
          <AnimatedLogo size={140} />
          <h1>Gestão Gatos de Ninguém</h1>
          <p className="gn-lead">Escreva o código de acesso da equipa.</p>
          <TextField id="token" label="Código de acesso" type="password" autoComplete="current-password" value={token} onChange={(e) => setToken(e.target.value)} />
          {error ? <Notice tone="error" title="Não foi possível entrar">{error}</Notice> : null}
          <Button type="submit" disabled={!token || checking} block>{checking ? "A verificar…" : "Entrar"}</Button>
          <p className="small muted">Em breve: entrada com email para cada voluntário.</p>
        </form>
      </Container>
    </main>
  );
}
