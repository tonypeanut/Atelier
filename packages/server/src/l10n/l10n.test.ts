import { describe, expect, it } from "vitest";
import { getRule } from "@atelier/core";
import { RULES } from "./es.js";
import { translateCompareHtml, translateIssue, translateText, translateWsMessage } from "./index.js";

describe("[fork:casa] l10n es — capa de traducción de salida", () => {
  it("sin ATELIER_LANG=es no cambia nada (comportamiento upstream)", () => {
    expect(translateText("MẶT ĐỨNG CHÍNH", "vi")).toBe("MẶT ĐỨNG CHÍNH");
    const msg = { type: "patch", summary: "thêm tường W1" };
    expect(translateWsMessage(msg, "vi")).toBe(msg);
  });

  it("textos fijos y con datos de las láminas", () => {
    expect(translateText("MẶT ĐỨNG CHÍNH", "es")).toBe("FACHADA PRINCIPAL");
    expect(translateText("TỶ LỆ 1:50", "es")).toBe("ESCALA 1:50");
    expect(translateText("Ngày: 24/10/2026", "es")).toBe("Fecha: 24/10/2026");
    expect(translateText("MẶT BẰNG PLANTA BAJA", "es")).toBe("PLANTA BAJA");
    expect(translateText("MẶT BẰNG TẦNG 1", "es")).toBe("PLANTA TẦNG 1");
    expect(translateText("LÊN 16 BẬC", "es")).toBe("SUBE 16 ESCALONES");
    expect(translateText("texto desconocido", "es")).toBe("texto desconocido");
  });

  it("resúmenes de cambios del editor", () => {
    expect(translateText("thêm cửa sổ S30", "es")).toBe("agregar ventana S30");
    expect(translateText("xóa sàn SL21", "es")).toBe("borrar losa SL21");
    expect(translateText("sửa tường W22 (from: [1,2] → [3,4], nota: x (không đổi))", "es")).toBe(
      "editar muro W22 (from: [1,2] → [3,4], nota: x (sin cambio))",
    );
    const out = translateWsMessage({ type: "patch", summary: "thêm tường W1; xóa nội thất F2" }, "es");
    expect(out.summary).toBe("agregar muro W1; borrar mueble F2");
  });

  it("mensajes del validador: recupera los valores y usa la plantilla en español", () => {
    const vi = getRule("GEO-08")!.message.replace("{wall}", "W3").replace("{detail}", "vượt ra ngoài ranh đất");
    const issue = translateIssue({ rule: "GEO-08", severity: "error", entities: ["W3"], message: vi }, "es");
    expect(issue.message).toBe("Muro W3: sale del límite del terreno.");
  });

  it("toda plantilla en español usa exactamente los placeholders de la regla original", () => {
    const keys = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
    for (const [id, es] of Object.entries(RULES)) {
      const vi = getRule(id)?.message;
      if (!vi) continue; // regla de un pack no cargado en este entorno
      expect(keys(es), id).toEqual(keys(vi));
    }
  });

  it("página de comparación", () => {
    expect(translateCompareHtml('<html lang="vi"><b>Khác biệt chính</b>', "es")).toBe('<html lang="es"><b>Diferencias principales</b>');
  });
});
