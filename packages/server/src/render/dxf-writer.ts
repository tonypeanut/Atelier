import { translateText } from "../l10n/index.js"; // [fork:casa]
import type { Point } from "@atelier/core";
import { LAYERS, type Prim, type Scene2D } from "./scene.js";

/**
 * Scene2D → DXF (P4, chốt ADR-08: writer TS thuần, không sidecar Python).
 * - Cùng scene graph với SVG nên hai định dạng không bao giờ lệch nhau (doc 08).
 * - Chỉ xuất item space "model": tọa độ mm thật, y-up — mở trong CAD là đo được ngay.
 *   Khung tên/bảng (paper-space) thuộc về tờ in PDF, không thuộc model CAD.
 * - AC1021 (AutoCAD 2007) — TEXT UTF-8 native, đủ dấu tiếng Việt.
 */

const LAYER_COLOR: Record<string, number> = {
  TRUC: 8, // xám
  "TUONG-CAT": 7,
  "TUONG-THAY": 7,
  CUA: 7,
  THANG: 7,
  MAI: 7,
  "NOI-THAT": 8,
  DIM: 8,
  TEXT: 7,
  HATCH: 8,
  KHUNG: 7,
};

export type DxfOptions = {
  /** Tỷ lệ tờ (50 = 1:50) — đổi cỡ chữ mm giấy → mm model. */
  scale: number;
};

export function sceneToDxf(items: Scene2D, opts: DxfOptions): string {
  const S = opts.scale;
  const out: string[] = [];
  let handle = 0x100;
  const g = (code: number, value: string | number): void => {
    out.push(String(code), typeof value === "number" ? fmt(value) : value);
  };
  const entity = (type: string, layer: string): void => {
    g(0, type);
    g(5, (handle++).toString(16).toUpperCase());
    g(8, layer);
  };

  // ── HEADER ────────────────────────────────────────────────
  g(0, "SECTION");
  g(2, "HEADER");
  g(9, "$ACADVER");
  g(1, "AC1021");
  g(9, "$INSUNITS");
  g(70, 4); // mm
  g(9, "$HANDSEED");
  g(5, "FFFF");
  g(0, "ENDSEC");

  // ── TABLES: LTYPE + LAYER ─────────────────────────────────
  g(0, "SECTION");
  g(2, "TABLES");
  g(0, "TABLE");
  g(2, "LTYPE");
  g(5, (handle++).toString(16).toUpperCase());
  g(70, 1);
  g(0, "LTYPE");
  g(5, (handle++).toString(16).toUpperCase());
  g(2, "Continuous");
  g(70, 0);
  g(3, "Solid line");
  g(72, 65);
  g(73, 0);
  g(40, 0);
  g(0, "ENDTAB");
  g(0, "TABLE");
  g(2, "LAYER");
  g(5, (handle++).toString(16).toUpperCase());
  g(70, LAYERS.length);
  for (const name of LAYERS) {
    g(0, "LAYER");
    g(5, (handle++).toString(16).toUpperCase());
    g(2, name);
    g(70, 0);
    g(62, LAYER_COLOR[name] ?? 7);
    g(6, "Continuous");
  }
  g(0, "ENDTAB");
  g(0, "ENDSEC");

  // ── ENTITIES ──────────────────────────────────────────────
  g(0, "SECTION");
  g(2, "ENTITIES");

  for (const item of items) {
    if (item.space === "paper") continue; // khung tên thuộc tờ in, không thuộc model CAD
    writePrim(item.prim, item.layer, S, entity, g);
  }

  g(0, "ENDSEC");
  g(0, "EOF");
  return out.join("\n") + "\n";
}

function writePrim(
  prim: Prim,
  layer: string,
  S: number,
  entity: (type: string, layer: string) => void,
  g: (code: number, value: string | number) => void,
): void {
  switch (prim.kind) {
    case "line": {
      entity("LINE", layer);
      g(10, prim.a[0]);
      g(20, prim.a[1]);
      g(11, prim.b[0]);
      g(21, prim.b[1]);
      return;
    }
    case "polyline":
    case "polygon": {
      const closed = prim.kind === "polygon" || prim.close === true;
      entity("LWPOLYLINE", layer);
      g(90, prim.pts.length);
      g(70, closed ? 1 : 0);
      for (const [x, y] of prim.pts) {
        g(10, x);
        g(20, y);
      }
      // polygon có fill → thêm HATCH solid cùng biên (poché tường cắt)
      if (prim.kind === "polygon" && prim.fill && prim.fill !== "none") {
        writeSolidHatch(prim.pts, layer, entity, g);
      }
      return;
    }
    case "circle": {
      entity("CIRCLE", layer);
      g(10, prim.c[0]);
      g(20, prim.c[1]);
      g(40, prim.rPaper ? prim.r * S : prim.r);
      return;
    }
    case "arc": {
      entity("ARC", layer);
      g(10, prim.c[0]);
      g(20, prim.c[1]);
      g(40, prim.r);
      g(50, Math.min(prim.a0, prim.a1));
      g(51, Math.max(prim.a0, prim.a1));
      return;
    }
    case "ellipse": {
      const major = Math.max(prim.rx, prim.ry);
      const minor = Math.min(prim.rx, prim.ry);
      const rot = prim.rx >= prim.ry ? prim.rot : prim.rot + 90;
      const rad = (rot * Math.PI) / 180;
      entity("ELLIPSE", layer);
      g(10, prim.c[0]);
      g(20, prim.c[1]);
      g(11, major * Math.cos(rad));
      g(21, major * Math.sin(rad));
      g(40, minor / major);
      g(41, 0);
      g(42, Math.PI * 2);
      return;
    }
    case "text": {
      let rot = 0;
      if (prim.along) {
        rot = (Math.atan2(prim.along.to[1] - prim.along.from[1], prim.along.to[0] - prim.along.from[0]) * 180) / Math.PI;
        if (rot > 90 || rot <= -90) rot += 180; // chữ không lộn ngược đầu — khớp svg-writer
      }
      const hAlign = prim.anchor === "middle" ? 1 : prim.anchor === "end" ? 2 : 0;
      entity("TEXT", layer);
      g(10, prim.at[0]);
      g(20, prim.at[1]);
      g(40, prim.size * S); // mm giấy → mm model
      g(1, translateText(prim.text)); // [fork:casa] l10n
      if (rot !== 0) g(50, rot);
      g(72, hAlign);
      g(73, 2); // middle — khớp dominant-baseline của SVG
      g(11, prim.at[0]);
      g(21, prim.at[1]);
      return;
    }
    default:
      return;
  }
}

/** HATCH SOLID tối thiểu — một đường biên polyline kín. */
function writeSolidHatch(
  pts: Point[],
  layer: string,
  entity: (type: string, layer: string) => void,
  g: (code: number, value: string | number) => void,
): void {
  entity("HATCH", layer);
  g(10, 0);
  g(20, 0);
  g(30, 0);
  g(210, 0);
  g(220, 0);
  g(230, 1);
  g(2, "SOLID");
  g(70, 1); // solid fill
  g(71, 0); // non-associative
  g(91, 1); // 1 boundary path
  g(92, 2); // polyline path
  g(72, 0); // không bulge
  g(73, 1); // kín
  g(93, pts.length);
  for (const [x, y] of pts) {
    g(10, x);
    g(20, y);
  }
  g(97, 0);
  g(75, 0); // hatch style: normal
  g(76, 1); // pattern: predefined
  g(98, 0); // seed points
}

function fmt(v: number): string {
  return Number.isInteger(v) ? String(v) : String(Math.round(v * 1000) / 1000);
}
