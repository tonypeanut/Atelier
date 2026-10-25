/**
 * i18n cho UI editor (doc 09: "tiếng Việt trước, i18n để sẵn khung" — khung đây).
 * - TỰ NHẬN THEO QUỐC GIA (quyết định 13/07/2026): máy ở Việt Nam (múi giờ
 *   Asia/Ho_Chi_Minh/Saigon) hoặc trình duyệt có tiếng Việt → vi; ngoài ra → en.
 *   Không gọi geo-IP — app local, múi giờ + ngôn ngữ trình duyệt là đủ và riêng tư.
 * - Lựa chọn TAY luôn thắng auto: ?lang=… hoặc nút VI/EN (lưu localStorage).
 * - Bản vẽ xuất ra + thông điệp validator/summary từ server vẫn tiếng Việt (v1):
 *   hồ sơ là tài liệu TCVN, còn message server broadcast chung mọi client.
 * Chạy được cả trong Node (test) — localStorage/location được guard.
 */

import { ES } from "./i18n-es.js"; // [fork:casa]

export type Lang = "vi" | "en" | "es"; // [fork:casa] + es

type Dict = Record<string, string>;

const VI: Dict = {
  "app.connecting": "đang kết nối…",
  "conn.on": "trực tiếp",
  "conn.connecting": "đang nối…",
  "conn.off": "mất kết nối — tự nối lại…",
  "view.plan": "Mặt bằng",
  "view.3d": "3D",
  "view.split": "Chia đôi",
  "share.btn": "chia sẻ",
  "share.title": "Copy link CHỈ-XEM gửi người thân — họ thấy live nhưng không sửa được; thu hồi link: POST /share/rotate",
  "share.copied": "Đã copy link chỉ-xem — gửi cho người thân cùng ngắm:\n{url}",
  "share.error": "Không lấy được link chia sẻ — thử tải lại trang.",
  "lang.title": "Switch interface language to English",
  "tool.select": "Chọn / di chuyển — kéo tường, cửa, nội thất; đang kéo gõ số để chốt chính xác; Alt bỏ snap; R xoay nội thất đang chọn",
  "tool.wall": "Vẽ tường — giai đoạn sau",
  "tool.door": "Đặt cửa đi — giai đoạn sau",
  "tool.window": "Đặt cửa sổ — giai đoạn sau",
  "tool.room": "Vẽ phòng — giai đoạn sau",
  "tool.furniture": "Nội thất — mở catalog, chọn món rồi click vào mặt bằng để đặt; Esc/V để thôi",
  "tool.measure": "Đo — giai đoạn sau",
  "tool.locked": "Link chia sẻ chỉ-xem — không sửa được",
  "pane2d.empty": "Đang chờ dự án — Claude sẽ dựng đến đâu, bản vẽ mọc đến đó.",
  "pane2d.hint": "kéo đối tượng — di chuyển · gõ số khi kéo — chốt chính xác · Alt — bỏ snap",
  "fit2d": "khớp khung",
  "fit2d.title": "Khớp bản vẽ vào khung",
  "walk.btn": "đi bộ",
  "walk.title": "Đi bộ trong nhà — WASD di chuyển, chuột nhìn, Shift chạy, Esc thoát",
  "walk.hint": "WASD — di chuyển · chuột — nhìn · Shift — chạy · Esc — thoát",
  "sun.btn": "nắng",
  "sun.title": "Xem nắng theo giờ + tháng (vĩ độ lấy từ brief)",
  "sun.hour": "giờ",
  "sun.month": "tháng",
  "reset3d": "về góc chuẩn",
  "reset3d.title": "Về góc nhìn mặc định",
  "hint3d.orbit": "kéo — xoay · lăn — zoom · chuột phải — trượt",
  "panel.props": "Thuộc tính",
  "panel.issues": "Kiểm tra",
  "props.empty": "Chạm một đối tượng trên bản vẽ để xem thông số.",
  "props.empty.sub": "Kéo để di chuyển — đang kéo thì gõ số là chốt chính xác.",
  "issues.clean": "Bản vẽ sạch — không có vấn đề nào.",
  "issues.pending": "Chưa có kết quả kiểm tra.",
  "footer.levels": "Tầng",
  "footer.revision": "Revision",
  "footer.conn": "Kết nối",
  "footer.claude": "Claude",
  "footer.undo": "Hoàn tác",
  "footer.snap": "Snap",
  "undo.title": "Hoàn tác (Ctrl+Z) — chỉ thao tác của bạn",
  "redo.title": "Làm lại (Ctrl+Y)",
  "snap.title": "Bước lưới snap (mm) — 0 là tắt",
  "toast.claude": "Claude",
  "toast.user": "Bạn",
  "toast.reject": "Bị từ chối",
  "toast.rejectFallback": "Server từ chối thay đổi.",
  "toast.readonly": "Bạn đang xem qua link chia sẻ — chỉ xem, không sửa được.",
  "toast.deleteUnsupported": "Chưa hỗ trợ xóa {kind} từ editor.",
  "viewer.badge": "CHỈ XEM",
  "hud.typing": "⏎ chốt · Esc xóa",
  "hud.typable": "gõ số để chốt chính xác",
  "hud.gap": "khe",
  "catalog.title": "Nội thất",
  "catalog.search": "tìm: giường, sofa, xe máy…",
  "catalog.empty": "Không có asset nào khớp.",
  "catalog.mounted": "treo",
  "kind.wall": "Tường",
  "kind.opening": "Cửa",
  "kind.slab": "Sàn",
  "kind.roof": "Mái",
  "kind.stair": "Thang",
  "kind.room": "Phòng",
  "kind.furniture": "Nội thất",
  "kind.level": "Tầng",
  "note.place": "đặt {label}",
  "note.rotate": "xoay {id}",
  "note.delete": "xóa {id}",
  "note.drag": "kéo {id}",
  "note.typed": "{id}: gõ {value}",
  "note.prop": "sửa {id}.{field}",
  "note.undo": "hoàn tác: {label}",
  "note.redo": "làm lại: {label}",
};

const EN: Dict = {
  "app.connecting": "connecting…",
  "conn.on": "live",
  "conn.connecting": "connecting…",
  "conn.off": "connection lost — retrying…",
  "view.plan": "Plan",
  "view.3d": "3D",
  "view.split": "Split",
  "share.btn": "share",
  "share.title": "Copy a VIEW-ONLY link for family — they see everything live but cannot edit; revoke with POST /share/rotate",
  "share.copied": "View-only link copied — send it to your family:\n{url}",
  "share.error": "Could not fetch the share link — try reloading the page.",
  "lang.title": "Chuyển giao diện sang tiếng Việt",
  "tool.select": "Select / move — drag walls, doors, furniture; type a number while dragging for exact mm; Alt disables snapping; R rotates the selected furniture",
  "tool.wall": "Draw wall — coming later",
  "tool.door": "Place door — coming later",
  "tool.window": "Place window — coming later",
  "tool.room": "Draw room — coming later",
  "tool.furniture": "Furniture — open the catalog, pick an item, then click the plan to place it; Esc/V to stop",
  "tool.measure": "Measure — coming later",
  "tool.locked": "View-only share link — editing disabled",
  "pane2d.empty": "Waiting for a project — the drawing grows as Claude builds.",
  "pane2d.hint": "drag an object — move · type while dragging — exact mm · Alt — no snap",
  "fit2d": "fit view",
  "fit2d.title": "Fit the drawing to the pane",
  "walk.btn": "walk",
  "walk.title": "Walk through the house — WASD to move, mouse to look, Shift to run, Esc to exit",
  "walk.hint": "WASD — move · mouse — look · Shift — run · Esc — exit",
  "sun.btn": "sun",
  "sun.title": "Sun study by hour + month (latitude from the brief)",
  "sun.hour": "hour",
  "sun.month": "month",
  "reset3d": "reset view",
  "reset3d.title": "Back to the default camera",
  "hint3d.orbit": "drag — orbit · wheel — zoom · right-drag — pan",
  "panel.props": "Properties",
  "panel.issues": "Checks",
  "props.empty": "Tap an object on the drawing to see its numbers.",
  "props.empty.sub": "Drag to move — type a number while dragging for exact mm.",
  "issues.clean": "Drawing is clean — no issues.",
  "issues.pending": "No check results yet.",
  "footer.levels": "Floor",
  "footer.revision": "Revision",
  "footer.conn": "Link",
  "footer.claude": "Claude",
  "footer.undo": "Undo",
  "footer.snap": "Snap",
  "undo.title": "Undo (Ctrl+Z) — your own actions only",
  "redo.title": "Redo (Ctrl+Y)",
  "snap.title": "Snap grid step (mm) — 0 disables",
  "toast.claude": "Claude",
  "toast.user": "You",
  "toast.reject": "Rejected",
  "toast.rejectFallback": "The server rejected the change.",
  "toast.readonly": "You are on a view-only share link — look, don't touch.",
  "toast.deleteUnsupported": "Deleting {kind} from the editor is not supported yet.",
  "viewer.badge": "VIEW ONLY",
  "hud.typing": "⏎ commit · Esc clear",
  "hud.typable": "type a number for exact mm",
  "hud.gap": "gap",
  "catalog.title": "Furniture",
  "catalog.search": "search: bed, sofa, motorbike…",
  "catalog.empty": "No matching assets.",
  "catalog.mounted": "wall-mounted",
  "kind.wall": "Wall",
  "kind.opening": "Opening",
  "kind.slab": "Slab",
  "kind.roof": "Roof",
  "kind.stair": "Stair",
  "kind.room": "Room",
  "kind.furniture": "Furniture",
  "kind.level": "Floor",
  "note.place": "place {label}",
  "note.rotate": "rotate {id}",
  "note.delete": "delete {id}",
  "note.drag": "drag {id}",
  "note.typed": "{id}: typed {value}",
  "note.prop": "edit {id}.{field}",
  "note.undo": "undo: {label}",
  "note.redo": "redo: {label}",
};

const DICTS: Record<Lang, Dict> = { vi: VI, en: EN, es: ES }; // [fork:casa] + es

export const DICT_KEYS = Object.keys(VI);
export const DICT_EN_KEYS = Object.keys(EN);
export const DICT_ES_KEYS = Object.keys(ES); // [fork:casa]

export type DetectInput = {
  /** ?lang trong URL. */
  query?: string | null;
  /** Lựa chọn tay đã lưu (localStorage). */
  saved?: string | null;
  /** Múi giờ máy — Asia/Ho_Chi_Minh/Saigon = đang ở Việt Nam. */
  timeZone?: string | null;
  /** Danh sách ngôn ngữ trình duyệt. */
  languages?: readonly string[];
};

/** Chọn ngôn ngữ — THUẦN, test được: tay (query > saved) thắng auto (VN → vi, ngoài → en). */
export function detectLang(input: DetectInput): Lang {
  if (input.query === "en" || input.query === "vi" || input.query === "es") return input.query; // [fork:casa] + es
  if (input.saved === "en" || input.saved === "vi" || input.saved === "es") return input.saved; // [fork:casa] + es
  if (input.timeZone === "Asia/Ho_Chi_Minh" || input.timeZone === "Asia/Saigon") return "vi";
  if (input.languages?.some((l) => l?.toLowerCase().startsWith("vi"))) return "vi";
  if (input.languages?.[0]?.toLowerCase().startsWith("es")) return "es"; // [fork:casa] navegador en español
  return "en";
}

function detect(): Lang {
  let query: string | null = null;
  if (typeof location !== "undefined") {
    query = new URLSearchParams(location.search).get("lang");
    if (query === "en" || query === "vi" || query === "es") { // [fork:casa] + es
      try {
        localStorage.setItem("atelier-lang", query);
      } catch {
        // storage bị chặn — vẫn dùng được trong phiên
      }
    }
  }
  let saved: string | null = null;
  try {
    saved = typeof localStorage !== "undefined" ? localStorage.getItem("atelier-lang") : null;
  } catch {
    // ignore
  }
  let timeZone: string | null = null;
  try {
    timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? null;
  } catch {
    // ignore
  }
  const languages =
    typeof navigator !== "undefined"
      ? [navigator.language, ...(navigator.languages ?? [])].filter(Boolean)
      : [];
  return detectLang({ query, saved, timeZone, languages });
}

export const LANG: Lang = detect();

/** Tra từ điển theo ngôn ngữ CHỈ ĐỊNH — nuôi test không phụ thuộc môi trường. */
export function translate(lang: Lang, key: string, params?: Record<string, string | number>): string {
  let s = DICTS[lang][key] ?? VI[key] ?? key;
  if (params) for (const [k, v] of Object.entries(params)) s = s.split(`{${k}}`).join(String(v));
  return s;
}

export function t(key: string, params?: Record<string, string | number>): string {
  return translate(LANG, key, params);
}

/** Áp từ điển lên DOM tĩnh: [data-i18n] → textContent, [data-i18n-title] → title. */
export function applyDom(root: ParentNode = document): void {
  for (const el of root.querySelectorAll<HTMLElement>("[data-i18n]")) {
    el.textContent = t(el.dataset.i18n!);
  }
  for (const el of root.querySelectorAll<HTMLElement>("[data-i18n-title]")) {
    el.title = t(el.dataset.i18nTitle!);
  }
}

export function toggleLang(): void {
  try {
    localStorage.setItem("atelier-lang", nextLang(LANG)); // [fork:casa] ciclo es → en → vi
  } catch {
    // ignore
  }
  // giữ nguyên đường dẫn (kể cả /xem/<token>), bỏ ?lang cũ để localStorage cầm lái
  const url = new URL(location.href);
  url.searchParams.delete("lang");
  location.href = url.toString();
}

/** [fork:casa] Orden del botón de idioma: es → en → vi → es. */
export function nextLang(l: Lang): Lang {
  return l === "es" ? "en" : l === "en" ? "vi" : "es";
}
