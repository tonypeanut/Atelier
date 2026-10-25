import { CATALOG, labelEs, type Asset } from "@atelier/core";
import { LANG, t } from "./i18n.js";

/**
 * Panel catalog nội thất (doc 09 tool 5, P5): tìm + chọn asset để đặt vào
 * mặt bằng. Chọn xong panel giữ nguyên — đặt liên tiếp tới khi Esc/V.
 */
export class CatalogPanel {
  private readonly el: HTMLDivElement;
  private readonly listEl: HTMLDivElement;
  private readonly searchEl: HTMLInputElement;
  private picked: string | null = null;

  constructor(host: HTMLElement, private readonly onPick: (assetId: string) => void) {
    this.el = document.createElement("div");
    this.el.id = "catalog-panel";
    this.el.hidden = true;

    const head = document.createElement("div");
    head.className = "cat-head";
    const title = document.createElement("span");
    title.textContent = t("catalog.title");
    title.className = "cat-title";
    this.searchEl = document.createElement("input");
    this.searchEl.type = "search";
    this.searchEl.placeholder = t("catalog.search");
    this.searchEl.className = "cat-search";
    this.searchEl.addEventListener("input", () => this.renderList());
    this.searchEl.addEventListener("keydown", (e) => e.stopPropagation()); // không rơi vào phím tắt toàn cục
    head.append(title, this.searchEl);

    this.listEl = document.createElement("div");
    this.listEl.className = "cat-list";

    this.el.append(head, this.listEl);
    host.appendChild(this.el);
    this.renderList();
  }

  get visible(): boolean {
    return !this.el.hidden;
  }

  show(): void {
    this.el.hidden = false;
    this.searchEl.focus();
  }

  hide(): void {
    this.el.hidden = true;
    this.setPicked(null);
  }

  setPicked(id: string | null): void {
    this.picked = id;
    for (const b of this.listEl.querySelectorAll(".cat-item")) {
      b.classList.toggle("is-picked", (b as HTMLElement).dataset.asset === id);
    }
  }

  private renderList(): void {
    const q = this.searchEl.value.trim().toLowerCase();
    const match = (a: Asset): boolean =>
      !q || `${a.id} ${a.label} ${a.labelEn ?? ""} ${labelEs(a)} ${a.category}`.toLowerCase().includes(q); // [fork:casa] busca en español
    this.listEl.textContent = "";
    let count = 0;
    for (const a of CATALOG) {
      if (!match(a) || count >= 60) continue;
      count += 1;
      const btn = document.createElement("button");
      btn.className = `cat-item${a.id === this.picked ? " is-picked" : ""}`;
      btn.dataset.asset = a.id;
      const name = document.createElement("span");
      name.className = "cat-name";
      name.textContent = LANG === "es" ? labelEs(a) : LANG === "en" && a.labelEn ? a.labelEn : a.label; // [fork:casa] + es
      const dims = document.createElement("span");
      dims.className = "cat-dims";
      dims.textContent = `${a.footprint.w}×${a.footprint.d}${a.mountHeight != null ? ` · ${t("catalog.mounted")}` : ""}`;
      btn.append(name, dims);
      btn.addEventListener("click", () => {
        this.setPicked(a.id);
        this.onPick(a.id);
      });
      this.listEl.appendChild(btn);
    }
    if (count === 0) {
      const p = document.createElement("p");
      p.className = "panel-empty";
      p.textContent = t("catalog.empty");
      this.listEl.appendChild(p);
    }
  }
}
