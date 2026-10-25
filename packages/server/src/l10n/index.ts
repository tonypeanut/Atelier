/**
 * [fork:casa] Capa de traducción de salida. Se activa con la variable de entorno
 * ATELIER_LANG=es; sin ella todo queda como upstream (vietnamita).
 * Se engancha en 3 puntos: svg-writer/dxf-writer (texto de láminas), live.ts (mensajes
 * WS al editor) y la página /so-sanh. No modifica el modelo ni el journal.
 */
import { formatMessage, getRule, type Issue } from "@atelier/core";
import { EXACT, PATTERNS, PHRASES, RULES } from "./es.js";

export type ServerLang = "vi" | "es";

export function serverLang(): ServerLang {
  return process.env.ATELIER_LANG?.toLowerCase() === "es" ? "es" : "vi";
}

const PHRASE_KEYS = Object.keys(PHRASES).sort((a, b) => b.length - a.length);

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Reemplaza fragmentos conocidos (palabras completas) dentro de un texto. */
export function translatePhrases(s: string): string {
  let out = s;
  for (const k of PHRASE_KEYS) {
    if (!out.includes(k)) continue;
    // límites de palabra Unicode: no tocar "tường" dentro de otra palabra
    out = out.replace(new RegExp(`(?<![\\p{L}])${escapeRe(k)}(?![\\p{L}])`, "gu"), PHRASES[k] ?? k);
  }
  return out;
}

/** Traduce un texto visible; si no lo conoce, lo devuelve igual. */
export function translateText(s: string, lang: ServerLang = serverLang()): string {
  if (lang !== "es" || !s) return s;
  const exact = EXACT[s];
  if (exact) return exact;
  for (const [re, rep] of PATTERNS) {
    if (re.test(s)) return translatePhrases(s.replace(re, rep));
  }
  return s;
}

const templateCache = new Map<string, RegExp | null>();

/** Plantilla "Muro {wall} … {detail}." → regex con grupos nombrados para recuperar los valores. */
function templateRegex(tpl: string): RegExp | null {
  if (templateCache.has(tpl)) return templateCache.get(tpl)!;
  let re: RegExp | null = null;
  try {
    const seen = new Set<string>();
    const src = tpl
      .split(/(\{\w+\})/)
      .map((part) => {
        const name = /^\{(\w+)\}$/.exec(part)?.[1];
        if (!name) return escapeRe(part);
        if (seen.has(name)) return `\\k<${name}>`;
        seen.add(name);
        return `(?<${name}>.*?)`;
      })
      .join("");
    re = new RegExp(`^${src}$`, "s");
  } catch {
    re = null;
  }
  templateCache.set(tpl, re);
  return re;
}

/** Mensaje del validador → español, reusando los valores del mensaje original. */
export function translateIssue(issue: Issue, lang: ServerLang = serverLang()): Issue {
  if (lang !== "es") return issue;
  const es = RULES[issue.rule];
  const vi = getRule(issue.rule)?.message;
  if (!es || !vi) return issue;
  const m = templateRegex(vi)?.exec(issue.message);
  if (!m) return issue;
  const values: Record<string, string> = {};
  for (const [k, v] of Object.entries(m.groups ?? {})) values[k] = translatePhrases(translateText(v ?? "", lang));
  return { ...issue, message: formatMessage(es, values) };
}

/** Mensajes WS servidor → editor: solo campos de texto para humanos. */
export function translateWsMessage<T>(msg: T, lang: ServerLang = serverLang()): T {
  if (lang !== "es" || !msg || typeof msg !== "object") return msg;
  const m = msg as Record<string, unknown>;
  let out: Record<string, unknown> | null = null;
  const set = (k: string, v: unknown): void => {
    out ??= { ...m };
    out[k] = v;
  };
  if (typeof m.summary === "string") {
    set("summary", m.summary.split("; ").map((part) => translateText(part, lang)).join("; "));
  }
  if (Array.isArray(m.issues)) set("issues", (m.issues as Issue[]).map((i) => translateIssue(i, lang)));
  if (Array.isArray(m.errors)) set("errors", (m.errors as Issue[]).map((i) => (i?.rule ? translateIssue(i, lang) : i)));
  return (out ?? msg) as T;
}

/** HTML de la página /so-sanh: traduce los fragmentos fijos conocidos. */
export function translateCompareHtml(html: string, lang: ServerLang = serverLang()): string {
  if (lang !== "es") return html;
  const pairs: Array<[string, string]> = [
    ["Khác biệt chính", "Diferencias principales"],
    ["<th>Phòng</th>", "<th>Cuarto</th>"],
    ["<th>Tầng</th>", "<th>Nivel</th>"],
    ["DỰ TOÁN SƠ BỘ", "PRESUPUESTO PRELIMINAR"],
    ["Mặt bằng ", "Planta "],
    [" tường · ", " muros · "],
    [" cửa · ", " vanos · "],
    [" nội thất<", " muebles<"],
    ["chỉ có ở", "solo en"],
    ["Nội thất:", "Muebles:"],
    [" món", " piezas"],
    ["Dự toán:", "Presupuesto:"],
    ["đắt hơn", "más caro"],
    ["rẻ hơn", "más barato"],
    ["Hai phương án gần như trùng nhau về phòng ốc và chi phí.", "Las dos variantes son casi iguales en cuartos y costo."],
  ];
  let out = html;
  for (const [a, b] of pairs) out = out.split(a).join(b);
  return out.replace('lang="vi"', 'lang="es"');
}
