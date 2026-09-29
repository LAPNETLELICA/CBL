"use client";

import Image from "next/image";
import { Plus } from "lucide-react";
import type { Product } from "@/lib/types";
import { formatFcfa } from "@/lib/catalog";
import { useStore } from "@/components/store-provider";

export function ProductCard({ product, compact = false }: { product: Product; compact?: boolean }) {
  const { addToCart } = useStore();

  return (
    <article className="group relative overflow-hidden rounded-[1.7rem] border border-white/65 bg-white/62 p-2 shadow-[0_16px_45px_rgba(35,62,88,.10)] backdrop-blur-xl">
      <div className={`relative overflow-hidden rounded-[1.25rem] bg-[#e9f1f3] ${compact ? "aspect-[4/4.5]" : "aspect-[4/4.65]"}`}>
        {product.image.startsWith("http") ? (
          <img src={product.image} alt={product.name} className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.045]" />
        ) : (
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 25vw"
            className="object-cover transition duration-700 group-hover:scale-[1.045]"
          />
        )}
        {!product.available && (
          <span className="absolute left-3 top-3 rounded-full bg-[#172033]/86 px-3 py-1.5 text-xs font-bold text-white backdrop-blur">Bientôt de retour</span>
        )}
        {product.featured && (
          <span className="absolute left-3 top-3 rounded-full border border-white/65 bg-white/72 px-3 py-1.5 text-xs font-bold text-[#b74270] backdrop-blur">Coup de cœur</span>
        )}
      </div>
      <div className="flex items-end justify-between gap-3 px-2 pb-2 pt-4">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.12em] text-[#6c7b88]">{product.age}</p>
          <h3 className="text-lg font-bold leading-tight text-ink">{product.name}</h3>
          <p className="mt-2 font-semibold text-[#3f6680]">{formatFcfa(product.price)}</p>
        </div>
        <button
          type="button"
          className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#172033] text-white shadow-lg transition hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-40"
          onClick={() => addToCart(product)}
          disabled={!product.available}
          aria-label={`Ajouter ${product.name} au panier`}
        >
          <Plus size={20} aria-hidden />
        </button>
      </div>
    </article>
  );
}
