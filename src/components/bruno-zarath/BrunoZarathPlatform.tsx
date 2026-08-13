// @ts-nocheck
"use client";

import { useState, useRef, useEffect } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Camera, Search, ShoppingBag, X, Menu, ChevronLeft, ChevronRight,
  MessageCircle, Link2, Download, Heart, ScanFace,
  Check, Plus, Minus, ArrowRight, Calendar, MapPin, Users, Clock,
  LayoutDashboard, Image as ImageIcon, FolderOpen,
  FileText, Wallet, Settings, LogOut, TrendingUp, Eye, CheckSquare, Square, ShoppingCart
} from "lucide-react";
import "./bruno-zarath.css";
import { useContent } from "./content-context";
import SelfieSearch from "./SelfieSearch";
import PublicGuideBar from "./PublicGuideBar";
import Reveal from "@/components/ui/Reveal";
import MaskedInput from "@/components/ui/MaskedInput";

/* ============================================================
   BRUNO ZARATH — PLATAFORMA
   Tokens
   - bg:      #0C0C0D  (quase-preto, "sala escura")
   - surface: #17161654
   - line:    #2A2826
   - text:    #F3EFE7  (branco quente)
   - muted:   #A9A399
   - accent:  #C98A3B  (âmbar de holofote — luz de arena/palco)
   - accent2: #8E9B7C  (verde oliva baixo — contraponto, gramado noturno)
   Display type: "Bebas Neue" (condensada, cartaz/crachá de evento)
   Body type:    "Work Sans"
   Mono/util:    "IBM Plex Mono" (para dados: preços, códigos, specs)
   Signature: "cartela de contato" — tira de negativos/thumbnails que
   corre no rodapé do hero, e moldura tipo "slide de filme" nas fotos.
   ============================================================ */

type ViewState =
  | string
  | { name: "evento"; id: string }
  | { name: "busca-resultados"; photoIds: string[] };

function img(seed: string, w = 900, h = 1200) {
  return `https://picsum.photos/seed/${seed}/${w}/${h}`;
}

const CATEGORIES = ["Eventos", "Esportes", "Ensaios", "Retratos", "Shows", "Lifestyle", "Automotivo", "Corporativo"];

const NAV = [
  { id: "home", label: "Início" },
  { id: "portfolio", label: "Portfólio" },
  { id: "galerias", label: "Galerias" },
  { id: "servicos", label: "Serviços" },
  { id: "orcamento", label: "Orçamento" },
  { id: "sobre", label: "Sobre" },
];

/* ---------- small building blocks ---------- */

function WatermarkOverlay({ large = false, count = 30, cols = 6 }) {
  return (
    <div className={`filmframe__watermark ${large ? "filmframe__watermark--large" : ""}`} aria-hidden>
      <div className="filmframe__watermark-grid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: count }).map((_, i) => (
          <span key={i} className="filmframe__watermark-text">BRUNO ZARATH</span>
        ))}
      </div>
    </div>
  );
}

function FilmFrame({
  src, alt, ratio = "4/5", children, className = "",
  watermarked = true, selectable = false, selected = false, onSelect, onOpen,
}) {
  return (
    <div
      className={`filmframe ${className} ${selected ? "is-selected" : ""}`}
      style={{ aspectRatio: ratio }}
      onClick={selectable ? onSelect : undefined}
      role={selectable ? "button" : undefined}
      tabIndex={selectable ? 0 : undefined}
      onKeyDown={selectable ? (e) => e.key === "Enter" && onSelect?.() : undefined}
    >
      <img
        src={src}
        alt={alt}
        loading="lazy"
        draggable={false}
        onContextMenu={watermarked ? (e) => e.preventDefault() : undefined}
      />
      {watermarked && <WatermarkOverlay />}
      <span className="filmframe__notch filmframe__notch--l" />
      <span className="filmframe__notch filmframe__notch--r" />
      {selectable && (
        <span className="filmframe__selectbadge">
          {selected ? <CheckSquare size={18} /> : <Square size={18} />}
        </span>
      )}
      {children}
      {!selectable && onOpen && (
        <button type="button" className="filmframe__zoom" onClick={(e) => { e.stopPropagation(); onOpen(); }}><Eye size={16} /></button>
      )}
    </div>
  );
}

function SelectBar({ count, total, onAdd, onClear, onSelectAll, label = "foto(s)" }) {
  if (count === 0) return null;
  return (
    <div className="selectbar">
      <span><strong>{count}</strong> {label} · {BRL(total)}</span>
      <div className="selectbar__actions">
        <button type="button" className="btn btn--ghost btn--sm" onClick={onSelectAll}>Selecionar todas</button>
        <button type="button" className="btn btn--ghost btn--sm" onClick={onClear}>Limpar</button>
        <button type="button" className="btn btn--primary btn--sm" onClick={onAdd}>
          <ShoppingCart size={14} /> Adicionar ao carrinho
        </button>
      </div>
    </div>
  );
}

function Eyebrow({ children }) {
  return <div className="eyebrow">{children}</div>;
}

function PrimaryBtn({ children, onClick, icon: Icon, style }: { children: React.ReactNode; onClick?: () => void; icon?: LucideIcon; style?: React.CSSProperties }) {
  return (
    <button className="btn btn--primary" onClick={onClick} style={style}>
      {children} {Icon && <Icon size={16} strokeWidth={2} />}
    </button>
  );
}
function GhostBtn({ children, onClick, icon: Icon, style }: { children: React.ReactNode; onClick?: () => void; icon?: LucideIcon; style?: React.CSSProperties }) {
  return (
    <button className="btn btn--ghost" onClick={onClick} style={style}>
      {children} {Icon && <Icon size={16} strokeWidth={2} />}
    </button>
  );
}

function BRL(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function InstagramIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function FacebookIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

/* ================= NAVBAR ================= */

function Navbar({ view, setView, cartCount, onOpenCart }) {
  const [open, setOpen] = useState(false);
  const [solid, setSolid] = useState(false);
  useEffect(() => {
    const el = document.getElementById("app-scroll");
    if (!el) return;
    const onScroll = () => setSolid(el.scrollTop > 40);
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header className={`nav ${solid || view !== "home" ? "nav--solid" : ""}`}>
      <div className="nav__row">
        <button className="nav__brand" onClick={() => setView("home")}>
          <span className="nav__brandmark">BZ</span>
          <span className="nav__brandname">BRUNO ZARATH</span>
        </button>
        <nav className="nav__links">
          {NAV.map((n) => (
            <button
              key={n.id}
              className={`nav__link ${view === n.id ? "is-active" : ""}`}
              onClick={() => setView(n.id)}
            >
              {n.label}
            </button>
          ))}
        </nav>
        <div className="nav__actions">
          <button className="nav__icon" onClick={() => setView("busca")} aria-label="Encontrar minhas fotos">
            <Search size={18} />
          </button>
          <button className="nav__icon nav__cart" onClick={onOpenCart} aria-label="Carrinho">
            <ShoppingBag size={18} />
            {cartCount > 0 && <span className="nav__badge">{cartCount}</span>}
          </button>
          <button className="btn btn--sm btn--primary nav__cta" onClick={() => setView("busca")}>
            <ScanFace size={15} /> SELFIE IA
          </button>
          <button className="nav__icon nav__burger" onClick={() => setOpen((o) => !o)} aria-label="Menu">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      {open && (
        <div className="nav__mobile">
          {NAV.map((n) => (
            <button key={n.id} onClick={() => { setView(n.id); setOpen(false); }}>{n.label}</button>
          ))}
          <button onClick={() => { setView("busca"); setOpen(false); }}>Selfie IA — minhas fotos</button>
        </div>
      )}
    </header>
  );
}

/* ================= HOME ================= */

function Home({ setView, openPhoto }) {
  const { events: EVENTS, photos: PHOTOS, promotions } = useContent();
  const strip = PHOTOS.slice(0, 14);
  return (
    <div>
      {promotions.length > 0 && (
        <div className="promobar">
          {promotions.map((p) => (
            <div key={p.codigo} className="promobar__item">
              <strong>{p.codigo}</strong> — {p.titulo}
              {p.descricao ? <span> · {p.descricao}</span> : null}
            </div>
          ))}
        </div>
      )}
      <section className="hero">
        <div className="hero__bg">
          <img src={img("hero-main", 1600, 2000)} alt="Bruno Zarath — fotografia" />
          <div className="hero__scrim" />
          <div className="hero__sweep" />
        </div>
        <div className="hero__content">
          <Eyebrow>FOTÓGRAFO · CURITIBA, PR</Eyebrow>
          <h1 className="hero__title">BRUNO<br />ZARATH</h1>
          <p className="hero__sub">Fotografia que transforma momentos em memória.</p>
          <div className="hero__actions">
            <PrimaryBtn onClick={() => setView("busca")} icon={ScanFace}>BUSCAR COM SELFIE (IA)</PrimaryBtn>
            <GhostBtn onClick={() => setView("portfolio")} icon={ArrowRight}>VER PORTFÓLIO</GhostBtn>
            <GhostBtn onClick={() => setView("galerias")}>GALERIAS DE EVENTOS</GhostBtn>
          </div>
        </div>
        <div className="hero__strip">
          {strip.map((p) => (
            <img key={p.id} src={p.img} alt="" onClick={() => openPhoto(p)} />
          ))}
        </div>
      </section>

      <Reveal>
      <section className="section selfiesection">
        <div className="selfiesection__inner">
          <div className="selfiesection__copy">
            <Eyebrow>RECONHECIMENTO FACIAL</Eyebrow>
            <h2 className="section__title">Encontre suas fotos com uma selfie</h2>
            <p className="page__lead">
              Nossa IA compara o seu rosto com todas as fotos do evento e mostra só as imagens em que você aparece — rápido, privado e sem precisar procurar galeria por galeria.
            </p>
            <ul className="selfiesection__steps">
              <li><span>1</span> Tire ou envie uma selfie</li>
              <li><span>2</span> A IA analisa seu rosto no navegador</li>
              <li><span>3</span> Veja e compre suas fotos</li>
            </ul>
            <PrimaryBtn onClick={() => setView("busca")} icon={ScanFace}>COMEÇAR BUSCA POR SELFIE</PrimaryBtn>
          </div>
          <div className="selfiesection__visual" aria-hidden>
            <div className="selfiesection__face">
              <ScanFace size={48} strokeWidth={1.2} />
            </div>
            <div className="selfiesection__scan" />
          </div>
        </div>
      </section>
      </Reveal>

      <Reveal>
      <section className="section pillars">
        <Eyebrow>NÃO É APENAS UMA GALERIA</Eyebrow>
        <h2 className="section__title">É o negócio do artista.</h2>
        <div className="pillars__grid">
          {[
            { t: "Portfólio", d: "Mostre seu trabalho.", i: ImageIcon },
            { t: "Venda", d: "Venda suas fotografias diretamente.", i: ShoppingBag },
            { t: "Orçamento", d: "Transforme visitantes em clientes.", i: FileText },
            { t: "Relacionamento", d: "Tenha seus próprios clientes e pedidos.", i: Users },
          ].map((p) => (
            <div key={p.t} className="pillar">
              <p.i size={22} strokeWidth={1.5} />
              <h3>{p.t}</h3>
              <p>{p.d}</p>
            </div>
          ))}
        </div>
        <p className="pillars__line">Sua fotografia. Sua marca. Seus clientes. Seu negócio.</p>
      </section>
      </Reveal>

      <Reveal>
      <section className="section">
        <div className="section__head">
          <div>
            <Eyebrow>GALERIAS RECENTES</Eyebrow>
            <h2 className="section__title">Encontre suas fotos</h2>
          </div>
          <GhostBtn onClick={() => setView("galerias")}>VER TODAS</GhostBtn>
        </div>
        <div className="eventgrid">
          {EVENTS.slice(0, 3).map((e) => (
            <EventCard key={e.id} ev={e} onClick={() => setView({ name: "evento", id: e.id })} />
          ))}
        </div>
      </section>
      </Reveal>

      <Reveal>
      <section className="section">
        <div className="section__head">
          <div>
            <Eyebrow>PORTFÓLIO</Eyebrow>
            <h2 className="section__title">Um pouco do trabalho</h2>
          </div>
          <GhostBtn onClick={() => setView("portfolio")}>GALERIA COMPLETA</GhostBtn>
        </div>
        <div className="masonry">
          {PHOTOS.slice(3, 11).map((p, i) => (
            <FilmFrame
              key={p.id}
              src={p.img}
              alt={p.categoria}
              ratio={i % 5 === 0 ? "4/5" : i % 3 === 0 ? "1/1" : "3/4"}
              className="masonry__item"
              onOpen={() => openPhoto(p)}
            />
          ))}
        </div>
      </section>
      </Reveal>

      <AboutStrip setView={setView} />
      <InstaStrip />
    </div>
  );
}

function EventCard({ ev, onClick }) {
  return (
    <button className="eventcard" onClick={onClick}>
      <div className="eventcard__img">
        <img src={ev.capa} alt={ev.nome} draggable={false} onContextMenu={(e) => e.preventDefault()} />
        <div className="filmframe__watermark filmframe__watermark--card" aria-hidden>
          <div className="filmframe__watermark-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
            {Array.from({ length: 16 }).map((_, i) => (
              <span key={i} className="filmframe__watermark-text">BRUNO ZARATH</span>
            ))}
          </div>
        </div>
        <span className="eventcard__cat">{ev.categoria}</span>
      </div>
      <div className="eventcard__meta">
        <h3>{ev.nome}</h3>
        <div className="eventcard__row">
          <span><Calendar size={13} /> {ev.data}</span>
          <span><MapPin size={13} /> {ev.local}</span>
        </div>
        <div className="eventcard__row eventcard__row--sub">
          <span>{ev.fotos} fotos</span>
          <span className="eventcard__link">Ver fotos <ArrowRight size={13} /></span>
        </div>
      </div>
    </button>
  );
}

function AboutStrip({ setView }) {
  return (
    <section className="about">
      <div className="about__img">
        <img src={img("bruno-portrait", 900, 1100)} alt="Bruno Zarath" />
      </div>
      <div className="about__text">
        <Eyebrow>SOBRE BRUNO</Eyebrow>
        <h2 className="section__title">Pessoa, artista, fotógrafo, empreendedor.</h2>
        <p>
          Comecei fotografando corridas de rua com uma bike emprestada e um cartão de memória cheio.
          Hoje cubro maratonas, campeonatos, shows e casamentos em Curitiba e região — sempre atrás
          do quadro que ninguém mais viu. Cada evento é uma narrativa de esforço, suor e emoção, e
          meu trabalho é guardar isso antes que desapareça.
        </p>
        <p>
          Fotografia esportiva e de eventos ao vivo, retratos autorais e cobertura corporativa —
          sempre com a mesma regra: entregar rápido, entregar bonito, entregar de um jeito que a
          pessoa se reconheça na foto.
        </p>
        <GhostBtn onClick={() => setView("sobre")} icon={ArrowRight}>CONHEÇA A HISTÓRIA</GhostBtn>
      </div>
    </section>
  );
}

function InstaStrip() {
  return (
    <section className="insta">
      <div>
        <InstagramIcon size={20} />
        <span>@brunozarath</span>
      </div>
      <a className="btn btn--ghost btn--sm" href="https://www.instagram.com/brunozarath/" target="_blank" rel="noreferrer">
        SEGUIR NO INSTAGRAM
      </a>
    </section>
  );
}

/* ================= PORTFOLIO ================= */

function Portfolio({ openPhoto, addToCart }) {
  const { photos: PHOTOS } = useContent();
  const [cat, setCat] = useState("Todas");
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState({});
  const filtered = cat === "Todas" ? PHOTOS : PHOTOS.filter((p) => p.categoria === cat);

  const selectedList = filtered.filter((p) => selected[p.id]);
  const selectedTotal = selectedList.reduce((s, p) => s + p.preco, 0);

  function toggle(p) {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[p.id]) delete next[p.id];
      else next[p.id] = p;
      return next;
    });
  }

  function addSelected() {
    selectedList.forEach((p) => addToCart({ ...p, tipo: "foto", qty: 1 }));
    setSelected({});
    setSelectMode(false);
  }

  return (
    <div className="page">
      <div className="page__head">
        <Eyebrow>GALERIA DE ARTE DIGITAL</Eyebrow>
        <h1 className="page__title">Portfólio</h1>
        <p className="page__lead">Imagens com marca d&apos;água — preview protegido. Compre para receber em alta resolução.</p>
      </div>
      <div className="gallerytools">
        <div className="chips">
          <button className={`chip ${cat === "Todas" ? "is-active" : ""}`} onClick={() => setCat("Todas")}>Todas</button>
          {CATEGORIES.map((c) => (
            <button key={c} className={`chip ${cat === c ? "is-active" : ""}`} onClick={() => setCat(c)}>{c}</button>
          ))}
        </div>
        <button
          type="button"
          className={`btn btn--sm ${selectMode ? "btn--primary" : "btn--ghost"}`}
          onClick={() => { setSelectMode(!selectMode); setSelected({}); }}
        >
          {selectMode ? "Modo seleção ativo" : "Selecionar fotos"}
        </button>
      </div>
      <SelectBar
        count={selectedList.length}
        total={selectedTotal}
        onAdd={addSelected}
        onClear={() => setSelected({})}
        onSelectAll={() => {
          const all = {};
          filtered.forEach((p) => { all[p.id] = p; });
          setSelected(all);
        }}
      />
      <div className="masonry masonry--wide">
        {filtered.map((p, i) => (
          <FilmFrame
            key={p.id}
            src={p.img}
            alt={p.categoria}
            ratio={i % 4 === 0 ? "1/1" : i % 3 === 0 ? "4/5" : "3/4"}
            className="masonry__item"
            watermarked
            selectable={selectMode}
            selected={!!selected[p.id]}
            onSelect={() => toggle(p)}
            onOpen={selectMode ? undefined : () => openPhoto(p)}
          >
            {!selectMode && <span className="filmframe__tag">{p.categoria}</span>}
            {!selectMode && (
              <button type="button" className="filmframe__quickbuy" onClick={(e) => { e.stopPropagation(); addToCart({ ...p, tipo: "foto" }); }}>
                <ShoppingBag size={14} />
              </button>
            )}
          </FilmFrame>
        ))}
      </div>
    </div>
  );
}

/* ================= GALERIAS / EVENTOS ================= */

function Galerias({ setView }) {
  const { events: EVENTS } = useContent();
  return (
    <div className="page">
      <div className="galerias-banner" onClick={() => setView("busca")} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && setView("busca")}>
        <ScanFace size={22} />
        <div>
          <strong>Reconhecimento facial por IA</strong>
          <span>Envie uma selfie e encontre suas fotos em todos os eventos</span>
        </div>
        <ArrowRight size={18} />
      </div>
      <div className="page__head">
        <Eyebrow>ENCONTRE SUAS FOTOS</Eyebrow>
        <h1 className="page__title">Galerias de eventos</h1>
      </div>
      <div className="eventgrid eventgrid--full">
        {EVENTS.map((e) => (
          <EventCard key={e.id} ev={e} onClick={() => setView({ name: "evento", id: e.id })} />
        ))}
      </div>
    </div>
  );
}

function EventoDetail({ id, setView, addToCart, openPhoto }) {
  const { events: EVENTS, photos: PHOTOS } = useContent();
  const ev = EVENTS.find((e) => e.id === id);
  const photos = PHOTOS.filter((p) => p.eventoId === id);
  const [selectMode, setSelectMode] = useState(true);
  const [selected, setSelected] = useState({});

  if (!ev) return null;

  const selectedList = photos.filter((p) => selected[p.id]);
  const selectedTotal = selectedList.reduce((s, p) => s + p.preco, 0);

  function toggle(p) {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[p.id]) delete next[p.id];
      else next[p.id] = p;
      return next;
    });
  }

  function addSelected() {
    selectedList.forEach((p) => addToCart({ ...p, tipo: "foto", qty: 1 }));
    setSelected({});
  }

  return (
    <div>
      <div className="eventohero">
        <img src={ev.capa} alt={ev.nome} draggable={false} onContextMenu={(e) => e.preventDefault()} />
        <WatermarkOverlay large count={42} cols={7} />
        <div className="eventohero__scrim" />
        <div className="eventohero__content">
          <button className="backlink" onClick={() => setView("galerias")}><ChevronLeft size={16} /> Todas as galerias</button>
          <Eyebrow>{ev.categoria}</Eyebrow>
          <h1 className="page__title">{ev.nome}</h1>
          <div className="eventohero__meta">
            <span><Calendar size={14} /> {ev.data}</span>
            <span><MapPin size={14} /> {ev.local}</span>
            <span>{photos.length} fotos disponíveis</span>
          </div>
        </div>
      </div>
      <div className="page">
        <div className="gallerytools">
          <p className="page__lead" style={{ margin: 0 }}>
            Toque nas fotos para selecionar. Preview com marca d&apos;água — arquivo original após compra.
          </p>
          <button
            type="button"
            className={`btn btn--sm ${selectMode ? "btn--primary" : "btn--ghost"}`}
            onClick={() => setSelectMode(!selectMode)}
          >
            {selectMode ? "Seleção múltipla" : "Modo visualização"}
          </button>
        </div>
        <SelectBar
          count={selectedList.length}
          total={selectedTotal}
          onAdd={addSelected}
          onClear={() => setSelected({})}
          onSelectAll={() => {
            const all = {};
            photos.forEach((p) => { all[p.id] = p; });
            setSelected(all);
          }}
        />
        <div className="masonry masonry--wide">
          {photos.map((p, i) => (
            <FilmFrame
              key={p.id}
              src={p.img}
              alt={ev.nome}
              ratio={i % 4 === 0 ? "1/1" : "3/4"}
              className="masonry__item"
              watermarked
              selectable={selectMode}
              selected={!!selected[p.id]}
              onSelect={() => toggle(p)}
              onOpen={selectMode ? undefined : () => openPhoto(p)}
            >
              {!selectMode && <span className="filmframe__price">{BRL(p.preco)}</span>}
              {!selectMode && (
                <button type="button" className="filmframe__quickbuy" onClick={(e) => { e.stopPropagation(); addToCart({ ...p, tipo: "foto" }); }}>
                  <ShoppingBag size={14} />
                </button>
              )}
            </FilmFrame>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ================= RECONHECIMENTO FACIAL (cliente) ================= */

function Busca({ setView }) {
  const [mode, setMode] = useState("selfie");
  const { events: EVENTS } = useContent();
  const [codigo, setCodigo] = useState("");
  const [nome, setNome] = useState("");

  function buscarEvento() {
    const q = codigo.trim().toLowerCase();
    if (!q) return;
    const ev = EVENTS.find(
      (e) => e.id.toLowerCase().includes(q) || e.nome.toLowerCase().includes(q),
    );
    if (ev) setView({ name: "evento", id: ev.id });
    else setView("galerias");
  }

  return (
    <div className={`page ${mode === "selfie" ? "page--selfie" : "page--narrow"}`}>
      <div className="page__head page__head--center">
        <Eyebrow>RECONHECIMENTO FACIAL · IA</Eyebrow>
        <h1 className="page__title">Encontre suas fotos com uma selfie</h1>
        <p className="page__lead page__lead--center">
          Envie uma foto do seu rosto. Nossa inteligência artificial varre todas as galerias e mostra apenas as fotos em que você aparece.
        </p>
      </div>

      {mode === "selfie" && (
        <div className="selfiehero">
          <SelfieSearch
            onResults={(photoIds) => setView({ name: "busca-resultados", photoIds })}
          />
        </div>
      )}

      {mode === "selfie" ? (
        <button type="button" className="busca-alt__toggle" onClick={() => setMode("codigo")}>
          Buscar por código do evento ou nome
        </button>
      ) : (
        <div className="busca-alt">
          <button type="button" className="busca-alt__back" onClick={() => setMode("selfie")}>
            <ScanFace size={14} /> Voltar para reconhecimento facial
          </button>
          <div className="searchtabs">
            <button className={mode === "codigo" ? "is-active" : ""} onClick={() => setMode("codigo")}>Código do evento</button>
            <button className={mode === "nome" ? "is-active" : ""} onClick={() => setMode("nome")}>Meu nome</button>
          </div>
          <div className="searchbox">
            {mode === "codigo" && (
              <>
                <input placeholder="Ex: MC26 ou nome do evento" value={codigo} onChange={(e) => setCodigo(e.target.value)} />
                <PrimaryBtn icon={Search} onClick={buscarEvento}>BUSCAR EVENTO</PrimaryBtn>
              </>
            )}
            {mode === "nome" && (
              <>
                <input placeholder="Digite seu nome completo" value={nome} onChange={(e) => setNome(e.target.value)} />
                <PrimaryBtn icon={Search} onClick={() => setView("galerias")}>BUSCAR FOTOS</PrimaryBtn>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ================= BUSCA RESULTADOS (IA) ================= */

function BuscaResultados({ photoIds, setView, addToCart, openPhoto }) {
  const { photos: PHOTOS } = useContent();
  const idSet = new Set(photoIds);
  const photos = PHOTOS.filter((p) => idSet.has(p.id));
  const [selectMode, setSelectMode] = useState(true);
  const [selected, setSelected] = useState({});

  const selectedList = photos.filter((p) => selected[p.id]);
  const selectedTotal = selectedList.reduce((s, p) => s + p.preco, 0);

  function toggle(p) {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[p.id]) delete next[p.id];
      else next[p.id] = p;
      return next;
    });
  }

  function addSelected() {
    selectedList.forEach((p) => addToCart({ ...p, tipo: "foto", qty: 1 }));
    setSelected({});
  }

  return (
    <div className="page">
      <div className="page__head">
        <button className="backlink" onClick={() => setView("busca")}><ChevronLeft size={16} /> Nova busca</button>
        <Eyebrow>RESULTADO · RECONHECIMENTO FACIAL</Eyebrow>
        <h1 className="page__title">Suas fotos</h1>
        <p className="page__lead">
          {photos.length > 0
            ? `A IA encontrou ${photos.length} foto(s) com o seu rosto. Selecione e adicione ao carrinho.`
            : "Nenhuma foto encontrada. Tente outra selfie com rosto visível e boa iluminação."}
        </p>
      </div>
      {photos.length > 0 && (
        <>
          <div className="gallerytools">
            <button
              type="button"
              className={`btn btn--sm ${selectMode ? "btn--primary" : "btn--ghost"}`}
              onClick={() => setSelectMode(!selectMode)}
            >
              {selectMode ? "Seleção múltipla" : "Modo visualização"}
            </button>
          </div>
          <SelectBar
            count={selectedList.length}
            total={selectedTotal}
            onAdd={addSelected}
            onClear={() => setSelected({})}
            onSelectAll={() => {
              const all = {};
              photos.forEach((p) => { all[p.id] = p; });
              setSelected(all);
            }}
          />
          <div className="masonry masonry--wide">
            {photos.map((p, i) => (
              <FilmFrame
                key={p.id}
                src={p.img}
                alt={p.evento}
                ratio={i % 4 === 0 ? "1/1" : "3/4"}
                className="masonry__item"
                watermarked
                selectable={selectMode}
                selected={!!selected[p.id]}
                onSelect={() => toggle(p)}
                onOpen={selectMode ? undefined : () => openPhoto(p)}
              >
                {!selectMode && <span className="filmframe__price">{BRL(p.preco)}</span>}
                {!selectMode && <span className="filmframe__tag">{p.evento}</span>}
                {!selectMode && (
                  <button type="button" className="filmframe__quickbuy" onClick={(e) => { e.stopPropagation(); addToCart({ ...p, tipo: "foto" }); }}>
                    <ShoppingBag size={14} />
                  </button>
                )}
              </FilmFrame>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ================= PHOTO LIGHTBOX / SALE ================= */

function PhotoModal({ photo, onClose, addToCart, list }) {
  const [idx, setIdx] = useState(() => list.findIndex((p) => p.id === photo.id));
  const current = list[idx] ?? photo;
  const [added, setAdded] = useState(false);

  useEffect(() => setAdded(false), [current.id]);

  const go = (d) => setIdx((i) => (i + d + list.length) % list.length);

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal__box" onClick={(e) => e.stopPropagation()}>
        <button className="modal__close" onClick={onClose}><X size={20} /></button>
        <div className="modal__stage">
          <button className="modal__nav modal__nav--l" onClick={() => go(-1)}><ChevronLeft size={22} /></button>
          <div className="modal__imgwrap">
            <img src={current.img} alt={current.evento} draggable={false} onContextMenu={(e) => e.preventDefault()} />
            <WatermarkOverlay large count={42} cols={7} />
          </div>
          <button className="modal__nav modal__nav--r" onClick={() => go(1)}><ChevronRight size={22} /></button>
        </div>
        <div className="modal__info">
          <Eyebrow>{current.categoria}</Eyebrow>
          <h2>{current.evento}</h2>
          <p className="modal__meta"><Calendar size={13} /> {current.data}</p>

          <div className="pricecard">
            <div className="pricecard__row">
              <div>
                <strong>FOTO DIGITAL</strong>
                <span>Alta resolução · Download digital</span>
              </div>
              <div className="pricecard__price">{BRL(current.preco)}</div>
            </div>
            <button
              className={`btn btn--primary btn--full ${added ? "is-done" : ""}`}
              onClick={() => { addToCart({ ...current, tipo: "foto" }); setAdded(true); }}
            >
              {added ? <>ADICIONADA <Check size={16} /></> : "COMPRAR FOTO"}
            </button>
          </div>

          <div className="pricecard pricecard--alt">
            <div className="pricecard__row">
              <div><strong>PACOTE COM 5 FOTOS</strong><span>Do mesmo evento</span></div>
              <div className="pricecard__price">{BRL(69.9)}</div>
            </div>
            <button className="btn btn--ghost btn--full" onClick={() => addToCart({ ...current, id: current.id + "-pack5", tipo: "Pacote 5 fotos", preco: 69.9 })}>
              COMPRAR PACOTE
            </button>
          </div>
          <div className="pricecard pricecard--alt">
            <div className="pricecard__row">
              <div><strong>PACOTE COMPLETO</strong><span>Todas as fotos do evento</span></div>
              <div className="pricecard__price">{BRL(119.9)}</div>
            </div>
            <button className="btn btn--ghost btn--full" onClick={() => addToCart({ ...current, id: current.id + "-packfull", tipo: "Pacote completo", preco: 119.9 })}>
              COMPRAR PACOTE
            </button>
          </div>

          <div className="modal__share">
            <span>Compartilhar</span>
            <button><InstagramIcon size={15} /></button>
            <button><MessageCircle size={15} /></button>
            <button><FacebookIcon size={15} /></button>
            <button><Link2 size={15} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= CART ================= */

function CartDrawer({ open, onClose, items, updateQty, removeItem, setView }) {
  const total = items.reduce((s, i) => s + i.preco * i.qty, 0);
  const itemCount = items.reduce((s, i) => s + i.qty, 0);
  const packProgress = Math.min(100, (itemCount / 5) * 100);
  return (
    <div className={`drawer ${open ? "is-open" : ""}`}>
      <div className="drawer__backdrop" onClick={onClose} />
      <div className="drawer__panel">
        <div className="drawer__head">
          <h3>
            Carrinho
            {itemCount > 0 && (
              <span className="drawer__meta">
                {itemCount} {itemCount === 1 ? "item" : "itens"}
              </span>
            )}
          </h3>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        {itemCount > 0 && itemCount < 5 && (
          <div className="cartpack" role="status" aria-label={`Pacote de 5 fotos: ${itemCount} de 5 adicionadas`}>
            <span>Pacote 5 fotos — faltam {5 - itemCount}</span>
            <div className="cartpack__bar"><div style={{ width: `${packProgress}%` }} /></div>
          </div>
        )}
        {items.length === 0 ? (
          <div className="drawer__empty">
            <ShoppingBag size={26} strokeWidth={1.3} />
            <p>Seu carrinho está vazio.</p>
          </div>
        ) : (
          <>
            <div className="drawer__items">
              {items.map((it) => (
                <div className="cartrow" key={it.id}>
                  <img src={it.img} alt="" />
                  <div className="cartrow__info">
                    <strong>{it.evento}</strong>
                    <span>{it.tipo === "foto" ? "Foto digital" : it.tipo}</span>
                    <div className="cartrow__qty">
                      <button onClick={() => updateQty(it.id, -1)}><Minus size={12} /></button>
                      <span>{it.qty}</span>
                      <button onClick={() => updateQty(it.id, 1)}><Plus size={12} /></button>
                    </div>
                  </div>
                  <div className="cartrow__right">
                    <span>{BRL(it.preco * it.qty)}</span>
                    <button className="cartrow__remove" onClick={() => removeItem(it.id)}><X size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
            <div className="drawer__foot">
              <div className="drawer__total"><span>Total</span><strong>{BRL(total)}</strong></div>
              <PrimaryBtn style={{ width: "100%", justifyContent: "center" }} onClick={() => { onClose(); setView("checkout"); }}>
                FINALIZAR COMPRA
              </PrimaryBtn>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ================= CHECKOUT ================= */

function Checkout({ items, setView }) {
  const { promotions } = useContent();
  const [done, setDone] = useState(false);
  const [pay, setPay] = useState("pix");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [simulated, setSimulated] = useState(true);
  const [orderId, setOrderId] = useState("");
  const [pixData, setPixData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [whatsapp, setWhatsapp] = useState("");
  const [cpf, setCpf] = useState("");
  const subtotal = items.reduce((s, i) => s + i.preco * i.qty, 0);
  const total = Math.max(0, subtotal - discount);

  useEffect(() => {
    fetch("/api/checkout/config")
      .then((r) => r.json())
      .then((d) => setSimulated(d.simulated))
      .catch(() => setSimulated(true));
  }, []);

  async function applyPromo() {
    setError("");
    const res = await fetch("/api/checkout/promo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ codigo: promoInput, items }),
    });
    const data = await res.json();
    if (!res.ok) {
      setAppliedPromo(null);
      setDiscount(0);
      setError(data.error || "Cupom inválido");
      return;
    }
    setAppliedPromo(data.promo);
    setDiscount(data.discount);
  }

  useEffect(() => {
    if (!orderId || done) return;
    const poll = setInterval(async () => {
      const res = await fetch(`/api/checkout/status/${orderId}`);
      if (!res.ok) return;
      const { order } = await res.json();
      if (order?.status === "approved") {
        setDone(true);
        clearInterval(poll);
      }
    }, 4000);
    return () => clearInterval(poll);
  }, [orderId, done]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const payer = {
      nome: String(fd.get("nome") || ""),
      email: String(fd.get("email") || ""),
      whatsapp: String(fd.get("whatsapp") || ""),
      cpf: String(fd.get("cpf") || ""),
    };

    try {
      const res = await fetch("/api/checkout/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          payer,
          paymentMethod: pay,
          promoCode: appliedPromo?.codigo,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao processar pagamento");

      setOrderId(data.orderId);

      if (data.mode === "simulated" || data.status === "approved") {
        setDone(true);
        return;
      }

      if (data.mode === "redirect" && data.initPoint) {
        window.location.href = data.initPoint;
        return;
      }

      if (data.mode === "pix" && data.pix) {
        setPixData(data.pix);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setLoading(false);
    }
  }

  async function copyPix() {
    if (!pixData?.qrCode) return;
    await navigator.clipboard.writeText(pixData.qrCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (done) {
    return (
      <div className="page page--narrow confirm">
        <Check size={40} strokeWidth={1.4} />
        <h1 className="page__title">Pagamento confirmado!</h1>
        <p className="page__lead">Suas fotografias estarão disponíveis na sua área do cliente.</p>
        <PrimaryBtn onClick={() => setView("cliente")}>IR PARA ÁREA DO CLIENTE</PrimaryBtn>
      </div>
    );
  }

  if (pixData) {
    return (
      <div className="page page--narrow">
        <div className="page__head">
          <Eyebrow>PIX</Eyebrow>
          <h1 className="page__title">Pague com PIX</h1>
          <p className="page__lead">Escaneie o QR Code ou copie o código abaixo. A confirmação é automática.</p>
        </div>
        <div className="pixbox">
          {pixData.qrCodeBase64 && (
            <img className="pixbox__qr" src={`data:image/png;base64,${pixData.qrCodeBase64}`} alt="QR Code PIX" />
          )}
          <div className="pixbox__code">
            <label>Código copia e cola</label>
            <textarea readOnly value={pixData.qrCode || ""} rows={4} />
            <button type="button" className="btn btn--primary btn--sm" onClick={copyPix}>
              {copied ? "COPIADO!" : "COPIAR CÓDIGO"}
            </button>
          </div>
          <p className="form__note">Total: {BRL(total)} — aguardando confirmação…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page page--narrow">
      <div className="page__head">
        <Eyebrow>CHECKOUT</Eyebrow>
        <h1 className="page__title">Finalizar compra</h1>
      </div>
      <form className="form" onSubmit={handleSubmit}>
        <div className="form__grid">
          <label>Nome<input name="nome" required placeholder="Seu nome" /></label>
          <label>E-mail<input name="email" required type="email" placeholder="voce@email.com" /></label>
          <label>WhatsApp
            <MaskedInput mask="phone" name="whatsapp" value={whatsapp} onChange={setWhatsapp} required />
          </label>
          <label>CPF
            <MaskedInput mask="cpf" name="cpf" value={cpf} onChange={setCpf} required />
          </label>
        </div>

        <div className="paymethods">
          {[
            { id: "pix", label: "PIX" },
            { id: "credito", label: "Cartão de crédito" },
            { id: "debito", label: "Cartão de débito" },
          ].map((m) => (
            <button type="button" key={m.id} className={`paymethod ${pay === m.id ? "is-active" : ""}`} onClick={() => setPay(m.id)}>
              {m.label}
            </button>
          ))}
        </div>
        <p className="form__note">
          {simulated
            ? "Modo demonstração — pagamento simulado. Configure Mercado Pago na Vercel para pagamentos reais."
            : "Pagamento seguro via Mercado Pago (PIX, crédito ou débito)."}
        </p>

        {error && <p className="form__note" style={{ color: "var(--accent)" }}>{error}</p>}

        {promotions.length > 0 && (
          <div className="promoapply">
            <label>Cupom de desconto</label>
            <div className="promoapply__row">
              <input
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                placeholder={promotions[0]?.codigo ?? "CÓDIGO"}
              />
              <button type="button" className="btn btn--ghost btn--sm" onClick={applyPromo}>APLICAR</button>
            </div>
            {appliedPromo && (
              <p className="form__note" style={{ color: "var(--accent2)" }}>
                ✓ {appliedPromo.titulo} — desconto de {BRL(discount)}
              </p>
            )}
          </div>
        )}

        <div className="ordersummary">
          {items.map((it) => (
            <div key={it.id} className="ordersummary__row">
              <span>{it.evento} — {it.tipo === "foto" ? "Foto digital" : it.tipo} × {it.qty}</span>
              <span>{BRL(it.preco * it.qty)}</span>
            </div>
          ))}
          {discount > 0 && (
            <div className="ordersummary__row ordersummary__row--discount">
              <span>Desconto ({appliedPromo?.codigo})</span>
              <span>− {BRL(discount)}</span>
            </div>
          )}
          <div className="ordersummary__row ordersummary__row--total"><span>Total</span><span>{BRL(total)}</span></div>
        </div>

        <PrimaryBtn style={{ width: "100%", justifyContent: "center" }} disabled={loading}>
          {loading ? "PROCESSANDO…" : pay === "pix" ? "GERAR PIX" : "PAGAR " + BRL(total)}
        </PrimaryBtn>
      </form>
    </div>
  );
}

/* ================= SERVIÇOS ================= */

function Servicos({ setView }) {
  const { servicos: SERVICOS } = useContent();
  return (
    <div className="page">
      <div className="page__head">
        <Eyebrow>SERVIÇOS</Eyebrow>
        <h1 className="page__title">Contrate um trabalho sob medida</h1>
      </div>
      <div className="servicegrid">
        {SERVICOS.map((s) => (
          <div key={s.nome} className="servicecard">
            <FilmFrame src={img(s.nome, 700, 500)} alt={s.nome} ratio="16/11" />
            <div className="servicecard__body">
              <h3>{s.nome}</h3>
              <p className="servicecard__from">A partir de {BRL(s.desde)}</p>
              <ul>
                <li><Clock size={13} /> {s.duracao}</li>
                <li><ImageIcon size={13} /> {s.entrega}</li>
              </ul>
              <GhostBtn onClick={() => setView("orcamento")} icon={ArrowRight}>SOLICITAR ORÇAMENTO</GhostBtn>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================= ORÇAMENTO ================= */

function Orcamento() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    servico: "Ensaio fotográfico", data: "", local: "", duracao: "2–4h",
    pessoas: "", detalhes: "", video: "Não", edicao: "Sim", contato: "WhatsApp",
  });
  const [sent, setSent] = useState(false);
  const set = (k, v) => setData((d) => ({ ...d, [k]: v }));

  if (sent) {
    return (
      <div className="page page--narrow confirm">
        <Check size={40} strokeWidth={1.4} />
        <h1 className="page__title">Orçamento enviado!</h1>
        <p className="page__lead">
          Bruno vai analisar seu pedido e enviar uma proposta personalizada por {data.contato}.
        </p>
      </div>
    );
  }

  return (
    <div className="page page--narrow">
      <div className="page__head">
        <Eyebrow>ORÇAMENTO</Eyebrow>
        <h1 className="page__title">Peça seu orçamento</h1>
      </div>

      <div className="workflow__steps" style={{ marginBottom: 24 }} role="tablist" aria-label="Etapas do orçamento">
        {[1, 2, 3].map((n) => (
          <button
            key={n}
            type="button"
            role="tab"
            aria-selected={step === n}
            aria-label={`Etapa ${n}: ${n === 1 ? "Serviço" : n === 2 ? "Detalhes" : "Enviar"}`}
            className={`workflow__step ${step === n ? "is-active" : ""} ${step > n ? "is-done" : ""}`}
            onClick={() => setStep(n)}
          >
            <span>{n}</span>{n === 1 ? "Serviço" : n === 2 ? "Detalhes" : "Enviar"}
          </button>
        ))}
      </div>

      <form className="form" onSubmit={(e) => { e.preventDefault(); setSent(true); }}>
        {step === 1 && (
          <>
        <label>Serviço
          <select value={data.servico} onChange={(e) => set("servico", e.target.value)}>
            {["Ensaio fotográfico", "Evento", "Casamento", "Esporte", "Corporativo", "Produto", "Retrato", "Cobertura fotográfica", "Outro"].map((o) => <option key={o}>{o}</option>)}
          </select>
        </label>
        <button type="button" className="btn btn--primary btn--sm" onClick={() => setStep(2)}>Próximo →</button>
          </>
        )}
        {step === 2 && (
          <>
            <div className="form__grid">
              <label>Data<MaskedInput mask="date" value={data.data} onChange={(v) => set("data", v)} /></label>
              <label>Local<input placeholder="Cidade / endereço" value={data.local} onChange={(e) => set("local", e.target.value)} /></label>
            </div>
            <label>Duração
              <div className="pillrow">
                {["Até 2h", "2–4h", "4–8h", "8h+"].map((o) => (
                  <button type="button" key={o} className={`pill ${data.duracao === o ? "is-active" : ""}`} onClick={() => set("duracao", o)}>{o}</button>
                ))}
              </div>
            </label>
            <button type="button" className="btn btn--primary btn--sm" onClick={() => setStep(3)}>Próximo →</button>
          </>
        )}
        {step === 3 && (
          <>
            <div className="form__grid">
              <label>Pessoas<input type="number" min="1" value={data.pessoas} onChange={(e) => set("pessoas", e.target.value)} placeholder="Ex: 50" /></label>
              <label>Contato
                <select value={data.contato} onChange={(e) => set("contato", e.target.value)}>
                  <option>WhatsApp</option><option>E-mail</option>
                </select>
              </label>
            </div>
            <label>Detalhes
              <textarea rows={3} placeholder="Estilo, referências…" value={data.detalhes} onChange={(e) => set("detalhes", e.target.value)} />
            </label>
            <div className="pillrow">
              {["Vídeo", "Edição"].map((label) => {
                const key = label === "Vídeo" ? "video" : "edicao";
                return ["Sim", "Não"].map((o) => (
                  <button type="button" key={`${key}-${o}`} className={`pill ${data[key] === o ? "is-active" : ""}`} onClick={() => set(key, o)}>{label}: {o}</button>
                ));
              })}
            </div>
            <PrimaryBtn style={{ width: "100%", justifyContent: "center" }}>ENVIAR ORÇAMENTO</PrimaryBtn>
          </>
        )}
      </form>
    </div>
  );
}

/* ================= SOBRE ================= */

function Sobre() {
  return (
    <div className="page page--narrow">
      <div className="about about--page">
        <div className="about__img"><img src={img("bruno-portrait-2", 900, 1200)} alt="Bruno Zarath" /></div>
        <div className="about__text">
          <Eyebrow>SOBRE BRUNO</Eyebrow>
          <h1 className="page__title">Bruno Zarath</h1>
          <p>
            Fotógrafo baseado em Curitiba, especializado em cobrir o momento em que o esforço vira
            resultado: a linha de chegada, o ponto de virada de uma partida, o abraço depois do "sim".
            Comecei registrando corridas de amigos e hoje credencio-me em maratonas, campeonatos
            estaduais, festivais e casamentos por toda a região.
          </p>
          <p>
            Meu estilo mistura o corpo em movimento com luz de fim de tarde e cores levemente
            dessaturadas — menos pose, mais instante real. Especialidades: fotografia esportiva,
            cobertura de eventos ao vivo, ensaios autorais e fotografia corporativa.
          </p>
          <p>
            Hoje esta plataforma é onde reúno tudo: portfólio, venda direta das fotos de cada evento,
            orçamentos sob medida e o relacionamento com quem confia em mim para guardar esses
            momentos.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ================= CLIENT AREA ================= */

function ClientArea() {
  const { photos: PHOTOS } = useContent();
  const [tab, setTab] = useState("fotos");
  const pedidos = [
    { id: "000123", evento: "Maratona de Curitiba", status: "Fotos disponíveis", data: "15/08/2026", total: 69.9 },
    { id: "000119", evento: "Festival Sonora", status: "Pagamento aprovado", data: "26/07/2026", total: 19.9 },
  ];
  const minhas = PHOTOS.slice(0, 6);
  return (
    <div className="page">
      <div className="page__head">
        <Eyebrow>ÁREA DO CLIENTE</Eyebrow>
        <h1 className="page__title">Olá, Marina!</h1>
      </div>
      <div className="tabs">
        {[
          ["fotos", "Minhas fotos"], ["pedidos", "Meus pedidos"], ["favoritos", "Favoritos"],
          ["orcamentos", "Orçamentos"], ["dados", "Dados pessoais"],
        ].map(([id, label]) => (
          <button key={id} className={tab === id ? "is-active" : ""} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      {tab === "fotos" && (
        <div className="masonry masonry--wide">
          {minhas.map((p) => (
            <FilmFrame key={p.id} src={p.img} alt="" ratio="4/5" className="masonry__item" watermarked={false}>
              <button type="button" className="filmframe__zoom"><Download size={16} /></button>
            </FilmFrame>
          ))}
        </div>
      )}

      {tab === "pedidos" && (
        <div className="orderlist">
          {pedidos.map((p) => (
            <div key={p.id} className="ordercard">
              <div>
                <strong>Pedido #{p.id}</strong>
                <span>{p.evento} · {p.data}</span>
              </div>
              <span className={`status ${p.status === "Fotos disponíveis" ? "status--ok" : ""}`}>{p.status}</span>
              <span className="ordercard__total">{BRL(p.total)}</span>
              {p.status === "Fotos disponíveis" && <button className="btn btn--sm btn--primary"><Download size={14} /> BAIXAR FOTOS</button>}
            </div>
          ))}
        </div>
      )}

      {tab === "favoritos" && (
        <div className="drawer__empty" style={{ padding: "48px 0" }}>
          <Heart size={26} strokeWidth={1.3} />
          <p>Você ainda não favoritou nenhuma foto.</p>
        </div>
      )}

      {tab === "orcamentos" && (
        <div className="orderlist">
          <div className="ordercard">
            <div><strong>Cobertura de evento</strong><span>Enviado em 03/08/2026</span></div>
            <span className="status">Aguardando proposta</span>
          </div>
        </div>
      )}

      {tab === "dados" && (
        <form className="form" style={{ maxWidth: 480 }}>
          <label>Nome<input defaultValue="Marina Souza" /></label>
          <label>E-mail<input defaultValue="marina@email.com" /></label>
          <label>WhatsApp<input defaultValue="(41) 99999-0000" /></label>
          <GhostBtn>SALVAR ALTERAÇÕES</GhostBtn>
        </form>
      )}
    </div>
  );
}

/* ================= WHATSAPP FLOAT ================= */

function WhatsappFloat() {
  const [open, setOpen] = useState(false);
  const msgs = ["Quero contratar um ensaio.", "Quero orçamento para um evento.", "Quero encontrar minhas fotos."];
  return (
    <div className="wa">
      {open && (
        <div className="wa__panel">
          <strong>Fale com Bruno</strong>
          <p>Olá! Gostaria de saber mais sobre seus serviços.</p>
          {msgs.map((m) => <button key={m}>{m}</button>)}
        </div>
      )}
      <button className="wa__fab" onClick={() => setOpen((o) => !o)}><MessageCircle size={24} /></button>
    </div>
  );
}

/* ================= APP ================= */

export default function BrunoZarathPlatform() {
  const { photos: PHOTOS } = useContent();
  const [view, setView] = useState<ViewState>("home");
  const [cart, setCart] = useState<Array<Record<string, unknown> & { id: string; preco: number; qty: number }>>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [selfieDone, setSelfieDone] = useState(false);
  const [photosFound, setPhotosFound] = useState(0);
  const [modalPhoto, setModalPhoto] = useState<(typeof PHOTOS)[number] | null>(null);
  const [modalList, setModalList] = useState<(typeof PHOTOS)[number][] | null>(null);
  const scrollRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTo(0, 0);
  }, [view]);

  const addToCart = (item) => {
    setCart((c) => {
      const found = c.find((i) => i.id === item.id);
      if (found) return c.map((i) => (i.id === item.id ? { ...i, qty: i.qty + 1 } : i));
      return [...c, { ...item, qty: 1 }];
    });
    setCartOpen(true);
  };
  const updateQty = (id, d) => setCart((c) => c.map((i) => (i.id === id ? { ...i, qty: Math.max(1, i.qty + d) } : i)));
  const removeItem = (id) => setCart((c) => c.filter((i) => i.id !== id));
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const viewName = typeof view === "string" ? view : view.name;

  const eventoId = typeof view === "object" && view.name === "evento" ? view.id : "";
  const buscaPhotoIds = typeof view === "object" && view.name === "busca-resultados" ? view.photoIds : [];

  const openPhoto = (photo, list?: typeof PHOTOS) => {
    setModalPhoto(photo);
    setModalList(list ?? null);
  };

  const modalPhotos = modalList
    ?? (modalPhoto
      ? (viewName === "busca-resultados"
        ? PHOTOS.filter((p) => buscaPhotoIds.includes(p.id))
        : PHOTOS.filter((p) => p.eventoId === modalPhoto.eventoId))
      : []);

  return (
    <div className="bz">
      <Navbar view={viewName} setView={setView} cartCount={cartCount} onOpenCart={() => setCartOpen(true)} />
      <PublicGuideBar cartCount={cartCount} selfieDone={selfieDone} photosFound={photosFound} setView={setView} />

      <main id="app-scroll" className="scrollarea" ref={scrollRef}>
        {viewName === "home" && <Home setView={setView} openPhoto={(p) => openPhoto(p)} />}
        {viewName === "portfolio" && <Portfolio openPhoto={(p) => openPhoto(p)} addToCart={addToCart} />}
        {viewName === "galerias" && <Galerias setView={setView} />}
        {viewName === "evento" && <EventoDetail id={eventoId} setView={setView} addToCart={addToCart} openPhoto={(p) => openPhoto(p)} />}
        {viewName === "busca" && <Busca setView={(v) => {
          if (typeof v === "object" && v.name === "busca-resultados") {
            setSelfieDone(true);
            setPhotosFound(v.photoIds.length);
          }
          setView(v);
        }} />}
        {viewName === "busca-resultados" && (
          <BuscaResultados photoIds={buscaPhotoIds} setView={setView} addToCart={addToCart} openPhoto={(p) => openPhoto(p, PHOTOS.filter((ph) => buscaPhotoIds.includes(ph.id)))} />
        )}
        {viewName === "servicos" && <Servicos setView={setView} />}
        {viewName === "orcamento" && <Orcamento />}
        {viewName === "sobre" && <Sobre />}
        {viewName === "checkout" && <Checkout items={cart} setView={setView} />}
        {viewName === "cliente" && <ClientArea />}

        <Footer setView={setView} />
      </main>

      {modalPhoto && (
        <PhotoModal
          photo={modalPhoto}
          onClose={() => { setModalPhoto(null); setModalList(null); }}
          addToCart={addToCart}
          list={modalPhotos}
        />
      )}

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} items={cart} updateQty={updateQty} removeItem={removeItem} setView={setView} />
      <WhatsappFloat />
    </div>
  );
}

function Footer({ setView }) {
  return (
    <footer className="footer">
      <div className="footer__top">
        <div>
          <span className="nav__brandmark">BZ</span>
          <p>Fotografia esportiva, de eventos e retratos autorais em Curitiba, PR.</p>
        </div>
        <div>
          <h4>Explorar</h4>
          <button onClick={() => setView("portfolio")}>Portfólio</button>
          <button onClick={() => setView("galerias")}>Galerias</button>
          <button onClick={() => setView("servicos")}>Serviços</button>
          <button onClick={() => setView("orcamento")}>Orçamento</button>
        </div>
        <div>
          <h4>Conta</h4>
          <button onClick={() => setView("cliente")}>Área do cliente</button>
          <button onClick={() => { window.location.href = "/admin"; }}>Painel do fotógrafo</button>
        </div>
        <div>
          <h4>Redes</h4>
          <a href="https://www.instagram.com/brunozarath/" target="_blank" rel="noreferrer"><InstagramIcon size={14} /> Instagram</a>
          <span><MessageCircle size={14} /> WhatsApp</span>
        </div>
      </div>
      <div className="footer__bottom">© 2026 Bruno Zarath Fotografia. Todos os direitos reservados.</div>
    </footer>
  );
}
