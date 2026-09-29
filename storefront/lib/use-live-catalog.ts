"use client";

import { useEffect, useState } from "react";
import { categories as fallbackCategories, products as fallbackProducts } from "@/lib/catalog";
import type { Category, CategoryId, Product } from "@/lib/types";
import { getSupabaseClient } from "@/lib/supabase/client";

const categoryIds = new Set<CategoryId>(["chaussettes", "vetements", "sommeil", "eveil", "repas", "bain", "accessoires"]);
type CategoryRow = { id:string; slug:string; name:string; description:string; hero_image_url:string|null; accent:string };
type ProductRow = { id:string; slug:string; sku:string; name:string; description:string; price_fcfa:number; stock_quantity:number; age_group:string|null; size_label:string|null; gender:"Fille"|"Garçon"|"Mixte"|null; color:string|null; cover_image_url:string|null; featured:boolean; categories:{slug:string}|null };

export function useLiveCatalog() {
  const [productList, setProductList] = useState<Product[]>(fallbackProducts);
  const [categoryList, setCategoryList] = useState<Category[]>(fallbackCategories);
  const [promo, setPromo] = useState({ title: "Petits prix, grandes attentions.", body: "Retrouvez les essentiels du quotidien à prix doux, dans la limite des stocks disponibles." });

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    let active = true;
    const load = async () => {
      const [productResult, categoryResult, settingsResult] = await Promise.all([
        supabase.from("products").select("id,slug,sku,name,description,price_fcfa,stock_quantity,age_group,size_label,gender,color,cover_image_url,featured,categories!inner(slug)").eq("active", true).order("created_at", { ascending: false }),
        supabase.from("categories").select("id,slug,name,description,hero_image_url,accent").eq("active", true).order("display_order"),
        supabase.from("site_settings").select("value").eq("key", "promo_banner").maybeSingle(),
      ]);
      if (!active) return;
      if (productResult.data) {
        const rows = productResult.data as unknown as ProductRow[];
        const mapped = rows.flatMap((item): Product[] => {
          const slug = item.categories?.slug as CategoryId | undefined;
          if (!slug || !categoryIds.has(slug)) return [];
          return [{ id:item.id, variantId:item.id, slug:item.slug, name:item.name, description:item.description, categoryId:slug, price:item.price_fcfa, image:item.cover_image_url || "/products/ensemble-douceur.webp", age:item.age_group || "Tous âges", size:item.size_label || "Unique", gender:item.gender || "Mixte", color:item.color || "Neutre", available:item.stock_quantity > 0, featured:item.featured }];
        });
        if (mapped.length) setProductList(mapped);
      }
      if (categoryResult.data) {
        const rows = categoryResult.data as CategoryRow[];
        const mapped = rows.flatMap((item): Category[] => {
          if (!categoryIds.has(item.slug as CategoryId)) return [];
          const fallback = fallbackCategories.find(c => c.id === item.slug);
          return [{ id:item.slug as CategoryId, name:item.name, description:item.description, image:item.hero_image_url || fallback?.image || "/products/ensemble-douceur.webp", accent:item.accent || fallback?.accent || "#8ECAE6" }];
        });
        if (mapped.length) setCategoryList(mapped);
      }
      const value = settingsResult.data?.value as { enabled?:boolean; title?:string; body?:string } | undefined;
      if (value?.enabled !== false) setPromo(current => ({ title:value?.title || current.title, body:value?.body || current.body }));
    };
    void load();
    const channel = supabase.channel("storefront-catalog")
      .on("postgres_changes", { event:"*", schema:"public", table:"products" }, () => void load())
      .on("postgres_changes", { event:"*", schema:"public", table:"categories" }, () => void load())
      .subscribe();
    return () => { active = false; void supabase.removeChannel(channel); };
  }, []);
  return { products: productList, categories: categoryList, promo };
}
