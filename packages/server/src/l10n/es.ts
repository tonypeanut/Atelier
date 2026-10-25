/**
 * [fork:casa] Diccionarios vietnamita → español para lo que VE la persona usuaria:
 * textos de las láminas (SVG/PDF/DXF), mensajes del validador y resúmenes del editor.
 * Las herramientas MCP, el journal y los archivos de reglas siguen en vietnamita (upstream).
 * Para agregar un texto nuevo: EXACT si es fijo, PATTERNS si lleva datos, PHRASES si es un
 * fragmento que aparece dentro de otros textos. Detalle en docs/FORK.md.
 */

/** Texto completo y fijo → traducción. */
export const EXACT: Record<string, string> = {
  // khung tên (frame.ts)
  "Kiểm: ................": "Revisó: ................",
  "Bản vẽ concept — không thay thế hồ sơ thiết kế có chữ ký KTS hành nghề.":
    "Plano conceptual — no sustituye al proyecto ejecutivo firmado por un D.R.O. o arquitecto con cédula.",
  "⚠ Một số số liệu tiêu chuẩn đang ở mức tham khảo (chưa đối chiếu văn bản gốc).":
    "⚠ Algunos valores normativos son de referencia (sin cotejar con el texto oficial).",
  // títulos de láminas
  "MẶT ĐỨNG CHÍNH": "FACHADA PRINCIPAL",
  "THỐNG KÊ PHÒNG & CỬA": "CUADRO DE CUARTOS Y VANOS",
  "THỐNG KÊ PHÒNG": "CUADRO DE CUARTOS",
  "THỐNG KÊ CỬA": "CUADRO DE VANOS",
  "DỰ TOÁN SƠ BỘ": "PRESUPUESTO PRELIMINAR",
  "TỔNG DIỆN TÍCH QUY ĐỔI": "SUPERFICIE EQUIVALENTE TOTAL",
  "KHỐI LƯỢNG THAM KHẢO (đối chiếu báo giá thầu)": "CANTIDADES DE REFERENCIA (cotejar con cotización)",
  // encabezados de tablas
  "Tầng": "Nivel",
  "Ký hiệu": "Clave",
  "Loại": "Tipo",
  "Kiểu": "Modelo",
  "Cửa đi": "Puerta",
  "Cửa sổ": "Ventana",
  "Hạng mục": "Concepto",
  "Hệ số": "Factor",
  "Quy đổi (m²)": "Equivalente (m²)",
  "Khối lượng tham khảo": "Cantidad de referencia",
  "Giá trị": "Valor",
  "Đơn vị": "Unidad",
  "Đơn giá (đ/m²)": "Precio unitario (/m²)",
  "Thành tiền (đ)": "Importe",
  "Ghi chú:": "Notas:",
  "Tường xây (đã trừ ô chờ cửa)": "Muros (descontando vanos)",
  "Cửa đi + cửa sổ": "Puertas + ventanas",
  "Bậc thang": "Escalones",
  "Sàn sử dụng (trừ ô trống)": "Piso útil (sin vacíos)",
  "bậc": "escalones",
  "Diện tích tính theo lòng phòng (thông thủy); kích thước cửa là kích thước ô chờ.":
    "Áreas libres interiores; las medidas de vanos son de hueco en obra.",
  "Dự toán sơ bộ mức concept — chốt chi phí bằng báo giá thầu có khối lượng chi tiết.":
    "Presupuesto conceptual — el costo se cierra con una cotización por partidas.",
  "Diện tích quy đổi theo cách tính phổ thông nhà phố; ô trống nhỏ hơn ngưỡng vẫn tính đủ diện tích.":
    "Superficie equivalente al estilo vietnamita; los vacíos pequeños cuentan completos.",
  // usos de cuarto (schedule-scene.ts)
  "Bếp + ăn": "Cocina-comedor",
  "Phòng ngủ": "Recámara",
  "Vệ sinh": "Baño",
  "Phòng thờ": "Altar",
  "Làm việc": "Estudio",
  "Cầu thang": "Escalera",
  "Sân": "Patio",
  "Giếng trời": "Tragaluz",
  "Ban công": "Balcón",
  "Hai phương án gần như trùng nhau về phòng ốc và chi phí.":
    "Las dos variantes son casi iguales en cuartos y costo.",
};

/** Texto con datos: regex de línea completa → reemplazo ($1, $2…). Se prueban en orden. */
export const PATTERNS: Array<[RegExp, string]> = [
  [/^TỶ LỆ (.+)$/, "ESCALA $1"],
  [/^Ngày: (.+)$/, "Fecha: $1"],
  [/^Thiết kế: (.+)$/, "Diseño: $1"],
  [/^MẶT BẰNG (PLANTA .+)$/i, "$1"], // el nivel ya se llama "Planta baja"
  [/^MẶT BẰNG (.+)$/i, "PLANTA $1"],
  [/^LÊN (\d+) BẬC$/, "SUBE $1 ESCALONES"],
  [/^Cộng (.+)$/, "Subtotal $1"],
  [/^(\d+) asset — kích thước mm thật$/, "$1 piezas — medidas reales en mm"],
  [/^(.+) \(ước lệ\)$/, "$1 (estimado)"],
  [/^CHI PHÍ SƠ BỘ — (.+)$/, "COSTO PRELIMINAR — $1"],
  // resúmenes de cambios (core/ops/summary.ts) que llegan al editor como aviso
  [/^thêm (.+?) ([A-Z]+\d+\w*)$/, "agregar $1 $2"],
  [/^sửa (.+?) ([A-Z]+\d+\w*) \((.*)\)$/s, "editar $1 $2 ($3)"],
  [/^xóa (.+?) ([A-Z]+\d+\w*)$/, "borrar $1 $2"],
];

/**
 * Fragmentos que aparecen dentro de otros textos (nombres de entidad en resúmenes,
 * valores sueltos de los mensajes del validador). Se aplican de la más larga a la más corta.
 */
export const PHRASES: Record<string, string> = {
  "(không đổi)": "(sin cambio)",
  "underlay đồ lại": "calco",
  "kiểu cửa": "estilo de vano",
  "vật liệu": "material",
  "nội thất": "mueble",
  "cửa sổ": "ventana",
  "tầng": "nivel",
  "tường": "muro",
  "cửa": "vano",
  "sàn": "losa",
  "mái": "techo",
  "thang": "escalera",
  "phòng": "cuarto",
  "trục": "eje",
  "vượt ra ngoài ranh đất": "sale del límite del terreno",
};

/** Mensajes del validador por regla, con los mismos {placeholders} que core/rules/*.json. */
export const RULES: Record<string, string> = {
  "GEO-01": "El vano {opening} (ancho {width}, desfase {offset}) sale del muro {wall} (largo {len}).",
  "GEO-02": "{a} y {b} se traslapan {overlap} mm en el muro {wall}.",
  "GEO-03": "Los muros {a} y {b} son paralelos y se enciman: ejes a {dist} mm < {minDist} mm (suma de medios espesores).",
  "GEO-04": "{a} choca con {b} ({depth} mm).",
  "GEO-05": "El polígono de {entity} se cruza a sí mismo o es degenerado — corrige el orden de los vértices.",
  "GEO-06": "El abatimiento de la puerta {opening} choca con {obstacle}.",
  "GEO-07": "Escalera {stair}: el tramo superior o el descanso no cae dentro del hueco de la losa {slab} — altura libre insuficiente (≥ 2000 mm).",
  "GEO-08": "Muro {wall}: {detail}.",
  "GEN-CEIL-01": "Cuarto {ten} ({room}) en {level}: altura libre {clear} mm, menor que el mínimo de {min} mm.",
  "PLN-01": "El muro {wall} queda a {dist} mm del lindero FRONTAL — invade la restricción frontal de {lui} mm del brief.",
  "PLN-02": "El muro {wall} queda a {dist} mm del lindero POSTERIOR — invade la restricción posterior de {lui} mm del brief.",
  "PLN-03": "El desplante ocupa {pct} %, más que el máximo de {max} % del brief.",
  "PLN-04": "{n} niveles, más que el máximo de {max} del brief.",
  "PLN-05": "La parte más alta llega a +{top} mm, más que el máximo de {max} mm del brief.",
  "PLN-06": "{slab} sale {vuon} mm del lindero — más que el volado máximo de {max} mm del brief.",
  "PLN-07": "El muro {wall} queda a {dist} mm del lindero #{edge} — invade la restricción de {lui} mm de ese lado.",
  "STD-01": "Cuarto {ten} ({room}) de {area} m² — menor que el mínimo de {min} m² ({loai}).",
  "STD-02": "Cuarto {ten} ({room}) de {width} mm de ancho < {min} mm.",
  "STD-03": "{ten} ({room}): altura libre del nivel {level} = {clear} mm < {min} mm.",
  "STD-04": "Pasillo {ten} ({room}) de {width} mm < {min} mm.",
  "STD-05": "Vano {opening} ({loai}) de {width} mm < {min} mm.",
  "STD-06": "Escalera {stair}: {detail}.",
  "STD-07": "Barandal {entity} de {height} mm < {min} mm.",
  "STD-08": "Ventana {opening} con repisón de {sill} mm < {min} mm en {level} sin barandal de protección.",
  "STD-09": "Cuarto {ten} ({room}) sin ventana ni tragaluz — considera agregar una ventana o un tragaluz.",
  "STD-10": "La puerta {opening} del baño abre directo a la cocina-comedor ({room}) — cambia el abatimiento o agrega un vestíbulo.",
  "STD-11": "{item}: {detail}.",
};
