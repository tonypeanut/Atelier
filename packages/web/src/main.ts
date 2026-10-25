import { areaM2, getAsset, labelEs, nextId, type EntityKind, type Op } from "@atelier/core"; // [fork:casa] + labelEs
import { AppState } from "./state.js";
import { CatalogPanel } from "./catalog-panel.js";
import { Plan2D } from "./plan2d.js";
import { Scene3D } from "./three3d.js";
import { UI } from "./ui.js";
import { WsClient } from "./ws.js";
import { invertOps, UndoStack, type UndoEntry } from "./undo.js";
import { applyDom, LANG, nextLang, t, toggleLang } from "./i18n.js";
import { initLayers } from "./layers.js"; // [fork:casa]

applyDom(); // áp từ điển lên chuỗi tĩnh trong index.html trước khi UI khởi động

/** Link chia sẻ chỉ-xem: /xem/<token> — server cưỡng chế, UI chỉ khóa cho tử tế. */
const VIEW_TOKEN = location.pathname.startsWith("/xem/") ? location.pathname.split("/")[2] ?? null : null;
const READONLY = VIEW_TOKEN != null;

const state = new AppState();
const undoStack = new UndoStack();

/**
 * Hàng đợi op ĐANG BAY của chính mình: gửi xong chờ server phán.
 * - patch origin "user" khớp ops → xác nhận (đẩy undo stack đúng hướng)
 * - reject → hoàn preview + toast lý do (optimistic UI, doc 09)
 */
type Pending = { ops: Op[]; entry: UndoEntry | null; kind: "edit" | "undo" | "redo" };
const pending: Pending[] = [];

function sendOps(ops: Op[], label: string, kind: Pending["kind"]): void {
  if (READONLY) {
    ui.toast("reject", t("toast.readonly"));
    return;
  }
  if (!state.model) return;
  let entry: UndoEntry | null = null;
  if (kind === "edit") {
    const inv = invertOps(state.model, ops);
    entry = inv ? { undo: inv, redo: structuredClone(ops), label } : null;
  }
  pending.push({ ops, entry, kind });
  ws.send({ type: "ops", baseRevision: state.revision, ops, note: label });
}

function syncUndoButtons(): void {
  ui.setUndoState(undoStack.canUndo && pending.length === 0, undoStack.canRedo && pending.length === 0);
}

function doUndo(): void {
  if (pending.length > 0) return; // chờ op trước hạ cánh — tránh base đuổi nhau
  const entry = undoStack.peekUndo();
  if (!entry) return;
  sendOps(structuredClone(entry.undo), t("note.undo", { label: entry.label }), "undo");
  syncUndoButtons();
}

function doRedo(): void {
  if (pending.length > 0) return;
  const entry = undoStack.peekRedo();
  if (!entry) return;
  sendOps(structuredClone(entry.redo), t("note.redo", { label: entry.label }), "redo");
  syncUndoButtons();
}

function deleteSelection(): void {
  const id = state.selection;
  if (!id || !state.model) return;
  const found = state.findEntity(id);
  if (!found) return;
  if (!["wall", "opening", "furniture", "room"].includes(found.entity)) {
    ui.toast("reject", t("toast.deleteUnsupported", { kind: t(`kind.${found.entity}`) }));
    return;
  }
  sendOps([{ op: "delete", entity: found.entity, id }], t("note.delete", { id }), "edit");
  state.select(null);
}

const ui = new UI({
  onLevel: (id) => state.setLevel(id),
  onView: (v) => state.setView(v),
  onIssueClick: (entities) => {
    plan.flash(entities);
    scene3d.flash(entities);
    const first = entities[0];
    if (first) state.select(first);
  },
  onFit2d: () => plan.fit(),
  onReset3d: () => scene3d.resetView(),
  onPropEdit: (entity: EntityKind, id: string, field: string, value: unknown) => {
    sendOps([{ op: "update", entity, id, data: { [field]: value } }], t("note.prop", { id, field }), "edit");
  },
  onUndo: doUndo,
  onRedo: doRedo,
}, { readonly: READONLY });

const plan = new Plan2D(document.getElementById("paper-viewport")!, document.getElementById("paper")!, {
  onSelect: (id) => state.select(id),
  getModel: () => state.model,
  getGrid: () => ui.snapGrid(),
  onDragIds: (ids) => ws.send({ type: "presence", draggingIds: ids, tool: "V" }),
  onCommit: (op, label) => sendOps([op], label, "edit"),
  readonly: READONLY,
  onPlace: (assetId, at) => {
    const m = state.model;
    if (!m || !state.activeLevel) return;
    const asset = getAsset(assetId);
    const id = nextId(m, "F");
    sendOps(
      [{ op: "add", entity: "furniture", data: { id, level: state.activeLevel, asset: assetId, at, rotation: 0 } }],
      t("note.place", { label: (LANG === "es" && asset ? labelEs(asset) : LANG === "en" ? asset?.labelEn : undefined) ?? asset?.label ?? assetId }), // [fork:casa] + es
      "edit",
    );
    // giữ chế độ đặt — đặt liên tiếp tới khi Esc/V
  },
});

const scene3d = new Scene3D(document.getElementById("canvas3d") as HTMLCanvasElement);
// [fork:casa] panel de capas 2D/3D + filtro por etapa
initLayers({ paper: document.getElementById("paper")!, scene3d, getModel: () => state.model, lang: LANG });

const ws = new WsClient({
  onConn: (s) => ui.setConn(s),
  onSnapshot: (m) => state.setSnapshot(m),
  onPatch: (m) => state.applyPatch(m),
  onValidation: (m) => state.setValidation(m),
  onCapture: async (m) => {
    try {
      const png = m.target === "3d" ? scene3d.capture(m.camera) : await plan.capture();
      ws.send({ type: "capture_result", requestId: m.requestId, png });
    } catch (e) {
      ws.send({ type: "capture_result", requestId: m.requestId, error: e instanceof Error ? e.message : String(e) });
    }
  },
  onReject: (m) => {
    pending.shift(); // op của mình vừa bị từ chối (browser chỉ có một nguồn gửi)
    plan.clearPreview();
    ui.toast("reject", m.errors.map((e) => e.message).join(" · ") || "Server từ chối thay đổi.");
    syncUndoButtons();
    if (m.currentRevision > state.revision) ws.resync(); // mirror tụt hậu — xin snapshot tươi
  },
}, VIEW_TOKEN ? `?token=${encodeURIComponent(VIEW_TOKEN)}` : "");

state.on("snapshot", ({ model }) => {
  pending.length = 0;
  undoStack.clear(); // snapshot mới = phiên/dự án mới — stack cũ vô nghĩa
  syncUndoButtons();
  ui.setProject(model.meta.name);
  ui.setRevision(model.meta.revision, false);
  ui.setLevels(model.levels, state.activeLevel);
  scene3d.setModel(model);
  if (state.activeLevel) void plan.show(state.activeLevel, model.meta.revision);
});

state.on("patch", ({ revision, ops, origin, note, summary, changedIds }) => {
  ui.setRevision(revision, true);
  if (!state.model) return;

  // op của chính mình quay về → xác nhận với undo stack
  if (origin === "user" && pending.length > 0 && JSON.stringify(pending[0]!.ops) === JSON.stringify(ops)) {
    const mine = pending.shift()!;
    if (mine.kind === "edit" && mine.entry) undoStack.push(mine.entry);
    else if (mine.kind === "undo") undoStack.confirmUndo();
    else if (mine.kind === "redo") undoStack.confirmRedo();
    syncUndoButtons();
  }

  const affected = scene3d.applyOps(state.model, ops);
  scene3d.flash(affected);
  if (state.activeLevel) {
    void plan.show(state.activeLevel, revision).then(() => plan.flash(changedIds));
  }
  // level mới xuất hiện/mất đi → làm mới tab tầng
  ui.setLevels(state.model.levels, state.activeLevel);
  if (origin === "claude") {
    const what = note ?? summary ?? "cập nhật model";
    ui.toast("claude", what, revision);
    ui.claudeNote(what);
  }
  // panel thuộc tính đang mở đúng entity vừa đổi → làm tươi (trừ khi người dùng đang gõ dở)
  if (state.selection && changedIds.includes(state.selection) && !ui.propsBusy) {
    ui.showEntity(state.findEntity(state.selection), state.selection);
  }
});

state.on("validation", ({ issues }) => ui.setIssues(issues));

state.on("level", ({ level }) => {
  ui.setActiveLevel(level);
  void plan.show(level, state.revision);
});

state.on("view", () => {
  // pane vừa hiện lại có thể chưa từng fit (bị ẩn lúc snapshot đầu)
  requestAnimationFrame(() => {
    plan.ensureFitted();
    scene3d.invalidate();
  });
});

state.on("select", ({ id }) => {
  ui.showEntity(id ? state.findEntity(id) : null, id);
  plan.setSelection(id);
  ws.send({ type: "presence", selection: id ? [id] : [] });
  if (id) {
    plan.flash([id]);
    scene3d.flash([id]);
  }
});

state.on("resync", () => ws.resync());

// ── P5: tool 5 — catalog nội thất, click đặt, R xoay ──────────
const toolSelect = document.getElementById("tool-select") as HTMLButtonElement;
const toolFurniture = document.getElementById("tool-furniture") as HTMLButtonElement;

const catalog = new CatalogPanel(document.getElementById("pane2d")!, (assetId) => {
  plan.setPlacing(assetId);
  toolFurniture.classList.add("is-active");
  toolSelect.classList.remove("is-active");
});

function exitPlacing(): void {
  plan.setPlacing(null);
  catalog.hide();
  toolFurniture.classList.remove("is-active");
  toolSelect.classList.add("is-active");
}

toolFurniture.addEventListener("click", () => {
  if (catalog.visible) {
    exitPlacing();
    return;
  }
  catalog.show();
  toolFurniture.classList.add("is-active");
});
toolSelect.addEventListener("click", exitPlacing);

function rotateSelection(): void {
  const id = state.selection;
  if (!id || !state.model) return;
  const f = state.model.furniture.find((x) => x.id === id);
  if (!f) return;
  sendOps(
    [{ op: "update", entity: "furniture", id, data: { rotation: (f.rotation + 90) % 360 } }],
    t("note.rotate", { id }),
    "edit",
  );
}

// ── P5: đi bộ WASD + sun study ─────────────────────────────────
const walkBtn = document.getElementById("walk3d") as HTMLButtonElement;
const sunBtn = document.getElementById("sun3d") as HTMLButtonElement;
const sunPanel = document.getElementById("sun-controls") as HTMLElement;
const sunHour = document.getElementById("sun-hour") as HTMLInputElement;
const sunMonth = document.getElementById("sun-month") as HTMLInputElement;
const sunHourVal = document.getElementById("sun-hour-val")!;
const sunMonthVal = document.getElementById("sun-month-val")!;
const hint3d = document.getElementById("hint3d")!;
const HINT_ORBIT = t("hint3d.orbit");

/** Điểm xuất phát đi bộ: tâm phòng lớn nhất của tầng đang xem. */
function walkSpawn(): [number, number] | undefined {
  const m = state.model;
  if (!m || !state.activeLevel) return undefined;
  let best: { at: [number, number]; area: number } | null = null;
  for (const r of m.rooms) {
    if (r.level !== state.activeLevel || r.use === "gieng-troi") continue;
    const area = areaM2(r.polygon);
    if (!best || area > best.area) {
      const c = r.polygon.reduce<[number, number]>((s, pt) => [s[0] + pt[0], s[1] + pt[1]], [0, 0]);
      best = { at: [c[0] / r.polygon.length, c[1] / r.polygon.length], area };
    }
  }
  return best?.at;
}

walkBtn.addEventListener("click", () => {
  if (scene3d.walking) {
    scene3d.exitWalk();
    return;
  }
  const m = state.model;
  if (!m) return;
  const level = m.levels.find((l) => l.id === state.activeLevel) ?? m.levels[0];
  if (!level) return;
  scene3d.enterWalk(level, walkSpawn(), () => {
    walkBtn.classList.remove("is-active");
    hint3d.textContent = HINT_ORBIT;
  });
  walkBtn.classList.add("is-active");
  hint3d.textContent = t("walk.hint");
});

let sunOn = false;
function applySun(): void {
  if (!sunOn || !state.model) return;
  const hour = Number(sunHour.value);
  const month = Number(sunMonth.value);
  sunHourVal.textContent = `${Math.floor(hour)}:${hour % 1 ? "30" : "00"}`;
  sunMonthVal.textContent = String(month);
  scene3d.setSun({
    hour, month,
    lat: state.model.brief?.dat?.vi_do ?? 10.8, // mặc định TP.HCM khi brief chưa có vĩ độ
    north: state.model.site.north,
  });
}
sunBtn.addEventListener("click", () => {
  sunOn = !sunOn;
  sunBtn.classList.toggle("is-active", sunOn);
  sunPanel.hidden = !sunOn;
  if (sunOn) applySun();
  else scene3d.setSun(null);
});
sunHour.addEventListener("input", applySun);
sunMonth.addEventListener("input", applySun);

// ── Phím tắt toàn cục (doc 09) ─────────────────────────────────
window.addEventListener("keydown", (e) => {
  if (plan.dragging) return; // phiên kéo tự xử lý bàn phím (HUD)
  const t = e.target as HTMLElement | null;
  if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
  if (READONLY) {
    if (e.key === "Escape") state.select(null);
    return; // chỉ-xem: mọi phím sửa (Del, R, Ctrl+Z…) đứng ngoài
  }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !e.shiftKey) {
    e.preventDefault();
    doUndo();
  } else if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === "y" || (e.key.toLowerCase() === "z" && e.shiftKey))) {
    e.preventDefault();
    doRedo();
  } else if (e.key === "Delete") {
    deleteSelection();
  } else if (e.key.toLowerCase() === "r" && !e.ctrlKey && !e.metaKey) {
    rotateSelection();
  } else if (e.key === "5") {
    catalog.show();
    toolFurniture.classList.add("is-active");
  } else if (e.key.toLowerCase() === "v") {
    exitPlacing();
  } else if (e.key === "Escape") {
    if (plan.placingAsset || catalog.visible) exitPlacing();
    else state.select(null);
  }
});

// ── Chia sẻ chỉ-xem (backlog v2 → 13/07/2026) ──────────────────
const shareBtn = document.getElementById("share-btn") as HTMLButtonElement;
if (READONLY) {
  // vai khách: badge + khóa mọi công cụ sửa (server vẫn là người gác thật)
  shareBtn.hidden = true;
  const badge = document.createElement("span");
  badge.className = "view-badge";
  badge.textContent = t("viewer.badge");
  document.querySelector(".brand")?.appendChild(badge);
  for (const b of document.querySelectorAll<HTMLButtonElement>(".rail .tool")) {
    b.disabled = true;
    b.title = t("tool.locked");
  }
  (document.getElementById("snap-input") as HTMLInputElement).disabled = true;
} else {
  shareBtn.addEventListener("click", async () => {
    try {
      const r = (await (await fetch("/share")).json()) as { url: string };
      await navigator.clipboard.writeText(r.url);
      ui.toast("user", t("share.copied", { url: r.url }));
    } catch {
      ui.toast("reject", t("share.error"));
    }
  });
}

// nút đổi ngôn ngữ — hiện NGÔN NGỮ ĐÍCH, giữ nguyên trang (kể cả /xem/<token>)
const langBtn = document.getElementById("lang-btn") as HTMLButtonElement;
langBtn.textContent = nextLang(LANG).toUpperCase(); // [fork:casa] ES/EN/VI
langBtn.addEventListener("click", toggleLang);

ws.connect();
