"use client";
import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
type Brand = { site_name: string; tagline: string; logo_url: string; whatsapp_url: string; instagram_url: string; phone: string; email: string };
const fallback: Brand = { site_name: "Christ Béni Layette", tagline: "Des essentiels pour bébé choisis avec attention.", logo_url: "/brand/christ-beni-logo.jpg", whatsapp_url: "", instagram_url: "", phone: "", email: "" };
export function useSiteBrand() {
  const [brand, setBrand] = useState(fallback);
  useEffect(() => {
    document.title = brand.site_name;
  }, [brand.site_name]);
  useEffect(() => {
    const supabase = getSupabaseClient(); if (!supabase) return;
    let mounted = true;
    const load = async () => {
      const { data } = await supabase.from("site_settings").select("key,value").in("key", ["branding", "store_contact"]);
      if (mounted && data) {
        const branding = data.find(row => row.key === "branding")?.value as Partial<Brand> | undefined;
        const contact = data.find(row => row.key === "store_contact")?.value as Partial<Brand> | undefined;
        setBrand(current => ({ ...current, ...branding, ...contact }));
      }
    };
    void load();
    const channel = supabase.channel(`storefront-brand-${crypto.randomUUID()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "site_settings" }, () => void load())
      .subscribe();
    return () => { mounted = false; void supabase.removeChannel(channel); };
  }, []);
  return brand;
}
