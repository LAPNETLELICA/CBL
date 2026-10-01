"use client";

import { useEffect, useState } from "react";
import { categories as fallbackCategories, products as fallbackProducts, deliveryAreas as fallbackDeliveryAreas } from "@/lib/catalog";
import type { Category, CategoryId, Product } from "@/lib/types";
import { getSupabaseClient } from "@/lib/supabase/client";

type CategoryRow = { id:string; slug:string; name:string; description:string; hero_image_url:string|null; accent:string };
type DeliveryZoneRow = { id: string; name: string; delivery_window: string; fee_fcfa: number };
type LivePromotion = { id:string; name:string; description:string; image_url:string|null; starts_at:string; ends_at:string };
type ProductRow = { id:string; slug:string; sku:string; name:string; description:string; price_fcfa:number; stock_quantity:number; age_group:string|null; size_label:string|null; gender:"Fille"|"Garçon"|"Mixte"|null; color:string|null; cover_image_url:string|null; featured:boolean; categories:{slug:string}|null; product_images:{storage_path:string}[]; promotion_products:{sale_price_fcfa:number;promotions:LivePromotion|null}[] };

export function useLiveCatalog() {
  const [activePromotions, setActivePromotions] = useState<LivePromotion[]>([]);
  const [productList, setProductList] = useState<Product[]>(fallbackProducts);
  const [categoryList, setCategoryList] = useState<Category[]>(fallbackCategories);
  const [hero, setHero] = useState({ eyebrow: "Une sélection pensée pour grandir en douceur", title: "Tout pour les petits bonheurs.", body: "Des essentiels choisis avec tendresse, pour accompagner les premiers jours et toutes les aventures qui suivent.", image_url: "/brand/premium-blur-hero.jpg", promise_title: "La promesse Christ Béni", promise_body: "Des choix utiles, doux et accessibles — sans détour.", closing_title: "Pensé pour les petits, choisi pour les grands.", categories_eyebrow: "Nos rayons", categories_title: "Un univers pour chaque moment.", categories_description: "Parcourez les essentiels par usage, de la première tenue au sac qui accompagne toutes les sorties.", featured_eyebrow: "Nos coups de cœur", featured_title: "Les quatre chouchous du moment.", offer_eyebrow: "Offres du moment", delivery_eyebrow: "Livraison claire" });
  const [homeMessage, setHomeMessage] = useState({ title: "", body: "" });
  const [deliveryMessage, setDeliveryMessage] = useState({ title: "Délais & tarifs", body: "" });
  const [deliveryList, setDeliveryList] = useState<{ name:string; window:string; fee:number }[]>([...fallbackDeliveryAreas]);
  const [promo, setPromo] = useState({ enabled: true, title: "Petits prix, grandes attentions.", body: "Retrouvez les essentiels du quotidien à prix doux, dans la limite des stocks disponibles." });

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    let active = true;
    const load = async () => {
      const [productResult, categoryResult, settingsResult, deliveryResult, promotionResult] = await Promise.all([
        supabase.from("products").select("id,slug,sku,name,description,price_fcfa,stock_quantity,age_group,size_label,gender,color,cover_image_url,featured,categories!inner(slug),product_images(storage_path),promotion_products(sale_price_fcfa,promotions(id,name,description,image_url,starts_at,ends_at))").eq("active", true).order("created_at", { ascending: false }),
        supabase.from("categories").select("id,slug,name,description,hero_image_url,accent").eq("active", true).order("display_order"),
        supabase.from("site_settings").select("key,value").in("key", ["promo_banner", "home_hero", "home_message", "delivery_message"]),
        supabase.from("delivery_zones").select("id,name,delivery_window,fee_fcfa").eq("active", true).order("display_order"),
        supabase.from("promotions").select("id,name,description,image_url,starts_at,ends_at").eq("active", true).order("starts_at"),
      ]);
      if (!active) return;
      if (productResult.data) {
        const rows = productResult.data as unknown as ProductRow[];
        const mapped = rows.flatMap((item): Product[] => {
          const slug = item.categories?.slug as CategoryId | undefined;
          if (!slug) return [];
          const now = Date.now();
          const offer = item.promotion_products?.find(link => Date.parse(link.promotions?.starts_at || "") <= now && Date.parse(link.promotions?.ends_at || "") > now);
          const images = (item.product_images || []).map(image => supabase.storage.from("product-images").getPublicUrl(image.storage_path).data.publicUrl);
          return [{ id:item.id, variantId:item.id, slug:item.slug, name:item.name, description:item.description, categoryId:slug, price:offer?.sale_price_fcfa ?? item.price_fcfa, originalPrice:offer ? item.price_fcfa : undefined, promotionName:offer?.promotions?.name, images, image:item.cover_image_url || images[0] || "/products/ensemble-douceur.webp", age:item.age_group || "Tous âges", size:item.size_label || "Unique", gender:item.gender || "Mixte", color:item.color || "Neutre", available:item.stock_quantity > 0, featured:item.featured }];
        });
        setProductList(mapped);
      }
      if (categoryResult.data) {
        const rows = categoryResult.data as CategoryRow[];
        const mapped = rows.flatMap((item): Category[] => {
          const fallback = fallbackCategories.find(c => c.id === item.slug);
          return [{ id:item.slug as CategoryId, name:item.name, description:item.description, image:item.hero_image_url || fallback?.image || "/products/ensemble-douceur.webp", accent:item.accent || fallback?.accent || "#8ECAE6" }];
        });
        setCategoryList(mapped);
      }
      if (promotionResult.data) setActivePromotions(promotionResult.data as LivePromotion[]);
      if (deliveryResult.data) setDeliveryList((deliveryResult.data as DeliveryZoneRow[]).map(zone => ({ name:zone.name, window:zone.delivery_window, fee:zone.fee_fcfa })));
      const settings = settingsResult.data || [];
      const promoValue = settings.find(item => item.key === "promo_banner")?.value as { enabled?:boolean; title?:string; body?:string } | undefined;
      const heroValue = settings.find(item => item.key === "home_hero")?.value as Partial<typeof hero> | undefined;
      const homeValue = settings.find(item => item.key === "home_message")?.value as { title?:string; body?:string } | undefined;
      const deliveryValue = settings.find(item => item.key === "delivery_message")?.value as { title?:string; body?:string } | undefined;
      if (promoValue) setPromo(current => ({ enabled:promoValue.enabled !== false, title:promoValue.title || current.title, body:promoValue.body || current.body }));
      if (heroValue) setHero(current => ({ ...current, ...heroValue }));
      if (homeValue) setHomeMessage(current => ({ title:homeValue.title || current.title, body:homeValue.body || current.body }));
      if (deliveryValue) setDeliveryMessage(current => ({ title:deliveryValue.title || current.title, body:deliveryValue.body || current.body }));
    };
    void load();
    const channel = supabase.channel("storefront-catalog")
      .on("postgres_changes", { event:"*", schema:"public", table:"products" }, () => void load())
      .on("postgres_changes", { event:"*", schema:"public", table:"categories" }, () => void load())
      .on("postgres_changes", { event:"*", schema:"public", table:"site_settings" }, () => void load())
      .on("postgres_changes", { event:"*", schema:"public", table:"delivery_zones" }, () => void load())
      .on("postgres_changes", { event:"*", schema:"public", table:"promotion_products" }, () => void load())
      .on("postgres_changes", { event:"*", schema:"public", table:"promotions" }, () => void load())
      .subscribe();
    return () => { active = false; void supabase.removeChannel(channel); };
  }, []);
  return { products: productList, categories: categoryList, promo, hero, homeMessage, deliveryMessage, deliveryAreas: deliveryList, activePromotions };
}
