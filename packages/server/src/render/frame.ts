import { serverLang } from "../l10n/index.js"; // [fork:casa]
import { unverifiedRules, type Point } from "@atelier/core";
import { PAPER } from "./transform.js";
import { W, type LayerName, type Prim } from "./scene.js";

export type FramePush = (layer: LayerName, prim: Prim, dataId?: string, space?: "model" | "paper") => void;

export type SheetFrameOptions = {
  projectName: string;
  app: string;
  /** Tên bản vẽ in trong khung tên, vd "MẶT BẰNG TẦNG 1", "MẶT CẮT A-A". */
  title: string;
  /** Số hiệu tờ, vd "KT-03". */
  sheetNo: string;
  /** "1:50" | "1:100" | "—" (bảng thống kê). */
  scaleLabel: string;
  date?: string;
  designer?: string;
  /** Hướng bắc TRÊN GIẤY (đơn vị hóa) — chỉ mặt bằng mới có. */
  northPaperDir?: Point;
  /**
   * Bộ rule đang áp có số chưa đối chiếu văn bản gốc (P9 — theo project, vì
   * pack region khác có thể chưa verify). Bỏ trống = soi bộ builtin như cũ.
   */
  unverified?: boolean;
};

/**
 * Khung bản vẽ + khung tên A3 (doc 08) — paper-space, mọi loại tờ dùng chung
 * để cả bộ hồ sơ nhìn như một tay vẽ.
 */
export function drawSheetFrame(push: FramePush, o: SheetFrameOptions): void {
  const m = 7;
  push("KHUNG", { kind: "polyline", pts: [[m, m], [PAPER.w - m, m], [PAPER.w - m, PAPER.h - m], [m, PAPER.h - m]], close: true, weight: W.frame }, undefined, "paper");

  // khung tên
  const x1 = PAPER.w - m, y1 = PAPER.h - m;
  const x0 = x1 - 150, y0 = y1 - 42;
  const rows = [y0, y0 + 12, y0 + 22, y0 + 32, y1];
  push("KHUNG", { kind: "polyline", pts: [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], close: true, weight: W.frame }, undefined, "paper");
  for (const y of rows.slice(1, 4)) {
    push("KHUNG", { kind: "line", a: [x0, y], b: [x1, y], weight: W.strong }, undefined, "paper");
  }
  const xm = x0 + 104;
  push("KHUNG", { kind: "line", a: [xm, y0], b: [xm, y1], weight: W.strong }, undefined, "paper");

  const T = (x: number, y: number, text: string, size = 2.5, bold = false, anchor: "start" | "middle" = "start") =>
    push("KHUNG", { kind: "text", at: [x, y], text, size, bold, anchor }, undefined, "paper");

  T(x0 + 3, y0 + 7.6, o.projectName.toUpperCase(), 3.4, true);
  T(xm + 3, y0 + 7.6, o.sheetNo, 3.4, true);
  T(x0 + 3, y0 + 18.6, o.title.toUpperCase(), 3.0, true);
  T(xm + 3, y0 + 18.6, `TỶ LỆ ${o.scaleLabel}`, 2.8);
  T(x0 + 3, y0 + 28.6, `Thiết kế: Atelier AI${o.designer ? ` + ${o.designer}` : ""}`, 2.4);
  T(xm + 3, y0 + 28.6, `Ngày: ${o.date ?? "—"}`, 2.4);
  T(x0 + 3, y0 + 38.6, "Kiểm: ................", 2.4);
  T(xm + 3, y0 + 38.6, o.app, 2.4);

  // ghi chú cố định + cờ ⚠ số liệu chưa verify
  T(m + 3, y1 - 5.4, "Bản vẽ concept — không thay thế hồ sơ thiết kế có chữ ký KTS hành nghề.", 2.0);
  if (o.unverified ?? unverifiedRules().length > 0) {
    T(m + 3, y1 - 2.6, "⚠ Một số số liệu tiêu chuẩn đang ở mức tham khảo (chưa đối chiếu văn bản gốc).", 2.0);
  }

  // hướng bắc (chỉ mặt bằng)
  if (o.northPaperDir) {
    const c: Point = [PAPER.w - m - 12, m + 12];
    const dir = o.northPaperDir;
    push("KHUNG", { kind: "circle", c, r: 6.5, weight: W.mid }, undefined, "paper");
    const tip: Point = [c[0] + dir[0] * 5.2, c[1] + dir[1] * 5.2];
    const tail: Point = [c[0] - dir[0] * 5.2, c[1] - dir[1] * 5.2];
    const side: Point = [-dir[1] * 1.6, dir[0] * 1.6];
    push("KHUNG", { kind: "line", a: tail, b: tip, weight: W.strong }, undefined, "paper");
    push("KHUNG", {
      kind: "polygon",
      pts: [tip, [tip[0] - dir[0] * 3.4 + side[0], tip[1] - dir[1] * 3.4 + side[1]], [tip[0] - dir[0] * 3.4 - side[0], tip[1] - dir[1] * 3.4 - side[1]]],
      fill: "#000",
    }, undefined, "paper");
    push("KHUNG", { kind: "text", at: [tip[0] + dir[0] * 3.4, tip[1] + dir[1] * 3.4], text: serverLang() === "es" ? "N" : "B", size: 3, anchor: "middle", bold: true }, undefined, "paper"); // [fork:casa] norte
  }
}

/** Tick chéo 45° của dim kiến trúc VN — dùng chung mọi tờ. */
export function dimTick(push: FramePush, layer: LayerName, c: Point, t: number): void {
  push(layer, { kind: "line", a: [c[0] - t, c[1] - t], b: [c[0] + t, c[1] + t], weight: W.mid });
}
