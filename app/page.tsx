"use client";
import { useState, useEffect, useRef } from "react";
import {
  CalendarDays,
  ChefHat,
  ShoppingBasket,
  Dumbbell,
  ChartNoAxesCombined,
  Settings,
  Check,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ArrowRight,
  RefreshCw,
  Footprints,
  Droplets,
  Moon,
  Plus,
  Leaf,
  Sun,
  WifiOff,
  X,
  Download,
  SlidersHorizontal,
  Heart,
  ShieldCheck,
  Utensils,
  Flame,
} from "lucide-react";
import {
  seedPlan,
  generateMenu,
  generateShopping,
  swapFood,
  replaceFood,
  foodCompatibility,
  foodForMeal,
  slots,
  monday,
  dateForDay,
  type Plan,
  type Diet,
  type Meal,
} from "../lib/engine";
import { initial, migrateState, toggleMealLog, type State } from "../lib/state";
import { FoodProfile } from "../components/FoodProfile";
import { FoodOptions } from "../components/FoodOptions";
import { FoodSafetyEditor } from "../components/FoodSafetyEditor";
import { Kitchen } from "../components/Kitchen";
import {
  prepareBatch,
  composeWeeklyMenu,
  type RecipeOption,
} from "../lib/kitchen";
import { Purchases } from "../components/Purchases";
import { BodyComposition } from "../components/BodyComposition";
import { ProfessionalSummary } from "../components/ProfessionalSummary";
import { mergeBodyScans } from "../lib/body";
import { connectCloud } from "../lib/cloud";
import type { SupabaseClient } from "@supabase/supabase-js";
const days = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const labUnits: Record<string, string> = {
  Triglicéridos: "mg/dL",
  HDL: "mg/dL",
  Insulina: "µUI/mL",
  HOMA: "índice",
  Glucosa: "mg/dL",
  HbA1c: "%",
  "Vitamina D": "ng/mL",
};
const routines: Record<string, string[]> = {
  A: [
    "Sentadilla goblet",
    "Press de pecho",
    "Remo con mancuerna",
    "Peso muerto rumano",
    "Plancha (segundos)",
  ],
  B: [
    "Zancadas",
    "Press de hombros",
    "Jalón al pecho",
    "Puente de glúteos",
    "Dead bug",
  ],
};
function download(name: string, data: unknown) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(
    new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
  );
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}
export default function Home() {
  const [cloud, setCloud] = useState<SupabaseClient | null>(null);
  const [demo, setDemo] = useState(false);
  const [shareBody, setShareBody] = useState(false);
  const [previewBody, setPreviewBody] = useState(false);
  useEffect(() => {
    connectCloud()
      .then(setCloud)
      .catch(() => {});
  }, []);
  const [s, setS] = useState<State>(initial),
    [ready, setReady] = useState(false),
    [tab, setTab] = useState("Semana"),
    [day, setDay] = useState((new Date().getDay() + 6) % 7),
    [week, setWeek] = useState(monday()),
    [modal, setModal] = useState(""),
    [notice, setNotice] = useState(""),
    [online, setOnline] = useState(true),
    [sync, setSync] = useState("Solo en este dispositivo"),
    [routine, setRoutine] = useState("A"),
    [email, setEmail] = useState(""),
    [user, setUser] = useState(""),
    [links, setLinks] = useState<any[]>([]),
    [summary, setSummary] = useState<any>(null),
    [linkCode, setLinkCode] = useState("");
  const current = useRef(s);
  current.current = s;
  const stamp = useRef("");
  const dirty = useRef(false);
  const syncBusy = useRef(false);
  const notify = (message: string) => setNotice(message);
  const update = (fn: (prev: State) => State) => {
    dirty.current = true;
    setS((p) => ({ ...fn(p), revision: p.revision + 1 }));
  };
  useEffect(() => {
    try {
      const stored = localStorage.getItem("mi-semana");
      if (stored) setS(migrateState(JSON.parse(stored)));
      dirty.current = localStorage.getItem("mi-semana-dirty") === "1";
      stamp.current = localStorage.getItem("mi-semana-stamp") || "";
    } catch {
      setNotice(
        "No pudimos abrir el respaldo local. Exporta tus datos antes de borrar el almacenamiento.",
      );
    }
    setReady(true);
    setOnline(navigator.onLine);
    const on = () => setOnline(navigator.onLine);
    window.addEventListener("online", on);
    window.addEventListener("offline", on);
    if ("serviceWorker" in navigator)
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", on);
    };
  }, []);
  useEffect(() => {
    if (!ready) return;
    document.documentElement.dataset.theme = s.dark ? "dark" : "light";
    document.documentElement.style.fontSize = s.large ? "19px" : "16px";
    if (s.consent) {
      try {
        localStorage.setItem("mi-semana", JSON.stringify(s));
        localStorage.setItem("mi-semana-dirty", dirty.current ? "1" : "0");
      } catch {
        notify("Almacenamiento lleno: exporta tus datos para conservarlos.");
      }
    }
  }, [s, ready]);
  useEffect(() => {
    if (!cloud) return;
    const selectAccount = (id: string) => {
      const owner = localStorage.getItem("mi-semana-owner");
      if (owner && owner !== id) {
        dirty.current = false;
        stamp.current = "";
        setS(initial());
        localStorage.removeItem("mi-semana");
        localStorage.removeItem("mi-semana-dirty");
        localStorage.removeItem("mi-semana-stamp");
      }
      if (id) localStorage.setItem("mi-semana-owner", id);
      else localStorage.removeItem("mi-semana-owner");
      setUser(id);
    };
    cloud.auth
      .getSession()
      .then(({ data }) => selectAccount(data.session?.user.id || ""));
    const { data } = cloud.auth.onAuthStateChange((_e, session) =>
      selectAccount(session?.user.id || ""),
    );
    return () => data.subscription.unsubscribe();
  }, [cloud]);
  async function synchronize() {
    if (
      !cloud ||
      !user ||
      !online ||
      !current.current.consent ||
      syncBusy.current
    )
      return;
    syncBusy.current = true;
    try {
      setSync("Sincronizando…");
      const { data, error } = await cloud!
        .from("app_states")
        .select("data,updated_at")
        .eq("user_id", user)
        .maybeSingle();
      if (error) throw error;
      if (data && data.updated_at !== stamp.current && dirty.current) {
        setSync("Conflicto: exporta ambos dispositivos antes de continuar");
        return;
      }
      if (data && !dirty.current) {
        setS(migrateState(data.data));
        stamp.current = data.updated_at;
      } else if (dirty.current || !data) {
        const state = current.current;
        const time = new Date().toISOString();
        const q = data
          ? cloud
              .from("app_states")
              .update({ data: state, updated_at: time })
              .eq("user_id", user)
              .eq("updated_at", data.updated_at)
              .select()
          : cloud
              .from("app_states")
              .insert({ user_id: user, data: state, updated_at: time })
              .select();
        const r = await q;
        if (r.error) throw r.error;
        if (!r.data?.length)
          throw Error("Los datos cambiaron en otro dispositivo.");
        stamp.current = r.data[0].updated_at;
        if (current.current.revision === state.revision) dirty.current = false;
      }
      localStorage.setItem("mi-semana-stamp", stamp.current);
      localStorage.setItem("mi-semana-dirty", dirty.current ? "1" : "0");
      setSync(dirty.current ? "Cambios pendientes" : "Sincronizado");
    } catch (e: any) {
      setSync("Pendiente de sincronizar");
      notify(e.message || "Reintenta la conexión.");
    } finally {
      syncBusy.current = false;
    }
  }
  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(synchronize, 900);
    return () => clearTimeout(timer);
  }, [s.revision, user, online, ready]);
  useEffect(() => {
    if (!modal && (s.consent || demo)) return;
    const previous = document.activeElement as HTMLElement | null;
    const dialog = document.querySelector(".modal");
    const focusables = (): HTMLElement[] =>
      Array.from(
        dialog?.querySelectorAll<HTMLElement>("button,input,select,a[href]") ||
          [],
      ).filter((el) => !(el as HTMLButtonElement).disabled);
    focusables()[0]?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape" && (s.consent || demo)) setModal("");
      if (e.key === "Tab") {
        const list = focusables();
        const first = list[0],
          last = list[list.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      previous?.focus?.();
    };
  }, [modal, s.consent, demo]);
  useEffect(() => {
    if (!s.reminders.enabled) return;
    const timer = setInterval(() => {
      const now = new Date();
      const time = now.toTimeString().slice(0, 5);
      const key = "notice-" + now.toDateString();
      if (time === s.reminders.time && localStorage.getItem(key) !== "1") {
        localStorage.setItem(key, "1");
        navigator.serviceWorker?.ready.then((reg) =>
          reg.showNotification("Mi Semana", {
            body: "Un momento para tu caminata y tu próximo hábito.",
            icon: "/icon.svg",
          }),
        );
      }
    }, 30000);
    return () => clearInterval(timer);
  }, [s.reminders]);
  let menu: Meal[] = s.menus[week] || [];
  let menuError = "";
  try {
    if (!menu.length) menu = composeWeeklyMenu(s.plan, 0, week);
  } catch (e: any) {
    menuError = e.message;
  }
  const outdatedMenu = menu.some(
    (m) =>
      !s.checks[`${dateForDay(week, m.day)}-meal-${m.slot}`] &&
      m.foods.some((x) => !foodForMeal(x.food, s.plan, m.slot).compatible),
  );
  const date = dateForDay(week, day);
  const meals = menu.filter((m) => m.day === day);
  const countDay = (d: number) =>
    [
      ...slots.map((_, i) => `${dateForDay(week, d)}-meal-${i}`),
      `${dateForDay(week, d)}-walk-0`,
      `${dateForDay(week, d)}-walk-1`,
    ].filter((k) => s.checks[k]).length;
  const done = days.reduce((n, _, i) => n + countDay(i), 0);
  const percent = Math.round((done / 49) * 100);
  const toggle = (key: string) => {
    try {
      const next = toggleMealLog(current.current, key);
      update(() => next);
    } catch (e: any) {
      notify(e.message);
    }
  };

  const changeWeek = (n: number) => {
    const d = new Date(week + "T12:00:00");
    d.setDate(d.getDate() + n * 7);
    setWeek(monday(d));
  };
  const regenerate = (plan = s.plan) => {
    try {
      const m = composeWeeklyMenu(plan, s.revision + 1, week).map((meal) =>
        s.checks[`${dateForDay(week, meal.day)}-meal-${meal.slot}`]
          ? s.menus[week]?.find(
              (old) => old.day === meal.day && old.slot === meal.slot,
            ) || meal
          : meal,
      );
      update((p) => ({ ...p, plan, menus: { ...p.menus, [week]: m } }));
      notify("Minuta y compras actualizadas. Tus registros se conservan.");
      return true;
    } catch (e: any) {
      notify(e.message);
      return false;
    }
  };
  const refreshLinks = async () => {
    if (!cloud || !user) return;
    const r = await cloud!.from("nutritionist_links").select("*");
    if (r.error) notify(r.error.message);
    else setLinks(r.data || []);
  };
  if (!ready) return <div className="loading">Preparando tu semana…</div>;
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="/" aria-label="Mi Semana, inicio">
          <span className="brand-icon">
            <Check size={24} />
          </span>
          mi semana<span className="brand-dot">.</span>
        </a>
        <div className="workspace-label">TU ESPACIO PERSONAL</div>
        <nav aria-label="Navegación principal">
          {[
            ["Semana", CalendarDays],
            ["Cocina", ChefHat],
            ["Compras", ShoppingBasket],
            ["Entrenar", Dumbbell],
            ["Progreso", ChartNoAxesCombined],
          ].map(([name, Icon]: any) => (
            <button
              key={name}
              className={tab === name ? "nav-item active" : "nav-item"}
              onClick={() => setTab(name)}
            >
              <Icon size={21} />
              <span>{name}</span>
              {tab === name && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <Leaf size={23} />
          <strong>Un hábito a la vez.</strong>
          <p>Los pequeños pasos también cuentan.</p>
        </div>
        <button
          className="nav-item settings"
          onClick={() => setModal("Ajustes")}
        >
          <Settings size={20} />
          Mi plan y ajustes
        </button>
        <div className="profile">
          <span className="avatar">
            {s.profile.name?.slice(0, 1).toUpperCase() || "M"}
          </span>
          <div>
            <strong>{s.profile.name || "Mi espacio"}</strong>
            <small>{user ? "Cuenta conectada" : "Modo local"}</small>
          </div>
          <button
            className="icon-button"
            aria-label="Abrir perfil"
            onClick={() => setModal("Perfil")}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </aside>
      <main>
        <header className="topbar">
          <span className="breadcrumb">
            Mi espacio <span>/</span> {tab}
          </span>
          <div className="top-actions">
            <span className="connection">
              {!online ? (
                <>
                  <WifiOff size={14} />
                  Sin conexión
                </>
              ) : (
                <>
                  <i />
                  {demo
                    ? "Demo temporal · sin guardado"
                    : user
                      ? sync
                      : "Guardado en este dispositivo"}
                </>
              )}
            </span>
            <button
              className="icon-button"
              aria-label="Cambiar tema"
              onClick={() => update((p) => ({ ...p, dark: !p.dark }))}
            >
              {s.dark ? <Sun size={19} /> : <Moon size={19} />}
            </button>
            <button
              className="mobile-settings icon-button"
              aria-label="Ajustes"
              onClick={() => setModal("Ajustes")}
            >
              <Settings size={20} />
            </button>
          </div>
        </header>
        <div className="content">
          <section className="page-heading">
            <div>
              <div className="eyebrow">TU BIENESTAR, PASO A PASO</div>
              <h1>
                {tab === "Semana"
                  ? s.profile.name
                    ? `Vamos con tu semana, ${s.profile.name.split(" ")[0]}.`
                    : "Una semana para sentirte mejor."
                  : tab === "Compras"
                    ? "Tu compra, organizada para el mes."
                    : tab === "Cocina"
                      ? "Lo que tienes, convertido en comida."
                      : tab === "Entrenar"
                        ? "Haz espacio para moverte."
                        : "Tu progreso tiene historia."}
              </h1>
              <p>
                {tab === "Semana"
                  ? "Come a tu ritmo. Muévete un poco. Celebra lo que sí hiciste."
                  : tab === "Compras"
                    ? "Envases para la despensa y reposiciones semanales de frescos."
                    : tab === "Cocina"
                      ? "Opciones para hoy, despensa y preparación de la semana."
                      : tab === "Entrenar"
                        ? "Más fuerza para tu día a día, una sesión a la vez."
                        : "Mira tus cambios con perspectiva, sin compararte."}
              </p>
            </div>
            <button
              className="button outline"
              onClick={() => {
                setModal("Plan");
              }}
            >
              <SlidersHorizontal size={16} />
              Ver mi plan
            </button>
          </section>
          {tab !== "Compras" && (
            <>
              {" "}
              <section className="week-banner">
                <div className="week-intro">
                  <span className="pill">
                    <i /> EN MARCHA
                  </span>
                  <h2>Lo que haces hoy, suma.</h2>
                  <p>
                    No necesitas una semana perfecta. Solo seguir volviendo.
                  </p>
                  <div className="week-caption">
                    <CalendarDays size={16} />
                    {new Date(week + "T12:00:00").toLocaleDateString("es-CL", {
                      day: "numeric",
                      month: "long",
                    })}{" "}
                    —{" "}
                    {new Date(
                      dateForDay(week, 6) + "T12:00:00",
                    ).toLocaleDateString("es-CL", {
                      day: "numeric",
                      month: "long",
                    })}
                  </div>
                </div>
                <div className="ring-block">
                  <div
                    className="ring"
                    role="img"
                    aria-label={`${percent}% de cumplimiento semanal`}
                  >
                    <svg viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r="50" className="ring-track" />
                      <circle
                        cx="60"
                        cy="60"
                        r="50"
                        className="ring-value"
                        strokeDasharray={`${percent * 3.1416} 314.16`}
                      />
                    </svg>
                    <strong>
                      {percent}
                      <span>%</span>
                    </strong>
                  </div>
                  <div>
                    <strong>Tu semana va sumando</strong>
                    <p>{done} de 49 hábitos registrados</p>
                    <span>El progreso también es volver a empezar.</span>
                  </div>
                </div>
              </section>
              <div className="week-toolbar">
                <div className="segmented">
                  <button
                    className="icon-button"
                    aria-label="Semana anterior"
                    onClick={() => changeWeek(-1)}
                  >
                    <ChevronLeft size={17} />
                  </button>
                  <span>
                    Semana del{" "}
                    {new Date(week + "T12:00:00").toLocaleDateString("es-CL", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                  <button
                    className="icon-button"
                    aria-label="Semana siguiente"
                    onClick={() => changeWeek(1)}
                  >
                    <ChevronRight size={17} />
                  </button>
                </div>
                <button
                  className="text-button"
                  onClick={() => {
                    setWeek(monday());
                    setDay((new Date().getDay() + 6) % 7);
                  }}
                >
                  Volver a hoy <ArrowRight size={15} />
                </button>
              </div>
            </>
          )}
          {menuError && (
            <div className="scope-note" role="alert">
              {menuError}
            </div>
          )}
          {outdatedMenu && tab !== "Compras" && (
            <div className="scope-note">
              <strong>Esta minuta corresponde a filtros anteriores.</strong>
              <p>
                Revisa las opciones antes de registrar comidas o preparar la
                compra.
              </p>
              <button className="button outline" onClick={() => regenerate()}>
                Actualizar esta semana con mis filtros
              </button>
            </div>
          )}
          {tab === "Semana" && (
            <>
              <div
                className="day-strip"
                role="group"
                aria-label="Días de la semana"
              >
                {days.map((d, i) => (
                  <button
                    key={d}
                    className={day === i ? "day active" : "day"}
                    onClick={() => setDay(i)}
                    aria-pressed={day === i}
                  >
                    <span>{d}</span>
                    <strong>
                      {new Date(dateForDay(week, i) + "T12:00:00").getDate()}
                    </strong>
                    <span className="day-status">
                      {countDay(i) === 7 ? (
                        <Check size={12} />
                      ) : (
                        <i className={countDay(i) > 0 ? "some" : ""} />
                      )}
                    </span>
                  </button>
                ))}
              </div>
              <div className="two-columns">
                <section>
                  <div className="section-title">
                    <div>
                      <h2>Tu alimentación de hoy</h2>
                      <p>Porciones que se adaptan a ti.</p>
                    </div>
                    <span className="small-badge">
                      {countDay(day) -
                        Number(!!s.checks[`${date}-walk-0`]) -
                        Number(!!s.checks[`${date}-walk-1`])}{" "}
                      / 5 comidas
                    </span>
                  </div>
                  <button
                    className="button outline kitchen-quick"
                    onClick={() => setTab("Cocina")}
                  >
                    <ChefHat size={18} />
                    ¿Qué puedo comer con lo que tengo?
                  </button>
                  <div className="meal-list">
                    {meals.map((m) => {
                      const key = `${date}-meal-${m.slot}`;
                      return (
                        <article
                          className={
                            "meal-card " + (s.checks[key] ? "completed" : "")
                          }
                          key={m.id}
                        >
                          <button
                            className="meal-check"
                            aria-label={`${s.checks[key] ? "Desmarcar" : "Completar"} ${slots[m.slot]}`}
                            aria-pressed={!!s.checks[key]}
                            onClick={() => toggle(key)}
                          >
                            {s.checks[key] ? <Check size={19} /> : <span />}
                          </button>
                          <div className="meal-body">
                            <div className="meal-meta">
                              {slots[m.slot]}
                              <span>
                                {
                                  ["08:00", "11:00", "13:30", "17:00", "20:00"][
                                    m.slot
                                  ]
                                }
                              </span>
                            </div>
                            <h3>
                              {m.recipeTitle ||
                                m.foods
                                  .slice(0, 2)
                                  .map((x) => x.food.name)
                                  .join(" + ") ||
                                "Sin porciones asignadas"}
                            </h3>
                            <p>
                              {m.foods
                                .map(
                                  (x) =>
                                    `${x.food.quantity * x.portions} ${x.food.unit} de ${x.food.name.toLowerCase()}`,
                                )
                                .join(" · ")}
                            </p>
                            <div className="portion-tags">
                              {m.foods.map((x) => (
                                <span key={x.food.id}>
                                  {x.portions} {x.food.group.toLowerCase()}
                                </span>
                              ))}
                            </div>
                          </div>
                          <button
                            className="icon-button exchange"
                            aria-label={`Cambiar alimentos de ${slots[m.slot]}`}
                            onClick={() => {
                              if (s.checks[key]) {
                                notify(
                                  "Desmarca la comida antes de cambiar lo que registraste.",
                                );
                                return;
                              }
                              setModal("Cambiar " + m.id);
                            }}
                          >
                            <RefreshCw size={16} />
                          </button>
                        </article>
                      );
                    })}
                  </div>
                  <button
                    className="regenerate text-button"
                    onClick={() => regenerate()}
                  >
                    <RefreshCw size={15} />
                    Generar otra minuta semanal
                  </button>
                </section>
                <aside className="right-column">
                  <section className="card movement">
                    <div className="card-icon">
                      <Footprints size={21} />
                    </div>
                    <h2>Un paseo hace bien.</h2>
                    <p>Unos minutos después de comer. A tu ritmo, sin apuro.</p>
                    {["Después de almuerzo", "Después de cena"].map(
                      (label, i) => (
                        <button
                          className="walk-row"
                          key={label}
                          onClick={() => toggle(`${date}-walk-${i}`)}
                          aria-pressed={!!s.checks[`${date}-walk-${i}`]}
                        >
                          <span>
                            <strong>{label}</strong>
                            <small>10–15 minutos</small>
                          </span>
                          <span
                            className={
                              "mini-check " +
                              (s.checks[`${date}-walk-${i}`] ? "checked" : "")
                            }
                          >
                            {s.checks[`${date}-walk-${i}`] && (
                              <Check size={16} />
                            )}
                          </span>
                        </button>
                      ),
                    )}
                  </section>
                  <section className="card daily-basics">
                    <h2>También cuida de ti</h2>
                    <div className="basic-row">
                      <Droplets size={22} />
                      <div>
                        <strong>Agua</strong>
                        <small>{s.water[date] || 0} vasos registrados</small>
                      </div>
                      <button
                        className="icon-button"
                        aria-label="Quitar vaso de agua"
                        onClick={() =>
                          update((p) => ({
                            ...p,
                            water: {
                              ...p.water,
                              [date]: Math.max(0, (p.water[date] || 0) - 1),
                            },
                          }))
                        }
                      >
                        −
                      </button>
                      <button
                        className="icon-button"
                        aria-label="Registrar vaso de agua"
                        onClick={() =>
                          update((p) => ({
                            ...p,
                            water: {
                              ...p.water,
                              [date]: (p.water[date] || 0) + 1,
                            },
                          }))
                        }
                      >
                        <Plus size={17} />
                      </button>
                    </div>
                    <div className="basic-row">
                      <Moon size={21} />
                      <div>
                        <strong>Descanso</strong>
                        <small>Horas de sueño</small>
                      </div>
                      <input
                        aria-label="Horas de sueño"
                        type="number"
                        min="0"
                        max="24"
                        step="0.5"
                        value={s.sleep[date] ?? ""}
                        placeholder="—"
                        onChange={(e) => {
                          const n = Number(e.target.value);
                          if (n >= 0 && n <= 24)
                            update((p) => ({
                              ...p,
                              sleep: { ...p.sleep, [date]: n },
                            }));
                        }}
                      />
                    </div>
                  </section>
                  <section className="education">
                    <div className="eyebrow">
                      <Leaf size={15} /> ALGO PARA RECORDAR
                    </div>
                    <h3>Tu cintura cuenta una historia.</h3>
                    <p>
                      Medirla en condiciones similares ayuda a seguir los
                      cambios en la grasa abdominal. Es un dato más para
                      conversar con tu profesional, junto con tus exámenes.
                    </p>
                    <a
                      href="https://www.niddk.nih.gov/health-information/diabetes/overview/what-is-diabetes/prediabetes-insulin-resistance"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Fuente: NIDDK <ArrowUpRight size={13} />
                    </a>
                  </section>
                  <button
                    className="consult-link"
                    onClick={() => {
                      setModal("Compartir");
                      refreshLinks();
                    }}
                  >
                    <Heart size={18} />
                    <span>
                      Tu profesional, en el mismo equipo
                      <small>Compartir mi progreso</small>
                    </span>
                    <ArrowUpRight size={17} />
                  </button>
                </aside>
              </div>
            </>
          )}
          {tab === "Cocina" && (
            <Kitchen
              formatOverrides={Object.fromEntries(
                Object.entries(
                  s.purchaseBaskets[`month:${s.shoppingStart}`]?.items || {},
                )
                  .filter(([, edit]) => edit.format)
                  .map(([id, edit]) => [id, edit.format!]),
              )}
              plan={s.plan}
              pantry={s.pantry}
              batches={s.preparedBatches}
              date={date}
              meals={menu}
              onDate={(value) => {
                setWeek(monday(new Date(value + "T12:00:00")));
                setDay((new Date(value + "T12:00:00").getDay() + 6) % 7);
              }}
              onPantry={(pantry) => update((p) => ({ ...p, pantry }))}
              onBatches={(preparedBatches) =>
                update((p) => ({ ...p, preparedBatches }))
              }
              onPurchases={() => setTab("Compras")}
              onUse={(option) => {
                const key = `${date}-meal-${option.meal.slot}`;
                if (s.checks[key]) {
                  notify(
                    "Desmarca la comida antes de cambiar lo que registraste.",
                  );
                  return;
                }
                update((p) => ({
                  ...p,
                  menus: {
                    ...p.menus,
                    [week]: (
                      p.menus[week] || composeWeeklyMenu(p.plan, 0, week)
                    ).map((m) =>
                      m.day === day && m.slot === option.meal.slot
                        ? {
                            ...option.meal,
                            id: m.id,
                            day,
                            recipeTitle: option.title,
                          }
                        : m,
                    ),
                  },
                }));
                setTab("Semana");
                notify(
                  "Opción elegida. Marca la comida cuando la hayas realizado.",
                );
              }}
              onPrepare={(meal, details) => {
                try {
                  const result = prepareBatch(
                    meal,
                    current.current.pantry,
                    details,
                  );
                  update((p) => ({
                    ...p,
                    pantry: result.pantry,
                    preparedBatches: [...p.preparedBatches, result.batch],
                  }));
                } catch (e: any) {
                  notify(e.message);
                }
              }}
            />
          )}
          {tab === "Compras" && (
            <Purchases
              plan={s.plan}
              pantry={s.pantry}
              batches={s.preparedBatches}
              checks={s.checks}
              menus={s.menus}
              start={s.shoppingStart}
              baskets={s.purchaseBaskets}
              manual={s.manual}
              onStart={(shoppingStart) =>
                update((p) => ({ ...p, shoppingStart }))
              }
              onBasket={(key, basket) =>
                update((p) => ({
                  ...p,
                  purchaseBaskets: { ...p.purchaseBaskets, [key]: basket },
                }))
              }
              onManual={(item) =>
                update((p) => ({ ...p, manual: [...p.manual, item] }))
              }
            />
          )}
          {tab === "Entrenar" && (
            <div className="two-columns">
              <section className="card">
                <div className="section-title">
                  <div>
                    <span className="eyebrow blue">
                      FUERZA · CICLO DE 12 SEMANAS
                    </span>
                    <h2>Cuerpo completo</h2>
                    <p>
                      Plantilla orientativa. Adapta técnica y cargas con tu
                      entrenador.
                    </p>
                  </div>
                  <Dumbbell className="blue" />
                </div>
                <div className="routine-switch">
                  {["A", "B"].map((r) => (
                    <button
                      className={
                        routine === r ? "button blue-button" : "button outline"
                      }
                      onClick={() => setRoutine(r)}
                      key={r}
                    >
                      Rutina {r}
                    </button>
                  ))}
                </div>
                {routines[routine].map((ex) => {
                  const previous = s.sets
                    .filter((x) => x.exercise === ex)
                    .slice(-1)[0];
                  const today = s.sets.filter(
                    (x) => x.exercise === ex && x.date === date,
                  );
                  return (
                    <div className="exercise" key={ex}>
                      <h3>{ex}</h3>
                      <p>
                        3 series ·{" "}
                        {ex.includes("Plancha")
                          ? "20–40 segundos"
                          : "8–12 repeticiones"}
                        {previous &&
                          ` · Último: ${previous.kg} kg × ${previous.reps}`}
                      </p>
                      {today.length >= 3 &&
                        today
                          .slice(-3)
                          .every(
                            (x) => x.reps >= (ex.includes("Plancha") ? 40 : 12),
                          ) && (
                          <div className="success-note">
                            Completaste el rango. Considera un aumento pequeño
                            si mantienes una buena técnica.
                          </div>
                        )}
                      <form
                        className="set-form"
                        onSubmit={(e) => {
                          e.preventDefault();
                          const d = new FormData(e.currentTarget);
                          update((p) => ({
                            ...p,
                            sets: [
                              ...p.sets,
                              {
                                date,
                                routine,
                                exercise: ex,
                                kg: Number(d.get("kg")),
                                reps: Number(d.get("reps")),
                              },
                            ],
                          }));
                          notify("Serie registrada.");
                        }}
                      >
                        <label>
                          Kg
                          <input
                            name="kg"
                            type="number"
                            min="0"
                            max="500"
                            step="0.5"
                            defaultValue={previous?.kg || 0}
                            required
                          />
                        </label>
                        <label>
                          {ex.includes("Plancha") ? "Segundos" : "Reps"}
                          <input
                            name="reps"
                            type="number"
                            min="1"
                            max="120"
                            defaultValue={previous?.reps || 8}
                            required
                          />
                        </label>
                        <button className="button outline">
                          Registrar serie
                        </button>
                      </form>
                      <div className="portion-tags">
                        {today.map((x, i) => (
                          <span key={i}>
                            Serie {i + 1}: {x.kg} kg × {x.reps}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </section>
              <aside>
                <section className="card">
                  <span className="eyebrow blue">TU RECORRIDO</span>
                  <h2>12 semanas de constancia</h2>
                  {[
                    "1–4 · Familiarización",
                    "5–8 · Progresión",
                    "9–12 · Consolidación",
                  ].map((x, i) => (
                    <div className="phase" key={x}>
                      <span>{i + 1}</span>
                      <div>
                        <strong>{x}</strong>
                        <p>
                          {
                            [
                              "Aprende los movimientos y encuentra cargas cómodas.",
                              "Aumenta gradualmente si completas el rango.",
                              "Mantén la técnica y revisa tu progreso.",
                            ][i]
                          }
                        </p>
                      </div>
                    </div>
                  ))}
                </section>
                <section className="education">
                  <h3>La fuerza también es salud.</h3>
                  <p>
                    La actividad física ayuda al cuerpo a responder mejor a la
                    insulina. Elige movimientos que puedas sostener y consulta
                    las adaptaciones que necesites.
                  </p>
                  <a
                    href="https://www.cdc.gov/diabetes/about/insulin-resistance-type-2-diabetes.html"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Fuente: CDC <ArrowUpRight size={13} />
                  </a>
                </section>
              </aside>
            </div>
          )}
          {tab === "Progreso" && (
            <div className="two-columns">
              <section>
                <BodyComposition
                  scans={s.bodyScans}
                  canImport={s.consent}
                  onSave={(scans) => {
                    update((p) => ({
                      ...p,
                      bodyScans: mergeBodyScans(p.bodyScans, scans),
                    }));
                    notify("Exámenes de composición corporal guardados.");
                  }}
                />
                <div className="card">
                  <div className="section-title">
                    <div>
                      <h2>Tu cintura, en perspectiva</h2>
                      <p>Registro semanal · centímetros</p>
                    </div>
                    <button
                      className="button"
                      onClick={() => setModal("Medición")}
                    >
                      <Plus size={17} />
                      Registrar
                    </button>
                  </div>
                  {s.measurements.length ? (
                    <>
                      <div className="metric">
                        <strong>
                          {
                            [...s.measurements]
                              .sort((a, b) => a.date.localeCompare(b.date))
                              .at(-1)?.waist
                          }
                        </strong>
                        <span>cm · última medición</span>
                      </div>
                      <ProgressChart
                        values={[...s.measurements]
                          .sort((a, b) => a.date.localeCompare(b.date))
                          .map((x) => ({ label: x.date, value: x.waist }))}
                      />
                      <h3>Peso · kilogramos</h3>
                      <ProgressChart
                        label="Peso en kilogramos"
                        values={[...s.measurements]
                          .sort((a, b) => a.date.localeCompare(b.date))
                          .map((x) => ({ label: x.date, value: x.weight }))}
                      />
                      <table>
                        <thead>
                          <tr>
                            <th>Fecha</th>
                            <th>Cintura</th>
                            <th>Peso</th>
                            <th>Grasa</th>
                            <th>Visceral</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...s.measurements]
                            .sort((a, b) => b.date.localeCompare(a.date))
                            .map((x, i) => (
                              <tr key={i}>
                                <td>{x.date}</td>
                                <td>{x.waist} cm</td>
                                <td>{x.weight} kg</td>
                                <td>{x.fat ? `${x.fat}%` : "—"}</td>
                                <td>{x.visceral ?? "—"}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </>
                  ) : (
                    <div className="empty-state">
                      <ChartNoAxesCombined size={36} />
                      <h3>Tu primer registro es el punto de partida.</h3>
                      <p>
                        Mide tu cintura y tu peso. Aquí verás cómo cambian con
                        el tiempo.
                      </p>
                      <button
                        className="button outline"
                        onClick={() => setModal("Medición")}
                      >
                        Agregar primera medición
                      </button>
                    </div>
                  )}
                </div>
                <div className="card lab-card">
                  <div className="section-title">
                    <div>
                      <h2>Exámenes</h2>
                      <p>Compara tus resultados con tu profesional.</p>
                    </div>
                    <button
                      className="icon-button"
                      aria-label="Registrar examen"
                      onClick={() => setModal("Examen")}
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                  {s.labs.length ? (
                    s.labs.map((x, i) => (
                      <div className="lab-row" key={i}>
                        <div>
                          <strong>{x.type}</strong>
                          <small>
                            {x.date} · revisar desde{" "}
                            {new Date(
                              new Date(x.date + "T12:00:00").getTime() +
                                84 * 86400000,
                            ).toLocaleDateString("es-CL")}
                          </small>
                        </div>
                        <span>
                          {x.value} {x.unit}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p>
                      Aún no hay exámenes. Puedes agregarlos cuando los tengas.
                    </p>
                  )}
                </div>
              </section>
              <aside>
                <section className="card">
                  <h2>Tu constancia semanal</h2>
                  <div className="metric">
                    <strong>{percent}%</strong>
                  </div>
                  <p>
                    {done} de 49 comidas y caminatas. Agua y sueño se registran
                    por separado.
                  </p>
                  <div className="week-bars">
                    {days.map((d, i) => (
                      <div key={d}>
                        <span
                          style={{
                            height: Math.max(4, (countDay(i) / 7) * 90),
                          }}
                        />
                        <small>{d}</small>
                      </div>
                    ))}
                  </div>
                  <p>Una semana difícil no borra lo que ya hiciste.</p>
                  <button
                    className="button outline"
                    onClick={() => window.print()}
                  >
                    <Download size={16} />
                    Guardar semana como PDF
                  </button>
                </section>
                <section className="education">
                  <h3>Los triglicéridos pueden cambiar.</h3>
                  <p>
                    La alimentación, el movimiento y otras condiciones influyen
                    en sus niveles. Revisa los resultados con tu profesional: no
                    reemplazan una evaluación médica.
                  </p>
                  <a
                    href="https://www.nhlbi.nih.gov/health/high-blood-triglycerides"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Fuente: NHLBI <ArrowUpRight size={13} />
                  </a>
                </section>
              </aside>
            </div>
          )}
          <footer>
            <ShieldCheck size={15} />
            <span>
              Tu plan acompaña tu tratamiento. No reemplaza a tu médico ni a tu
              nutricionista.
            </span>
            <span className="footer-brand">Hecho para avanzar a tu ritmo.</span>
          </footer>
        </div>
      </main>
      {notice && (
        <div className="toast" role="status">
          {notice}
          <button
            className="icon-button"
            aria-label="Cerrar aviso"
            onClick={() => setNotice("")}
          >
            <X size={17} />
          </button>
        </div>
      )}
      {((!s.consent && !demo) || modal) && (
        <div className="modal-backdrop">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label={
              s.consent || demo ? modal : "Bienvenida y consentimiento"
            }
          >
            <div className="modal-head">
              <h2>
                {!s.consent && !demo
                  ? "Bienvenido a Mi Semana"
                  : modal === "Perfil"
                    ? "Alimentación y restricciones"
                    : modal.startsWith("Cambiar")
                      ? "Intercambios por porción"
                      : modal}
              </h2>
              {(s.consent || demo) && (
                <button
                  className="icon-button"
                  aria-label="Cerrar ventana"
                  onClick={() => setModal("")}
                >
                  <X size={21} />
                </button>
              )}
            </div>
            {!(s.consent || demo) && (
              <>
                <div className="welcome-symbol">
                  <Leaf size={30} />
                </div>
                <h3>Un espacio para tus hábitos.</h3>
                <p>
                  Registra tu plan, tu movimiento y tus cambios. Sin calorías ni
                  culpa.
                </p>
                <p>
                  La demo usa un plan ilustrativo que debe revisar tu
                  nutricionista. Tus datos se guardan en este navegador. Solo se
                  sincronizan al activar el servicio de cuentas e iniciar
                  sesión.
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const d = new FormData(e.currentTarget);
                    update((p) => ({
                      ...p,
                      consent: true,
                      profile: {
                        ...p.profile,
                        name: String(d.get("name") || ""),
                      },
                    }));
                  }}
                >
                  <label>
                    ¿Cómo te llamas? (opcional)
                    <input name="name" placeholder="Tu nombre" maxLength={40} />
                  </label>
                  <label className="consent">
                    <input type="checkbox" required />
                    Soy mayor de 18 años y autorizo guardar mis datos de salud
                    para mostrar mi plan y progreso. Puedo exportarlos o
                    eliminarlos desde Ajustes. No se venden mis datos.
                  </label>
                  <button className="button full">
                    Comenzar mi semana <ArrowRight size={17} />
                  </button>
                </form>
                <button
                  className="text-button"
                  onClick={() => {
                    setDemo(true);
                    setNotice(
                      "Demo temporal: puedes explorar; los cambios no se guardan al cerrar.",
                    );
                  }}
                >
                  Explorar demo sin guardar <ArrowRight size={16} />
                </button>
              </>
            )}
            {(s.consent || demo) && modal === "Plan" && (
              <>
                <button
                  className="button outline"
                  onClick={() => setModal("Perfil")}
                >
                  Tipo de alimentación y restricciones
                </button>
                <PlanEditor
                  plan={s.plan}
                  onSave={(p) => {
                    regenerate(p);
                    setModal("");
                  }}
                />
              </>
            )}
            {(s.consent || demo) &&
              modal.startsWith("Cambiar") &&
              menu.find((x) => x.id === modal.split(" ")[1]) && (
                <FoodOptions
                  meal={menu.find((x) => x.id === modal.split(" ")[1])!}
                  plan={s.plan}
                  onSelect={(oldId, newId) => {
                    try {
                      const next = menu.map((m) =>
                        m.id === modal.split(" ")[1]
                          ? replaceFood(m, oldId, newId, s.plan)
                          : m,
                      );
                      update((p) => ({
                        ...p,
                        menus: { ...p.menus, [week]: next },
                      }));
                      notify(
                        "Opción elegida. Se conservan las porciones del grupo.",
                      );
                    } catch (e: any) {
                      notify(e.message);
                    }
                  }}
                />
              )}
            {(s.consent || demo) && modal === "Ajustes" && (
              <>
                <div className="settings-grid">
                  <button
                    className="button outline"
                    onClick={() => setModal("Perfil")}
                  >
                    Alimentación y restricciones
                  </button>
                  <button
                    className="button outline"
                    onClick={() => setModal("Plan")}
                  >
                    Plan por porciones
                  </button>
                  <button
                    className="button outline"
                    onClick={() => {
                      setModal("Compartir");
                      refreshLinks();
                    }}
                  >
                    Nutricionista y cuenta
                  </button>
                  <button
                    className="button outline"
                    onClick={() => update((p) => ({ ...p, large: !p.large }))}
                  >
                    Texto {s.large ? "normal" : "grande"}
                  </button>
                </div>
                <h3>Recordatorio diario</h3>
                <p>
                  Con la app abierta se muestra una notificación a la hora
                  elegida. Las notificaciones con la app cerrada requieren un
                  servicio de envío aún no conectado.
                </p>
                <label>
                  Hora
                  <input
                    type="time"
                    value={s.reminders.time}
                    onChange={(e) =>
                      update((p) => ({
                        ...p,
                        reminders: { ...p.reminders, time: e.target.value },
                      }))
                    }
                  />
                </label>
                <button
                  className="button outline"
                  onClick={async () => {
                    if (!("Notification" in window)) {
                      notify("Este navegador no ofrece notificaciones.");
                      return;
                    }
                    const permission = await Notification.requestPermission();
                    update((p) => ({
                      ...p,
                      reminders: {
                        ...p.reminders,
                        enabled:
                          permission === "granted" && !p.reminders.enabled,
                      },
                    }));
                    notify(
                      permission === "granted"
                        ? "Preferencia actualizada."
                        : "Puedes cambiar el permiso en tu navegador.",
                    );
                  }}
                >
                  {s.reminders.enabled ? "Desactivar" : "Activar"} recordatorios
                </button>
                <h3>Mis datos</h3>
                <p>
                  {sync}. El almacenamiento local puede borrarse con los datos
                  del navegador; exporta un respaldo.
                </p>
                <div className="settings-grid">
                  <button
                    className="button outline"
                    onClick={() => download("mi-semana-respaldo.json", s)}
                  >
                    <Download size={16} />
                    Exportar datos
                  </button>
                  <button
                    className="button outline"
                    onClick={() => window.print()}
                  >
                    Exportar semana PDF
                  </button>
                  <button
                    className="button danger"
                    onClick={async () => {
                      if (
                        !confirm(
                          "¿Eliminar tu cuenta conectada y todos los datos locales? Esta acción no se puede deshacer.",
                        )
                      )
                        return;
                      if (cloud && user) {
                        const r = await cloud!.rpc("delete_my_account");
                        if (r.error) {
                          notify(r.error.message);
                          return;
                        }
                        await cloud!.auth.signOut();
                      }
                      localStorage.removeItem("mi-semana");
                      localStorage.removeItem("mi-semana-dirty");
                      localStorage.removeItem("mi-semana-stamp");
                      dirty.current = false;
                      setS(initial());
                      setModal("");
                    }}
                  >
                    Eliminar cuenta y datos
                  </button>
                </div>
                <p className="fineprint">
                  La implementación incluye consentimiento, control de acceso y
                  borrado. La operación con pacientes requiere revisión legal,
                  responsable de tratamiento, política de retención y
                  configuración de infraestructura.
                </p>
              </>
            )}
            {(s.consent || demo) && modal === "Perfil" && (
              <FoodProfile
                plan={s.plan}
                onPersonal={() => setModal("Datos personales")}
                onSave={(plan) => {
                  if (regenerate(plan)) {
                    update((p) => ({
                      ...p,
                      profile: { ...p.profile, diet: plan.diet },
                    }));
                    setModal("");
                  }
                }}
              />
            )}
            {(s.consent || demo) && modal === "Datos personales" && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const d = new FormData(e.currentTarget);
                  const diet = s.plan.diet;
                  const objective = String(d.get("objective"));
                  update((p) => ({
                    ...p,
                    profile: {
                      name: String(d.get("name")),
                      diet,
                      objective,
                      height: Number(d.get("height")),
                    },
                  }));
                  regenerate({
                    ...s.plan,
                    diet,
                    objective,
                    version: s.plan.version + 1,
                  });
                  setModal("");
                }}
              >
                <label>
                  Nombre
                  <input
                    name="name"
                    defaultValue={s.profile.name}
                    maxLength={40}
                  />
                </label>
                <label>
                  Objetivo
                  <select name="objective" defaultValue={s.profile.objective}>
                    {[
                      "Mejorar triglicéridos",
                      "Mejorar respuesta a la insulina",
                      "Bajar grasa abdominal",
                      "Mantener",
                    ].map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </label>

                <label>
                  Altura (cm)
                  <input
                    name="height"
                    type="number"
                    min="100"
                    max="250"
                    defaultValue={s.profile.height}
                    required
                  />
                </label>
                <button className="button full">
                  Guardar perfil y actualizar minuta
                </button>
                <p>
                  No fijamos metas calóricas ni una velocidad de pérdida de
                  peso. Acuerda las metas con tu profesional.
                </p>
              </form>
            )}
            {(s.consent || demo) && modal === "Medición" && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const d = new FormData(e.currentTarget);
                  const waist = Number(d.get("waist")),
                    weight = Number(d.get("weight"));
                  if (waist < 40 || waist > 200 || weight < 35 || weight > 250)
                    notify(
                      "El valor está fuera del rango habitual de registro. Comprueba la unidad y consulta a tu profesional.",
                    );
                  update((p) => ({
                    ...p,
                    measurements: [
                      ...p.measurements.filter((x) => x.date !== d.get("date")),
                      {
                        date: String(d.get("date")),
                        waist,
                        weight,
                        fat: Number(d.get("fat")) || undefined,
                        visceral: Number(d.get("visceral")) || undefined,
                      },
                    ],
                  }));
                  setModal("");
                }}
              >
                <label>
                  Fecha
                  <input name="date" type="date" defaultValue={date} required />
                </label>
                <div className="form-grid">
                  <label>
                    Cintura (cm)
                    <input
                      name="waist"
                      type="number"
                      min="20"
                      max="300"
                      step="0.1"
                      required
                    />
                  </label>
                  <label>
                    Peso (kg)
                    <input
                      name="weight"
                      type="number"
                      min="20"
                      max="500"
                      step="0.1"
                      required
                    />
                  </label>
                  <label>
                    Grasa corporal (%) · opcional
                    <input
                      name="fat"
                      type="number"
                      min="1"
                      max="75"
                      step="0.1"
                    />
                  </label>
                  <label>
                    Grasa visceral · opcional
                    <input
                      name="visceral"
                      type="number"
                      min="1"
                      max="100"
                      step="0.1"
                    />
                  </label>
                </div>
                <p>
                  Mide la cintura a la misma hora y en condiciones similares.
                  Usa el valor visceral tal como aparece en tu informe InBody.
                </p>
                <button className="button full">Guardar medición</button>
              </form>
            )}
            {(s.consent || demo) && modal === "Examen" && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const d = new FormData(e.currentTarget);
                  const type = String(d.get("type")),
                    value = Number(d.get("value"));
                  if (
                    (type === "Triglicéridos" && value >= 500) ||
                    (type === "Glucosa" && (value < 70 || value >= 250)) ||
                    (type === "HbA1c" && value >= 10)
                  )
                    notify(
                      "Revisa este resultado pronto con tu profesional. La app no interpreta urgencias ni ajusta tratamientos.",
                    );
                  update((p) => ({
                    ...p,
                    labs: [
                      ...p.labs,
                      {
                        date: String(d.get("date")),
                        type,
                        value,
                        unit: labUnits[type],
                      },
                    ],
                  }));
                  setModal("");
                }}
              >
                <label>
                  Fecha
                  <input type="date" name="date" defaultValue={date} required />
                </label>
                <label>
                  Examen y unidad
                  <select name="type">
                    {Object.entries(labUnits).map(([k, v]) => (
                      <option key={k} value={k}>
                        {k} ({v})
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Resultado
                  <input
                    name="value"
                    type="number"
                    min="0"
                    max="10000"
                    step="0.01"
                    required
                  />
                </label>
                <p>
                  Ingresa solo resultados con la unidad indicada. La fecha de
                  revisión sugerida será 12 semanas después; confirma el plazo
                  con tu profesional.
                </p>
                <button className="button full">Guardar examen</button>
              </form>
            )}
            {(s.consent || demo) && modal === "Compartir" && (
              <>
                <p>
                  La persona profesional necesita una cuenta gratuita y tu
                  código. Tú eliges el alcance y puedes revocar el vínculo; la
                  vista de seguimiento es de solo lectura.
                </p>
                <details className="professional-preview">
                  <summary>
                    Así se verá el seguimiento · vista previa local
                  </summary>
                  <p>Esta vista previa no comparte datos con otra persona.</p>
                  <label className="consent">
                    <input
                      type="checkbox"
                      checked={previewBody}
                      onChange={(e) => setPreviewBody(e.target.checked)}
                    />
                    Incluir composición corporal en la vista previa y en nuevos
                    códigos.
                  </label>
                  <ProfessionalSummary
                    summary={{
                      profile: s.profile,
                      checks: s.checks,
                      measurements: s.measurements,
                      labs: s.labs,
                      bodyShared: previewBody,
                      bodyScans: previewBody ? s.bodyScans : [],
                    }}
                  />
                </details>
                {!cloud ? (
                  <div className="success-note">
                    El seguimiento en línea aún no está activado en esta demo.
                    Puedes guardar un PDF para tu consulta. La autorización por
                    código estará disponible al activar el servicio de cuentas.
                  </div>
                ) : !user ? (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const r = await cloud!.auth.signInWithOtp({
                        email,
                        options: { emailRedirectTo: location.origin },
                      });
                      notify(
                        r.error
                          ? r.error.message
                          : "Enlace solicitado. Revisa tu correo.",
                      );
                    }}
                  >
                    <label>
                      Correo
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </label>
                    <button className="button">Recibir enlace de acceso</button>
                  </form>
                ) : (
                  <>
                    <div className="success-note">
                      Cuenta conectada · {sync}
                    </div>
                    <button className="button outline" onClick={synchronize}>
                      Sincronizar ahora
                    </button>
                    <label className="consent">
                      <input
                        type="checkbox"
                        checked={shareBody}
                        onChange={(e) => setShareBody(e.target.checked)}
                      />
                      Autorizo compartir también mis exámenes de composición
                      corporal con quien canjee este código.
                    </label>
                    <button
                      className="button outline"
                      onClick={async () => {
                        const r = await cloud!.rpc("create_link", {
                          share_composition: shareBody,
                        });
                        if (r.error) notify(r.error.message);
                        else {
                          setLinkCode(r.data);
                          refreshLinks();
                        }
                      }}
                    >
                      Crear código (válido por 24 h)
                    </button>
                    {linkCode && <p className="code">{linkCode}</p>}
                    <form
                      className="inline-form"
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const d = new FormData(e.currentTarget);
                        const r = await cloud!.rpc("claim_link", {
                          code: d.get("code"),
                        });
                        notify(
                          r.error ? r.error.message : "Vinculación creada.",
                        );
                        refreshLinks();
                      }}
                    >
                      <input
                        name="code"
                        aria-label="Código del paciente"
                        placeholder="Soy profesional: código del paciente"
                        required
                      />
                      <button className="button">Vincular</button>
                    </form>
                    {links.map((l) => (
                      <div className="exchange-row" key={l.id}>
                        <span>
                          {l.patient_id === user
                            ? l.professional_id
                              ? "Profesional vinculado"
                              : "Invitación pendiente"
                            : "Paciente vinculado"}
                        </span>
                        {l.patient_id !== user ? (
                          <button
                            className="button outline"
                            onClick={async () => {
                              const r = await cloud!.rpc("patient_summary", {
                                patient: l.patient_id,
                              });
                              if (r.error) notify(r.error.message);
                              else setSummary(r.data);
                            }}
                          >
                            Ver resumen
                          </button>
                        ) : (
                          <button
                            className="button outline"
                            onClick={async () => {
                              await cloud!
                                .from("nutritionist_links")
                                .delete()
                                .eq("id", l.id);
                              refreshLinks();
                            }}
                          >
                            Revocar
                          </button>
                        )}
                      </div>
                    ))}
                    {summary && <ProfessionalSummary summary={summary} />}
                    <button
                      className="text-button"
                      onClick={async () => {
                        await cloud!.auth.signOut();
                        setUser("");
                        setLinks([]);
                        setSummary(null);
                      }}
                    >
                      Cerrar sesión
                    </button>
                  </>
                )}
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
function ProgressChart({
  values,
  label = "Cintura en centímetros",
}: {
  values: { label: string; value: number }[];
  label?: string;
}) {
  const min = Math.min(...values.map((x) => x.value)) - 2,
    max = Math.max(...values.map((x) => x.value)) + 2;
  return (
    <div className="chart">
      <svg
        viewBox="0 0 560 180"
        role="img"
        aria-label={
          label + ": " + values.map((x) => `${x.label}: ${x.value}`).join(", ")
        }
      >
        {[0, 1, 2, 3].map((i) => (
          <g key={i}>
            <line
              x1="45"
              x2="540"
              y1={20 + i * 42}
              y2={20 + i * 42}
              stroke="var(--border)"
            />
            <text x="4" y={24 + i * 42} fill="var(--muted)" fontSize="11">
              {(max - ((max - min) * i) / 3).toFixed(0)}
            </text>
          </g>
        ))}
        <polyline
          points={values
            .map(
              (x, i) =>
                `${45 + (i * 480) / Math.max(1, values.length - 1)},${20 + ((max - x.value) / (max - min)) * 126}`,
            )
            .join(" ")}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="3"
        />
        {values.map((x, i) => (
          <circle
            key={i}
            cx={45 + (i * 480) / Math.max(1, values.length - 1)}
            cy={20 + ((max - x.value) / (max - min)) * 126}
            r="4"
            fill="var(--accent)"
          />
        ))}
      </svg>
    </div>
  );
}
function PlanEditor({
  plan,
  onSave,
}: {
  plan: Plan;
  onSave: (p: Plan) => void;
}) {
  const [p, setP] = useState(() => structuredClone(plan)),
    [error, setError] = useState("");
  return (
    <>
      <p>
        Plan de ejemplo: confirma cantidades y equivalencias con tu
        nutricionista. El editor no calcula ni prescribe calorías.
      </p>
      <div className="plan-table">
        <table>
          <thead>
            <tr>
              <th>Grupo</th>
              <th>Total</th>
              {["Des", "AM", "Alm", "PM", "Cena"].map((x) => (
                <th key={x}>{x}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {p.groups.map((g, i) => (
              <tr key={g.name}>
                <td>{g.name}</td>
                <td>{g.daily}</td>
                {g.distribution.map((n, j) => (
                  <td key={j}>
                    <input
                      aria-label={`${g.name}, ${slots[j]}`}
                      type="number"
                      min="0"
                      max="30"
                      step="0.5"
                      value={n}
                      onChange={(e) => {
                        const next = structuredClone(p);
                        next.groups[i].distribution[j] = Number(e.target.value);
                        next.groups[i].daily = next.groups[
                          i
                        ].distribution.reduce((a, b) => a + b, 0);
                        setP(next);
                      }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h3>Alimentos equivalentes</h3>
      <p>
        La cantidad indicada equivale a una porción de su grupo. Los ejemplos no
        sustituyen un catálogo validado.
      </p>
      {p.foods.map((f, i) => (
        <div className="food-editor" key={f.id}>
          <input
            aria-label={"Nombre de " + f.name}
            value={f.name}
            onChange={(e) => {
              const n = structuredClone(p);
              n.foods[i].name = e.target.value;
              setP(n);
            }}
          />
          <input
            aria-label={"Cantidad por porción de " + f.name}
            type="number"
            min="0.01"
            step="0.01"
            value={f.quantity}
            onChange={(e) => {
              const n = structuredClone(p);
              n.foods[i].quantity = Number(e.target.value);
              setP(n);
            }}
          />
          <span>
            {f.unit} · {f.group}
          </span>
          <FoodSafetyEditor
            food={f}
            onChange={(food) => {
              const n = structuredClone(p);
              n.foods[i] = food;
              setP(n);
            }}
          />
        </div>
      ))}
      <h3>Agregar equivalente</h3>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const d = new FormData(form);
          const group = String(
            d.get("group"),
          ) as Plan["groups"][number]["name"];
          const diets =
            String(d.get("diets")) === "vegano"
              ? (["omnívoro", "vegetariano", "vegano"] as Diet[])
              : String(d.get("diets")) === "vegetariano"
                ? (["omnívoro", "vegetariano"] as Diet[])
                : String(d.get("diets")) === "pescetariano"
                  ? (["omnívoro", "pescetariano"] as Diet[])
                  : (["omnívoro"] as Diet[]);
          setP((prev) => ({
            ...prev,
            foods: [
              ...prev.foods,
              {
                id: crypto.randomUUID(),
                name: String(d.get("name")).trim(),
                group,
                quantity: Number(d.get("quantity")),
                unit: String(d.get("unit")).trim(),
                section: String(d.get("section")),
                diets,
                priority: d.get("priority") === "on",
              },
            ],
          }));
          form.reset();
        }}
      >
        <label>
          Nombre del alimento
          <input name="name" required maxLength={80} />
        </label>
        <div className="form-grid">
          <label>
            Grupo
            <select name="group">
              {p.groups.map((g) => (
                <option key={g.name}>{g.name}</option>
              ))}
            </select>
          </label>
          <label>
            Apto para
            <select name="diets">
              <option>vegano</option>
              <option>vegetariano</option>
              <option>pescetariano</option>
              <option>omnívoro</option>
            </select>
          </label>
          <label>
            Cantidad de una porción
            <input
              name="quantity"
              type="number"
              min="0.01"
              step="0.01"
              required
            />
          </label>
          <label>
            Unidad
            <input
              name="unit"
              placeholder="g, taza, unidad…"
              required
              maxLength={30}
            />
          </label>
        </div>
        <label>
          Sección de compras
          <select name="section">
            {[
              "Despensa",
              "Frutas y verduras",
              "Refrigerados",
              "Panadería",
              "Carnes y pescados",
              "Otros",
            ].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label className="consent">
          <input name="priority" type="checkbox" />
          Integral o legumbre preferente para el generador
        </label>
        <button className="button outline full" type="submit">
          <Plus size={16} />
          Agregar al catálogo del plan
        </button>
      </form>
      <p role="alert">{error}</p>
      <button
        className="button full"
        onClick={() => {
          try {
            if (p.foods.some((f) => !f.name.trim() || f.quantity <= 0))
              throw Error("Revisa nombres y cantidades de los equivalentes.");
            generateMenu(p);
            onSave({ ...p, version: p.version + 1 });
          } catch (e: any) {
            setError(e.message);
          }
        }}
      >
        Guardar plan y generar semana
      </button>
    </>
  );
}
