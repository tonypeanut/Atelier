import { describe, expect, it } from "vitest";
import type { Project } from "@atelier/core";
import { DICT_ES_KEYS, DICT_KEYS, detectLang, nextLang } from "./i18n.js";
import { category3d, etapaOf, etapasIn, NO_ETAPA, parseState, visible3d } from "./layers.js";

const model = {
  walls: [{ id: "W1", etapa: 1 }, { id: "W2" }],
  openings: [{ id: "D1", wall: "W1" }, { id: "S1", wall: "W2", etapa: "futura" }],
  slabs: [{ id: "SL1", kind: "floor" }, { id: "SL2", kind: "roof-flat", etapa: 1 }, { id: "SL3", kind: "canopy" }],
  roofs: [],
  stairs: [],
  rooms: [{ id: "R1", etapa: "futura" }],
  furniture: [{ id: "F1" }],
} as unknown as Project;

describe("[fork:casa] capas y etapas del editor", () => {
  it("clasifica entidades en categorías 3D (techos = losas de azotea, tejabanes y techos)", () => {
    expect(category3d(model, "SL1")).toBe("losas");
    expect(category3d(model, "SL2")).toBe("techos");
    expect(category3d(model, "SL3")).toBe("techos");
    expect(category3d(model, "D1")).toBe("muros");
    expect(category3d(model, "F1")).toBe("muebles");
    expect(category3d(model, "nada")).toBeNull();
  });

  it("etapa: propia, heredada del muro en vanos, o 'sin etapa'", () => {
    expect(etapaOf(model, "W1")).toBe("1");
    expect(etapaOf(model, "D1")).toBe("1"); // hereda de W1
    expect(etapaOf(model, "S1")).toBe("futura");
    expect(etapaOf(model, "F1")).toBe(NO_ETAPA);
    expect(etapasIn(model)).toEqual(["1", "futura", NO_ETAPA]);
  });

  it("visibilidad 3D combina categoría oculta y filtro de etapa", () => {
    const st = { hidden2d: [], hidden3d: ["techos" as const], etapas: ["1"] };
    expect(visible3d(st, model, "SL2")).toBe(false); // techo oculto aunque sea etapa 1
    expect(visible3d(st, model, "W1")).toBe(true);
    expect(visible3d(st, model, "W2")).toBe(false); // sin etapa
    expect(visible3d({ hidden2d: [], hidden3d: [], etapas: null }, model, "W2")).toBe(true);
  });

  it("estado guardado: tolera basura y descarta capas desconocidas", () => {
    expect(parseState("no-json")).toEqual({ hidden2d: [], hidden3d: [], etapas: null });
    expect(parseState('{"hidden2d":["DIM","XYZ"],"hidden3d":["techos","otra"],"etapas":[1]}')).toEqual({
      hidden2d: ["DIM"], hidden3d: ["techos"], etapas: ["1"],
    });
  });
});

describe("[fork:casa] español en el editor", () => {
  it("el diccionario es tiene exactamente las claves del vietnamita", () => {
    expect([...DICT_ES_KEYS].sort()).toEqual([...DICT_KEYS].sort());
  });

  it("detecta español por ?lang, por elección guardada o por idioma del navegador", () => {
    expect(detectLang({ query: "es", timeZone: "Asia/Saigon" })).toBe("es");
    expect(detectLang({ saved: "es" })).toBe("es");
    expect(detectLang({ timeZone: "America/Mazatlan", languages: ["es-MX", "en"] })).toBe("es");
    expect(detectLang({ timeZone: "America/Mazatlan", languages: ["en-US"] })).toBe("en");
  });

  it("el botón de idioma rota es → en → vi → es", () => {
    expect(nextLang("es")).toBe("en");
    expect(nextLang("en")).toBe("vi");
    expect(nextLang("vi")).toBe("es");
  });
});
