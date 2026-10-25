import { translateText } from "../l10n/index.js"; // [fork:casa]
import type { Point } from "@atelier/core";
import { LAYERS, type Prim, type Scene2D } from "./scene.js";
import { PAPER, type PlanTransform } from "./transform.js";

export type SvgOptions = {
  /** CSS @font-face (đã inline data URI) — bỏ trống thì dùng font hệ thống. */
  fontCss?: string;
};

const F = (v: number): string => (Math.round(v * 1000) / 1000).toString();

/**
 * Scene → SVG. Điểm model được transform TỪNG ĐIỂM (không dùng transform
 * của SVG) để stroke-width và cỡ chữ giữ nguyên mm giấy.
 */
export function sceneToSvg(items: Scene2D, tf: PlanTransform, opts: SvgOptions = {}): string {
  const out: string[] = [];
  // data-tf-* cho web editor đảo ngược tọa độ giấy → model (kéo thả P3)
  const b = tf.bounds;
  const tfAttrs =
    ` data-tf-scale="${tf.scale}" data-tf-rotated="${tf.rotated ? 1 : 0}"` +
    ` data-tf-ox="${F(tf.ox)}" data-tf-oy="${F(tf.oy)}"` +
    ` data-tf-min-x="${F(b.minX)}" data-tf-min-y="${F(b.minY)}" data-tf-max-x="${F(b.maxX)}" data-tf-max-y="${F(b.maxY)}"`;
  out.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${PAPER.w} ${PAPER.h}" width="${PAPER.w}mm" height="${PAPER.h}mm"${tfAttrs}>`,
  );
  out.push("<style>");
  if (opts.fontCss) out.push(opts.fontCss);
  out.push(
    `text{font-family:'Be Vietnam Pro','Segoe UI',Arial,sans-serif;fill:#000;stroke:none}`,
    `.b{font-weight:700}`,
  );
  out.push("</style>");
  out.push(`<rect width="${PAPER.w}" height="${PAPER.h}" fill="#ffffff"/>`);

  for (const layer of LAYERS) {
    const layerItems = items.filter((i) => i.layer === layer);
    if (layerItems.length === 0) continue;
    out.push(`<g id="layer-${layer}" data-layer="${layer}">`);
    for (const item of layerItems) {
      const map = item.space === "paper" ? (p: Point): Point => p : tf.toPaper;
      let el = primToSvg(item.prim, map, tf, item.space === "paper");
      if (!el) continue;
      if (item.opacity != null && item.opacity < 1) el = el.replace(/^<(\w+)/, `<$1 opacity="${F(item.opacity)}"`);
      out.push(item.dataId ? el.replace(/^<(\w+)/, `<$1 data-id="${esc(item.dataId)}"`) : el);
    }
    out.push("</g>");
  }
  out.push("</svg>");
  return out.join("\n");
}

function primToSvg(prim: Prim, map: (p: Point) => Point, tf: PlanTransform, isPaper: boolean): string | null {
  const S = isPaper ? 1 : tf.scale;
  switch (prim.kind) {
    case "line": {
      const a = map(prim.a);
      const b = map(prim.b);
      return `<line x1="${F(a[0])}" y1="${F(a[1])}" x2="${F(b[0])}" y2="${F(b[1])}"${stroke(prim.weight, prim.dash, prim.color)}/>`;
    }
    case "polyline": {
      const pts = prim.pts.map(map).map((p) => `${F(p[0])},${F(p[1])}`).join(" ");
      const tag = prim.close ? "polygon" : "polyline";
      return `<${tag} points="${pts}" fill="none"${stroke(prim.weight, prim.dash, prim.color)}/>`;
    }
    case "image": {
      // pixel (u,v) → model = origin + R(rot)·(u·s, (hpx−v)·s) → giấy. Ảnh gốc y-XUỐNG,
      // model y-LÊN — hàng pixel 0 nằm ở đỉnh ảnh nên v đảo qua hpx−v.
      const rad = (prim.rot * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      const s = prim.scale;
      const px = (u: number, v: number): Point => {
        const mx = u * s;
        const my = (prim.hpx - v) * s;
        return map([prim.origin[0] + mx * cos - my * sin, prim.origin[1] + mx * sin + my * cos]);
      };
      const p00 = px(0, 0);
      const pu = px(1, 0);
      const pv = px(0, 1);
      const m = [pu[0] - p00[0], pu[1] - p00[1], pv[0] - p00[0], pv[1] - p00[1], p00[0], p00[1]];
      return `<image href="${prim.href}" x="0" y="0" width="${prim.wpx}" height="${prim.hpx}" preserveAspectRatio="none" transform="matrix(${m.map(F).join(" ")})"/>`;
    }
    case "polygon": {
      const pts = prim.pts.map(map).map((p) => `${F(p[0])},${F(p[1])}`).join(" ");
      const fill = prim.fill ?? "none";
      return `<polygon points="${pts}" fill="${fill}"${prim.weight ? stroke(prim.weight) : ""}/>`;
    }
    case "circle": {
      const c = map(prim.c);
      const r = prim.rPaper || isPaper ? prim.r : prim.r / S;
      return `<circle cx="${F(c[0])}" cy="${F(c[1])}" r="${F(r)}" fill="${prim.fill ?? "none"}"${stroke(prim.weight)}/>`;
    }
    case "ellipse": {
      const c = map(prim.c);
      const rx = isPaper ? prim.rx : prim.rx / S;
      const ry = isPaper ? prim.ry : prim.ry / S;
      const ang = paperAngle(prim.rot, tf, isPaper);
      return `<ellipse cx="${F(c[0])}" cy="${F(c[1])}" rx="${F(rx)}" ry="${F(ry)}" fill="none" transform="rotate(${F(ang)} ${F(c[0])} ${F(c[1])})"${stroke(prim.weight)}/>`;
    }
    case "arc": {
      const r = isPaper ? prim.r : prim.r / tf.scale;
      const p0 = onCircle(prim.c, prim.r, prim.a0);
      const pm = onCircle(prim.c, prim.r, (prim.a0 + prim.a1) / 2 + (Math.abs(prim.a1 - prim.a0) > 180 ? 180 : 0));
      const p1 = onCircle(prim.c, prim.r, prim.a1);
      const a = map(p0);
      const m = map(pm);
      const b = map(p1);
      const cross = (m[0] - a[0]) * (b[1] - m[1]) - (m[1] - a[1]) * (b[0] - m[0]);
      const sweep = cross > 0 ? 1 : 0;
      const large = Math.abs(normDeg(prim.a1 - prim.a0)) > 180 ? 1 : 0;
      return `<path d="M ${F(a[0])} ${F(a[1])} A ${F(r)} ${F(r)} 0 ${large} ${sweep} ${F(b[0])} ${F(b[1])}" fill="none"${stroke(prim.weight, prim.dash)}/>`;
    }
    case "text": {
      const at = map(prim.at);
      let rot = 0;
      if (prim.along) {
        const a = map(prim.along.from);
        const b = map(prim.along.to);
        rot = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
        if (rot > 90 || rot <= -90) rot += 180; // chữ không lộn ngược đầu
      }
      const anchor = prim.anchor ?? "start";
      const cls = prim.bold ? ` class="b"` : "";
      const tr = rot !== 0 ? ` transform="rotate(${F(rot)} ${F(at[0])} ${F(at[1])})"` : "";
      return `<text x="${F(at[0])}" y="${F(at[1])}" font-size="${F(prim.size)}" text-anchor="${anchor}" dominant-baseline="middle"${cls}${tr}>${esc(translateText(prim.text))}</text>`; // [fork:casa] l10n
    }
    default:
      return null;
  }
}

function onCircle(c: Point, r: number, deg: number): Point {
  const rad = (deg * Math.PI) / 180;
  return [c[0] + r * Math.cos(rad), c[1] + r * Math.sin(rad)];
}

function normDeg(d: number): number {
  let v = d % 360;
  if (v > 180) v -= 360;
  if (v < -180) v += 360;
  return v;
}

function paperAngle(modelDeg: number, tf: PlanTransform, isPaper: boolean): number {
  if (isPaper) return modelDeg;
  const v = tf.dirToPaper([Math.cos((modelDeg * Math.PI) / 180), Math.sin((modelDeg * Math.PI) / 180)]);
  return (Math.atan2(v[1], v[0]) * 180) / Math.PI;
}

function stroke(weight?: number, dash?: string, color?: string): string {
  if (weight == null) return "";
  const d = dash ? ` stroke-dasharray="${dash}"` : "";
  return ` stroke="${color ?? "#000"}" stroke-width="${F(weight)}" stroke-linecap="round" stroke-linejoin="round"${d}`;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
