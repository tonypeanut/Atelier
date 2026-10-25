/**
 * [fork:casa] Nombres en español del catálogo, por id. Archivo propio para no tocar
 * catalog.ts de upstream. Un id que falte cae a labelEn (ver labelEs()).
 */
export const CATALOG_ES: Record<string, string> = {
  "giuong-1m": "Cama individual 1.0 m",
  "giuong-1m2": "Cama individual 1.2 m",
  "giuong-1m4": "Cama matrimonial 1.4 m",
  "giuong-1m6": "Cama matrimonial 1.6 m",
  "giuong-1m8": "Cama queen 1.8 m",
  "giuong-2m": "Cama king 2.0 m",
  "giuong-tang-1m": "Litera infantil 1.0 m",
  "giuong-tang-1m2": "Litera 1.2 m",
  "noi-em-be": "Cuna",
  "tu-dau-giuong-40": "Buró 40 cm",
  "tu-dau-giuong-50": "Buró 50 cm",
  "tu-ao-1m": "Ropero 1.0 m",
  "tu-ao-1m2": "Ropero 1.2 m",
  "tu-ao-1m6": "Ropero 1.6 m",
  "tu-ao-2m": "Ropero 2.0 m",
  "tu-ao-2m4": "Ropero de puertas corredizas 2.4 m",
  "ban-trang-diem": "Tocador",
  "sofa-don": "Sillón individual",
  "sofa-2s": "Sofá de 2 plazas",
  "sofa-3s-01": "Sofá de 3 plazas",
  "sofa-3s-22": "Sofá grande de 3 plazas",
  "sofa-goc-l": "Sala esquinera en L",
  "ban-tra-vuong": "Mesa de centro cuadrada 60",
  "ban-tra-chu-nhat": "Mesa de centro 1.1 m",
  "ban-tra-tron": "Mesa de centro redonda 70",
  "ke-tv-1200": "Mueble de TV 1.2 m",
  "ke-tv-1600": "Mueble de TV 1.6 m",
  "ke-tv-2000": "Mueble de TV 2.0 m",
  "tu-giay-800": "Zapatera 80 cm",
  "tu-giay-1200": "Zapatera 1.2 m",
  "ban-an-2": "Comedor para 2",
  "ban-an-4": "Comedor para 4",
  "ban-an-6": "Comedor para 6",
  "ban-an-8": "Comedor para 8",
  "ban-an-tron-1m": "Comedor redondo 1.0 m",
  "ghe-an": "Silla de comedor",
  "ghe-bang-an": "Banca de comedor 1.4 m",
  "tu-bep-duoi-06": "Gabinete bajo de cocina 60 (módulo)",
  "tu-bep-duoi-12": "Cocina baja 1.2 m",
  "tu-bep-duoi-18": "Cocina baja 1.8 m (con tarja)",
  "tu-bep-duoi-24": "Cocina baja 2.4 m (tarja + estufa)",
  "tu-bep-duoi-30": "Cocina baja 3.0 m (tarja + estufa)",
  "tu-bep-goc": "Cocina baja en L 1.8 × 1.8 m",
  "tu-bep-tren-06": "Alacena 0.6 m",
  "tu-bep-tren-12": "Alacena 1.2 m",
  "tu-bep-tren-18": "Alacena 1.8 m",
  "tu-bep-tren-24": "Alacena 2.4 m",
  "tu-lanh-mini": "Frigobar",
  "tu-lanh": "Refrigerador de 2 puertas",
  "tu-lanh-sbs": "Refrigerador dúplex",
  "ban-hoc": "Escritorio 1.0 m",
  "ban-lam-viec-1m2": "Escritorio 1.2 m",
  "ban-lam-viec-1m4": "Escritorio 1.4 m",
  "ghe-xoay": "Silla de oficina giratoria",
  "ke-sach-600": "Librero 60 cm",
  "ke-sach-800": "Librero 80 cm",
  "ke-sach-1200": "Librero 1.2 m",
  "bon-cau": "WC de dos piezas",
  "bon-cau-1-khoi": "WC de una pieza",
  "lavabo": "Lavabo",
  "lavabo-tu": "Lavabo con mueble 80 cm",
  "lavabo-doi": "Lavabo doble 1.2 m",
  "voi-sen": "Regadera 90",
  "voi-sen-80": "Regadera 80",
  "bon-tam-15": "Tina 1.5 m",
  "bon-tam-17": "Tina 1.7 m",
  "guong-wc": "Espejo de baño 60",
  "binh-nong-lanh": "Calentador de agua 20 L",
  "may-giat": "Lavadora de carga frontal",
  "may-giat-cua-tren": "Lavadora de carga superior",
  "may-say": "Secadora (apilable)",
  "may-lanh-treo": "Minisplit",
  "may-lanh-dung": "Aire acondicionado de piso",
  "quat-cay": "Ventilador de pedestal",
  "den-cay": "Lámpara de piso",
  "cay-canh-nho": "Maceta (chica)",
  "cay-canh-lon": "Maceta (grande)",
  "guong-toan-than": "Espejo de cuerpo completo",
  "xe-may": "Motoneta",
  "xe-may-so": "Motocicleta",
  "xe-dap": "Bicicleta",
  "o-to-hatchback": "Auto compacto (cajón)",
  "o-to-sedan": "Sedán (cajón)",
  "ban-tho": "Altar 1.07 m",
  "ban-tho-1m53": "Altar 1.53 m",
  "ban-tho-treo": "Altar de pared 81 cm",
};

/** Acabados de las variantes de color de catalog.ts (sufijo del id → texto). */
const VARIANT_ES: Record<string, string> = {
  "-go-soi": "roble",
  "-go-oc-cho": "nogal",
  "-trang": "blanco",
  "-xam": "tela gris",
  "-da-nau": "piel café",
  "-den": "patas de acero negro",
  "-xanh-reu": "verde musgo",
  "-da": "cubierta de piedra",
};

/** Nombre en español: id exacto, o id base + acabado de una variante (p. ej. `sofa-3s-01-xam`). */
export function labelEs(asset: { id: string; label: string; labelEn?: string }): string {
  const own = CATALOG_ES[asset.id];
  if (own) return own;
  const base = Object.keys(CATALOG_ES)
    .filter((k) => asset.id.startsWith(`${k}-`))
    .sort((a, b) => b.length - a.length)[0];
  const baseLabel = base ? CATALOG_ES[base] : undefined;
  if (!base || !baseLabel) return asset.labelEn ?? asset.label;
  const finish = VARIANT_ES[asset.id.slice(base.length)];
  return finish ? `${baseLabel} — ${finish}` : baseLabel;
}
