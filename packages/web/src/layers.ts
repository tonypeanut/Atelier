/**
 * [fork:casa] Panel de capas del editor: mostrar/ocultar capas de la planta 2D, categorías
 * del 3D (techos, losas, muros, muebles…) y filtrar por el campo libre `etapa` de cada entidad.
 *
 * Diseño pensado para merges limpios con upstream (docs/FORK.md):
 * - 2D: el SVG del servidor ya agrupa por capa (<g data-layer>) y marca entidades con data-id;
 *   aquí solo se ocultan nodos, observando #paper — plan2d.ts no se toca.
 * - 3D: Scene3D expone setVisibilityFilter() (3 líneas en three3d.ts) y aquí vive la lógica.
 * - Es solo vista: no escribe en el modelo. El estado se recuerda por navegador (localStorage).
 */
import type { Project } from "@atelier/core";
import type { Lang } from "./i18n.js";

/** Capas del SVG de planta que se pueden ocultar (KHUNG, el marco, siempre se ve). */
export const LAYERS_2D = ["TRUC", "TUONG", "CUA", "MAI", "NOI-THAT", "DIM", "TEXT", "HATCH", "UNDERLAY"] as const;
/** Categorías del 3D. */
export const CATS_3D = ["techos", "losas", "muros", "muebles", "cuartos", "escaleras"] as const;
export const NO_ETAPA = "__none";

type Layer2D = (typeof LAYERS_2D)[number];
type Cat3D = (typeof CATS_3D)[number];

export type LayerState = {
  hidden2d: Layer2D[];
  hidden3d: Cat3D[];
  /** null = todas las etapas; si no, solo las listadas (NO_ETAPA = entidades sin etapa). */
  etapas: string[] | null;
};

const EMPTY: LayerState = { hidden2d: [], hidden3d: [], etapas: null };
const STORAGE_KEY = "atelier-layers";

type LabelKey = "btn" | "title" | "h2d" | "h3d" | "hEtapa" | "all" | "none" | "reset" | Layer2D | Cat3D;

const LABELS: Record<Lang, Record<LabelKey, string>> = {
  es: {
    btn: "capas", title: "Mostrar u ocultar capas y filtrar por etapa", h2d: "Planta 2D", h3d: "Vista 3D",
    hEtapa: "Etapa", all: "todas", none: "sin etapa", reset: "mostrar todo",
    TRUC: "Ejes", TUONG: "Muros", CUA: "Puertas y ventanas", MAI: "Techos inclinados", "NOI-THAT": "Muebles",
    DIM: "Cotas", TEXT: "Textos", HATCH: "Rellenos", UNDERLAY: "Calco",
    techos: "Techos y tejabanes", losas: "Losas de piso", muros: "Muros y vanos", muebles: "Muebles",
    cuartos: "Pisos de cuartos", escaleras: "Escaleras",
  },
  en: {
    btn: "layers", title: "Show or hide layers and filter by stage", h2d: "2D plan", h3d: "3D view",
    hEtapa: "Stage", all: "all", none: "no stage", reset: "show all",
    TRUC: "Axes", TUONG: "Walls", CUA: "Doors & windows", MAI: "Pitched roofs", "NOI-THAT": "Furniture",
    DIM: "Dimensions", TEXT: "Text", HATCH: "Hatching", UNDERLAY: "Underlay",
    techos: "Roofs & canopies", losas: "Floor slabs", muros: "Walls & openings", muebles: "Furniture",
    cuartos: "Room floors", escaleras: "Stairs",
  },
  vi: {
    btn: "lớp", title: "Ẩn/hiện lớp và lọc theo giai đoạn", h2d: "Mặt bằng 2D", h3d: "3D",
    hEtapa: "Giai đoạn", all: "tất cả", none: "chưa gán", reset: "hiện tất cả",
    TRUC: "Trục", TUONG: "Tường", CUA: "Cửa", MAI: "Mái", "NOI-THAT": "Nội thất",
    DIM: "Kích thước", TEXT: "Chữ", HATCH: "Hatch", UNDERLAY: "Underlay",
    techos: "Mái + ô văng", losas: "Sàn", muros: "Tường + cửa", muebles: "Nội thất",
    cuartos: "Nền phòng", escaleras: "Thang",
  },
};

// ── lógica pura (testeable sin DOM) ───────────────────────────

type AnyEntity = { id: string; etapa?: unknown; kind?: string; wall?: string };

function entityById(p: Project, id: string): { list: string; e: AnyEntity } | null {
  const lists: Array<[string, AnyEntity[]]> = [
    ["walls", p.walls as AnyEntity[]], ["openings", p.openings as AnyEntity[]], ["slabs", p.slabs as AnyEntity[]],
    ["roofs", ((p as { roofs?: AnyEntity[] }).roofs ?? [])], ["stairs", p.stairs as AnyEntity[]],
    ["rooms", p.rooms as AnyEntity[]], ["furniture", p.furniture as AnyEntity[]],
  ];
  for (const [list, arr] of lists) {
    const e = arr.find((x) => x.id === id);
    if (e) return { list, e };
  }
  return null;
}

/** Etapa normalizada a texto; un vano sin etapa hereda la de su muro. */
export function etapaOf(p: Project, id: string): string {
  const hit = entityById(p, id);
  if (!hit) return NO_ETAPA;
  let v = hit.e.etapa;
  if ((v === undefined || v === null || v === "") && hit.list === "openings" && hit.e.wall) {
    v = entityById(p, hit.e.wall)?.e.etapa;
  }
  return v === undefined || v === null || v === "" ? NO_ETAPA : String(v);
}

/** Categoría 3D de una entidad del modelo (null = no se filtra por categoría). */
export function category3d(p: Project, id: string): Cat3D | null {
  const hit = entityById(p, id);
  if (!hit) return null;
  switch (hit.list) {
    case "walls":
    case "openings":
      return "muros";
    case "slabs":
      return hit.e.kind === "floor" ? "losas" : "techos";
    case "roofs":
      return "techos";
    case "stairs":
      return "escaleras";
    case "rooms":
      return "cuartos";
    case "furniture":
      return "muebles";
    default:
      return null;
  }
}

/** Valores distintos de `etapa` presentes en el modelo, ordenados (sin etapa al final). */
export function etapasIn(p: Project): string[] {
  const ids = [p.walls, p.openings, p.slabs, (p as { roofs?: AnyEntity[] }).roofs ?? [], p.stairs, p.rooms, p.furniture]
    .flat()
    .map((e) => (e as AnyEntity).id);
  const set = new Set(ids.map((id) => etapaOf(p, id)));
  const named = [...set].filter((s) => s !== NO_ETAPA).sort((a, b) => a.localeCompare(b, "es", { numeric: true }));
  return set.has(NO_ETAPA) ? [...named, NO_ETAPA] : named;
}

export function etapaVisible(s: LayerState, etapa: string): boolean {
  return s.etapas === null || s.etapas.includes(etapa);
}

export function visible3d(s: LayerState, p: Project | null, id: string): boolean {
  if (!p) return true;
  const cat = category3d(p, id);
  if (cat && s.hidden3d.includes(cat)) return false;
  return etapaVisible(s, etapaOf(p, id));
}

export function parseState(raw: string | null): LayerState {
  if (!raw) return { ...EMPTY };
  try {
    const v = JSON.parse(raw) as Partial<LayerState>;
    return {
      hidden2d: (v.hidden2d ?? []).filter((x): x is Layer2D => (LAYERS_2D as readonly string[]).includes(x)),
      hidden3d: (v.hidden3d ?? []).filter((x): x is Cat3D => (CATS_3D as readonly string[]).includes(x)),
      etapas: Array.isArray(v.etapas) ? v.etapas.map(String) : null,
    };
  } catch {
    return { ...EMPTY };
  }
}

// ── DOM ───────────────────────────────────────────────────────

type Scene3DLike = { setVisibilityFilter(fn: ((id: string) => boolean) | null): void };

export function initLayers(opts: {
  paper: HTMLElement;
  scene3d: Scene3DLike;
  getModel: () => Project | null;
  lang: Lang;
}): { refresh(): void } {
  const L = LABELS[opts.lang] ?? LABELS.es;
  let state = load();

  injectStyle();
  const panel = document.createElement("div");
  panel.className = "layers-panel";
  panel.hidden = true;
  document.body.appendChild(panel);

  for (const actions of document.querySelectorAll<HTMLElement>(".pane-actions")) {
    const btn = document.createElement("button");
    btn.className = "pane-btn layers-btn";
    btn.textContent = L.btn;
    btn.title = L.title;
    btn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      if (!panel.hidden) return void (panel.hidden = true);
      render();
      const r = btn.getBoundingClientRect();
      panel.hidden = false;
      panel.style.top = `${Math.round(r.bottom + 6)}px`;
      panel.style.left = `${Math.round(Math.max(8, Math.min(r.left, innerWidth - panel.offsetWidth - 8)))}px`;
    });
    actions.prepend(btn);
  }
  document.addEventListener("click", (ev) => {
    if (!panel.hidden && !panel.contains(ev.target as Node)) panel.hidden = true;
  });
  document.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape") panel.hidden = true;
  });

  // el SVG de planta se reemplaza en cada patch → reaplicar al cambiar
  new MutationObserver(() => apply2d()).observe(opts.paper, { childList: true });

  function load(): LayerState {
    try {
      return parseState(localStorage.getItem(STORAGE_KEY));
    } catch {
      return { ...EMPTY };
    }
  }

  function save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // almacenamiento bloqueado — el estado vive solo en esta pestaña
    }
  }

  function apply2d(): void {
    const svg = opts.paper.querySelector("svg");
    if (!svg) return;
    for (const g of svg.querySelectorAll<SVGGElement>("g[data-layer]")) {
      const name = g.dataset.layer ?? "";
      const key = name.startsWith("TUONG") ? "TUONG" : name;
      g.style.display = (state.hidden2d as string[]).includes(key) ? "none" : "";
    }
    const p = opts.getModel();
    for (const el of svg.querySelectorAll<SVGElement>("[data-id]")) {
      const show = !p || etapaVisible(state, etapaOf(p, el.dataset.id ?? ""));
      el.style.display = show ? "" : "none";
    }
  }

  function apply3d(): void {
    const filtering = state.hidden3d.length > 0 || state.etapas !== null;
    opts.scene3d.setVisibilityFilter(filtering ? (id) => visible3d(state, opts.getModel(), id) : null);
  }

  function update(next: LayerState): void {
    state = next;
    save();
    apply2d();
    apply3d();
    render();
  }

  function check(label: string, checked: boolean, onChange: (v: boolean) => void): HTMLLabelElement {
    const row = document.createElement("label");
    const box = document.createElement("input");
    box.type = "checkbox";
    box.checked = checked;
    box.addEventListener("change", () => onChange(box.checked));
    row.append(box, document.createTextNode(` ${label}`));
    return row;
  }

  function section(title: string): HTMLDivElement {
    const s = document.createElement("div");
    s.className = "layers-sec";
    const h = document.createElement("h3");
    h.textContent = title;
    s.appendChild(h);
    panel.appendChild(s);
    return s;
  }

  function toggle<T extends string>(list: T[], item: T, on: boolean): T[] {
    return on ? list.filter((x) => x !== item) : [...list, item];
  }

  function render(): void {
    panel.replaceChildren();
    const s2 = section(L.h2d);
    for (const l of LAYERS_2D) {
      s2.appendChild(check(L[l], !state.hidden2d.includes(l), (on) => update({ ...state, hidden2d: toggle(state.hidden2d, l, on) })));
    }
    const s3 = section(L.h3d);
    for (const c of CATS_3D) {
      s3.appendChild(check(L[c], !state.hidden3d.includes(c), (on) => update({ ...state, hidden3d: toggle(state.hidden3d, c, on) })));
    }
    const p = opts.getModel();
    const etapas = p ? etapasIn(p) : [];
    if (etapas.length > 0) {
      const se = section(L.hEtapa);
      se.appendChild(check(L.all, state.etapas === null, (on) => update({ ...state, etapas: on ? null : [] })));
      for (const e of etapas) {
        const name = e === NO_ETAPA ? L.none : e;
        se.appendChild(
          check(name, etapaVisible(state, e), (on) => {
            const current = state.etapas ?? [...etapas];
            const next = on ? [...current, e] : current.filter((x) => x !== e);
            update({ ...state, etapas: next.length === etapas.length ? null : next });
          }),
        );
      }
    }
    const reset = document.createElement("button");
    reset.className = "pane-btn";
    reset.textContent = L.reset;
    reset.addEventListener("click", () => update({ ...EMPTY }));
    panel.appendChild(reset);
  }

  apply3d();
  return {
    refresh() {
      apply2d();
      apply3d();
    },
  };
}

function injectStyle(): void {
  if (document.getElementById("layers-style")) return;
  const st = document.createElement("style");
  st.id = "layers-style";
  st.textContent = `
.layers-panel{position:fixed;z-index:50;min-width:210px;max-height:70vh;overflow:auto;padding:10px 12px;
  background:var(--go,#262b33);color:var(--chu,#e9e6df);border:1px solid var(--vien,#343b46);border-radius:8px;
  box-shadow:0 8px 24px rgba(0,0,0,.35);font:12px var(--font-ui,system-ui)}
.layers-panel input{accent-color:var(--cham,#6ea0d8)}
.layers-panel h3{margin:8px 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:.04em;opacity:.7}
.layers-panel .layers-sec:first-child h3{margin-top:0}
.layers-panel label{display:block;padding:2px 0;cursor:pointer;white-space:nowrap}
.layers-panel>.pane-btn{margin-top:8px;width:100%}
`;
  document.head.appendChild(st);
}
