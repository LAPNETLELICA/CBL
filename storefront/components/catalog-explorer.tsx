"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useLiveCatalog } from "@/lib/use-live-catalog";
import type { CategoryId } from "@/lib/types";
import { ProductCard } from "@/components/product-card";

type Filters = {
  category: CategoryId | "all";
  age: string;
  size: string;
  gender: string;
  price: string;
  color: string;
  availability: string;
};

const defaults: Filters = {
  category: "all",
  age: "all",
  size: "all",
  gender: "all",
  price: "all",
  color: "all",
  availability: "all",
};

const unique = (values: string[]) => Array.from(new Set(values)).sort((a, b) => a.localeCompare(b, "fr"));

export function CatalogExplorer({ initialCategory, availableOnly }: { initialCategory?: CategoryId; availableOnly?: boolean }) {
  const { products, categories } = useLiveCatalog();
  const [filters, setFilters] = useState<Filters>({
    ...defaults,
    category: initialCategory ?? "all",
    availability: availableOnly ? "yes" : "all",
  });
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filtered = useMemo(() => products.filter((product) => {
    if (filters.category !== "all" && product.categoryId !== filters.category) return false;
    if (filters.age !== "all" && product.age !== filters.age) return false;
    if (filters.size !== "all" && product.size !== filters.size) return false;
    if (filters.gender !== "all" && product.gender !== filters.gender) return false;
    if (filters.color !== "all" && product.color !== filters.color) return false;
    if (filters.availability === "yes" && !product.available) return false;
    if (filters.availability === "no" && product.available) return false;
    if (filters.price === "under-10000" && product.price >= 10000) return false;
    if (filters.price === "10000-20000" && (product.price < 10000 || product.price > 20000)) return false;
    if (filters.price === "over-20000" && product.price <= 20000) return false;
    return true;
  }), [filters]);

  const update = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const filterFields = (
    <>
      <label className="field-label">Âge
        <select className="field" value={filters.age} onChange={(event) => update("age", event.target.value)}>
          <option value="all">Tous les âges</option>
          {unique(products.map((product) => product.age)).map((age) => <option key={age}>{age}</option>)}
        </select>
      </label>
      <label className="field-label">Taille
        <select className="field" value={filters.size} onChange={(event) => update("size", event.target.value)}>
          <option value="all">Toutes les tailles</option>
          {unique(products.map((product) => product.size)).map((size) => <option key={size}>{size}</option>)}
        </select>
      </label>
      <label className="field-label">Pour
        <select className="field" value={filters.gender} onChange={(event) => update("gender", event.target.value)}>
          <option value="all">Tous</option>
          {unique(products.map((product) => product.gender)).map((gender) => <option key={gender}>{gender}</option>)}
        </select>
      </label>
      <label className="field-label">Prix
        <select className="field" value={filters.price} onChange={(event) => update("price", event.target.value)}>
          <option value="all">Tous les prix</option>
          <option value="under-10000">Moins de 10 000 FCFA</option>
          <option value="10000-20000">10 000 à 20 000 FCFA</option>
          <option value="over-20000">Plus de 20 000 FCFA</option>
        </select>
      </label>
      <label className="field-label">Couleur
        <select className="field" value={filters.color} onChange={(event) => update("color", event.target.value)}>
          <option value="all">Toutes les couleurs</option>
          {unique(products.map((product) => product.color)).map((color) => <option key={color}>{color}</option>)}
        </select>
      </label>
      <label className="field-label">Disponibilité
        <select className="field" value={filters.availability} onChange={(event) => update("availability", event.target.value)}>
          <option value="all">Tout afficher</option>
          <option value="yes">En stock</option>
          <option value="no">Bientôt disponible</option>
        </select>
      </label>
    </>
  );

  return (
    <div className="page-shell pb-24 pt-36 sm:pt-40">
      <div className="mb-10 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end" data-reveal>
        <div>
          <p className="eyebrow">La boutique</p>
          <h1 className="display-type max-w-[12ch] text-[clamp(3.5rem,8vw,7rem)] leading-[.88]">Des essentiels à leur rythme.</h1>
        </div>
        <p className="max-w-md text-base leading-7 text-ink/62">Filtrez par âge, taille ou couleur, puis ajoutez vos choix directement au panier.</p>
      </div>

      <div className="mb-7 flex gap-2 overflow-x-auto pb-2" aria-label="Rayons">
        <button type="button" onClick={() => update("category", "all")} className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-bold ${filters.category === "all" ? "bg-[#172033] text-white" : "border border-ink/10 bg-white/56"}`}>Tout</button>
        {categories.map((category) => (
          <button key={category.id} type="button" onClick={() => update("category", category.id)} className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-bold ${filters.category === category.id ? "bg-[#172033] text-white" : "border border-ink/10 bg-white/56"}`}>{category.name}</button>
        ))}
      </div>

      <div className="grid gap-7 lg:grid-cols-[17rem_1fr]">
        <aside className="glass sticky top-28 hidden h-fit rounded-[1.6rem] p-5 lg:block" aria-label="Filtres">
          <div className="mb-5 flex items-center justify-between">
            <p className="flex items-center gap-2 font-bold"><SlidersHorizontal size={18} /> Affiner</p>
            <button type="button" className="text-sm font-semibold text-[#367c9e]" onClick={() => setFilters(defaults)}>Effacer</button>
          </div>
          <div className="grid gap-4">{filterFields}</div>
        </aside>

        <section aria-live="polite">
          <div className="mb-5 flex items-center justify-between gap-4">
            <p className="font-semibold text-ink/58">{filtered.length} article{filtered.length !== 1 ? "s" : ""}</p>
            <button type="button" className="outline-button lg:hidden" onClick={() => setFiltersOpen(true)}><SlidersHorizontal size={17} /> Filtres</button>
          </div>
          {filtered.length ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          ) : (
            <div className="glass grid min-h-[24rem] place-items-center rounded-[1.8rem] p-8 text-center">
              <div><h2 className="display-type text-4xl">Aucun article ne correspond.</h2><p className="mt-3 text-ink/58">Essayez une autre combinaison de filtres.</p><button type="button" className="dark-button mt-6" onClick={() => setFilters(defaults)}>Voir toute la sélection</button></div>
            </div>
          )}
        </section>
      </div>

      {filtersOpen && (
        <div className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true" aria-label="Filtres du catalogue">
          <button type="button" className="absolute inset-0 bg-[#0a1626]/45" onClick={() => setFiltersOpen(false)} aria-label="Fermer les filtres" />
          <div className="absolute inset-x-0 bottom-0 max-h-[88svh] overflow-y-auto rounded-t-[2rem] bg-[#f4f9fb] p-5 shadow-2xl">
            <div className="mb-6 flex items-center justify-between"><h2 className="text-2xl font-bold">Affiner la sélection</h2><button type="button" className="icon-button" onClick={() => setFiltersOpen(false)} aria-label="Fermer"><X size={20} /></button></div>
            <div className="grid gap-4">{filterFields}</div>
            <div className="sticky bottom-0 mt-6 grid grid-cols-2 gap-3 bg-[#f4f9fb] py-3"><button type="button" className="outline-button" onClick={() => setFilters(defaults)}>Effacer</button><button type="button" className="dark-button" onClick={() => setFiltersOpen(false)}>Voir {filtered.length} article{filtered.length !== 1 ? "s" : ""}</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
