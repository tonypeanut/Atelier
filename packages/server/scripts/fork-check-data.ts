// [fork:casa] Verifica que ESTA versión del código abre y dibuja los datos de un proyecto
// sin tocar el original: copia la carpeta a un temporal, abre el modelo y cada variante,
// valida y renderiza la planta de cada nivel. Sale con código 1 si algo falla.
//
//   node node_modules/tsx/dist/cli.mjs packages/server/scripts/fork-check-data.ts <carpeta-del-proyecto>
//
// Lo usa scripts/atelier_update.py del vault antes de reiniciar el servidor real (docs/FORK.md).
import { cpSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { roofsOf, validateProject, type Project } from "@atelier/core";
import { renderPlanSvg } from "../src/render/render.js";
import { ProjectStore } from "../src/store.js";

const src = process.argv[2];
if (!src) {
  console.error("uso: fork-check-data.ts <carpeta-del-proyecto>");
  process.exit(2);
}

const tmp = mkdtempSync(path.join(tmpdir(), "atelier-check-"));
let failed = 0;

function check(label: string, p: Project): void {
  try {
    const issues = validateProject(p);
    const blocks = issues.filter((i) => i.severity === "block").length;
    for (const level of p.levels) renderPlanSvg(p, level.id);
    console.log(
      `OK  ${label}: r${p.meta.revision} · ${p.walls.length} muros · ${p.openings.length} vanos · ` +
        `${p.slabs.length} losas · ${roofsOf(p).length} techos · ${p.rooms.length} cuartos · ` +
        `${p.furniture.length} muebles · ${issues.length} observaciones${blocks ? ` (${blocks} bloqueantes)` : ""}`,
    );
  } catch (e) {
    failed++;
    console.log(`ERR ${label}: ${(e as Error).message}`);
  }
}

try {
  cpSync(src, tmp, { recursive: true });
  const store = new ProjectStore(tmp);
  try {
    check("modelo activo", store.openProject());
  } catch (e) {
    failed++;
    console.log(`ERR modelo activo: ${(e as Error).message}`);
  }
  for (const v of store.listVariants()) {
    try {
      check(`variante ${v.slug}`, store.readVariant(v.slug).model);
    } catch (e) {
      failed++;
      console.log(`ERR variante ${v.slug}: ${(e as Error).message}`);
    }
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

console.log(failed ? `\n${failed} problema(s): NO reinicies el servidor real con esta versión.` : "\nTodo abre y se dibuja bien.");
process.exit(failed ? 1 : 0);
