# Fork `tonypeanut/Atelier`: qué cambia y cómo se sincroniza

Fork de [lebac-svg/atelier](https://github.com/lebac-svg/atelier) (MIT) para el proyecto Casa (Mazatlán).
Agrega dos cosas sin cambiar el comportamiento original cuando no se activan:

1. **Panel de capas** en el editor: ocultar capas de la planta 2D y categorías del 3D (techos, losas, muros, muebles, cuartos, escaleras), y filtrar por el campo libre `etapa` de cada entidad.
2. **Español**:
   - El editor tiene un tercer idioma, ES, además de VI y EN. Se elige con el botón de idioma o con `?lang=es`, y se activa solo si el navegador está en español.
   - Con `ATELIER_LANG=es`, el servidor traduce a la salida los textos de las láminas (SVG, PDF y DXF), los mensajes del validador y los avisos de cambios. Sin la variable, todo queda como en upstream.

## Ramas, remotos y etiquetas

| Nombre | Qué es |
|---|---|
| remoto `upstream` | El repo original. **Push deshabilitado** (`no_push`) |
| remoto `origin` | El fork `tonypeanut/Atelier` |
| rama `main` | **Espejo exacto** de `upstream/main`. Nunca se le hacen commits propios |
| rama `casa` | `main` + nuestros cambios. **Es la que corre el servidor** |
| tag `base/upstream-0.4.0` | Punto donde nació el fork |
| tags `pre-sync/AAAAMMDD-HHMMSS` | Punto de regreso antes de cada sincronización |

## Regla de oro: los datos no viven aquí

Los modelos están en el vault, en `D:\Desktop\Second-Brain\Projects\Casa\planos\atelier\`:
- `atelier.project.json`: modelo activo.
- `.atelier/phuong-an/`: variantes guardadas.
- `.atelier/history.jsonl`: historial de cambios.

Actualizar el código **nunca** borra ni mueve esos archivos. El riesgo real es otro: que una versión nueva lea mal un modelo viejo y lo reescriba al primer cambio. Por eso cada actualización sigue este orden:
1. **Respalda** los datos en `planos/atelier/_respaldos/<fecha>_<motivo>/`, además del git del vault.
2. Pasa typecheck, pruebas y build.
3. Corre `packages/server/scripts/fork-check-data.ts`, que abre **una copia** del modelo y de cada variante con el código nuevo, los valida y dibuja cada planta.
4. Solo si todo pasa, se reinicia el servidor real.

## Cómo actualizar desde upstream

Todo el procedimiento está automatizado en el vault:

```bash
python scripts/atelier_update.py status    # qué trae upstream y qué archivos podrían chocar
python scripts/atelier_update.py update    # respaldo → tag pre-sync → merge → pruebas → build → chequeo de datos
```

Lo que hace `update`, por si hay que hacerlo a mano:

```bash
git fetch upstream
git tag pre-sync/AAAAMMDD-HHMMSS
git fetch upstream main:main              # main avanza en fast-forward
git merge --no-ff main                    # en la rama casa
npx --yes pnpm@11.8.0 install --frozen-lockfile   # solo si cambió pnpm-lock.yaml
npx tsc -b && npx tsc -p packages/web/tsconfig.json
npx vitest run
(cd packages/web && node ../../node_modules/.pnpm/node_modules/vite/bin/vite.js build)
node node_modules/tsx/dist/cli.mjs packages/server/scripts/fork-check-data.ts "D:/Desktop/Second-Brain/Projects/Casa/planos/atelier"
git push origin casa main --follow-tags
```

Después hay que **reconectar el servidor `atelier`** desde `/mcp`, o reiniciar la sesión de Claude Code.

**Si algo sale mal:**
- `git merge --abort` si el merge quedó a medias.
- `git reset --hard pre-sync/…` para volver al punto anterior.
- `python scripts/atelier_update.py restore <respaldo>` si los datos se dañaron.

Se usa **merge y no rebase** a propósito: la historia de `casa` no se reescribe, así que nunca hace falta `push --force` y el fork en GitHub siempre coincide con la copia local.

## Cómo están hechos los cambios (para que los merges sean fáciles)

- **Archivos propios** (upstream no los tiene, así que nunca chocan):
  - `packages/web/src/layers.ts` + `layers.test.ts`: panel de capas y filtro por etapa.
  - `packages/web/src/i18n-es.ts`: diccionario del editor.
  - `packages/core/src/catalog-es.ts`: nombres del catálogo de muebles.
  - `packages/server/src/l10n/`: traducción de salida del servidor (`es.ts` = diccionarios, `index.ts` = lógica) + pruebas.
  - `packages/server/scripts/fork-check-data.ts`: chequeo de datos.
  - Este documento.
- **Ganchos en archivos de upstream**: cada línea tocada lleva el comentario `[fork:casa]`. Para listarlas: `git grep -n "fork:casa" -- packages`.

  | Archivo | Gancho |
  |---|---|
  | `web/src/i18n.ts` | `Lang` con `es`, diccionario ES, detección por idioma del navegador y ciclo del botón |
  | `web/src/main.ts` | `initLayers(...)`, etiqueta del botón de idioma y nombre del mueble en español |
  | `web/src/three3d.ts` | `setVisibilityFilter()` y `g.visible` en `setGroup()` |
  | `web/src/catalog-panel.ts` | Nombre y búsqueda de muebles en español |
  | `core/src/index.ts` | `export * from "./catalog-es.js"` |
  | `server/src/render/svg-writer.ts`, `dxf-writer.ts` | `translateText(prim.text)` |
  | `server/src/render/frame.ts` | Flecha del norte: N en lugar de B |
  | `server/src/live.ts` | `translateWsMessage()` en `send` y `broadcast`; `translateCompareHtml()` en `/so-sanh` |

- **Al resolver un conflicto**: conserva lo que trae upstream y vuelve a aplicar encima la línea `[fork:casa]`. Si upstream reescribió la función, busca el punto equivalente.
- **Cuando upstream agregue textos nuevos** en vietnamita, se verán en vietnamita hasta agregarlos a `server/src/l10n/es.ts`:
  - `EXACT`: textos fijos.
  - `PATTERNS`: textos con datos.
  - `PHRASES`: fragmentos que aparecen dentro de otros textos.
  - `RULES`: mensajes del validador, con los mismos `{placeholders}` que `core/rules/*.json`.

  Si agregan claves de interfaz, la prueba `layers.test.ts` falla hasta que estén en `i18n-es.ts`. Así no se escapan.

## Lo que sigue en vietnamita (a propósito)

- Las descripciones de herramientas MCP, el journal (`history.jsonl`) y `get_changes_since`. Los lee Claude, no la persona, y traducirlos sería tocar decenas de líneas de upstream.
- Los archivos de reglas (`core/rules/*.json`): se traducen al mostrarse, no en la fuente.
- Algunos errores raros de operaciones rechazadas (`core/src/ops/apply.ts`).

## Ideas candidatas para proponer upstream

Los ganchos de capas (`setVisibilityFilter` y el panel) y el soporte de un tercer idioma son genéricos. Si el autor los acepta, la diferencia del fork se reduce y los merges son más fáciles.
