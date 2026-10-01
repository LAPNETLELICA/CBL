"use client";

import { FormEvent, useEffect, useState } from "react";
import { ImagePlus, Save } from "lucide-react";
import { AdminGuard } from "@/components/guard";
import { AdminShell, Head } from "@/components/shell";
import { requireSupabase } from "@/lib/supabase";

type ContentKey = "branding" | "home_hero" | "promo_banner" | "home_message" | "delivery_message" | "store_contact";
type Content = Record<string, string | boolean>;
const defaults: Record<ContentKey, Content> = {
  branding: { site_name: "Christ Béni Layette", tagline: "Des essentiels choisis avec tendresse.", logo_url: "/brand/christ-beni-logo.jpg" },
  home_hero: { eyebrow: "Une sélection pensée pour grandir en douceur", title: "Tout pour les petits bonheurs.", body: "Des essentiels choisis avec tendresse, pour accompagner les premiers jours et toutes les aventures qui suivent.", image_url: "/brand/premium-blur-hero.jpg", promise_title: "La promesse Christ Béni", promise_body: "Des choix utiles, doux et accessibles — sans détour.", closing_title: "Pensé pour les petits, choisi pour les grands.", categories_eyebrow: "Nos rayons", categories_title: "Un univers pour chaque moment.", categories_description: "Parcourez les essentiels par usage, de la première tenue au sac qui accompagne toutes les sorties.", featured_eyebrow: "Nos coups de cœur", featured_title: "Les quatre chouchous du moment.", offer_eyebrow: "Offres du moment", delivery_eyebrow: "Livraison claire" },
  promo_banner: { enabled: true, title: "Petits prix, grandes attentions.", body: "Retrouvez les essentiels du quotidien à prix doux, dans la limite des stocks disponibles." },
  home_message: { title: "Bienvenue chez Christ Béni", body: "Découvrez notre sélection pour bébé." },
  delivery_message: { title: "Délais & tarifs", body: "Une livraison claire et suivie." },
  store_contact: { phone: "", email: "", whatsapp_url: "", instagram_url: "" },
};
const fields: Record<ContentKey, Array<[string, string]>> = {
  branding: [["site_name", "Nom du site"], ["tagline", "Signature"]],
  home_hero: [["eyebrow", "Accroche"], ["title", "Titre principal"], ["body", "Texte de présentation"], ["promise_title", "Titre de la promesse"], ["promise_body", "Texte de la promesse"], ["closing_title", "Phrase de clôture"], ["categories_eyebrow", "Accroche des catégories"], ["categories_title", "Titre des catégories"], ["categories_description", "Description des catégories"], ["featured_eyebrow", "Accroche des coups de cœur"], ["featured_title", "Titre des coups de cœur"], ["offer_eyebrow", "Accroche des offres"], ["delivery_eyebrow", "Accroche livraison"]],
  promo_banner: [["title", "Titre de l’offre"], ["body", "Description"]],
  home_message: [["title", "Titre"], ["body", "Texte"]],
  delivery_message: [["title", "Titre"], ["body", "Texte"]],
  store_contact: [["phone", "Téléphone"], ["email", "E-mail"], ],
};
const labels: Record<ContentKey, string> = { branding: "Identité & logo", home_hero: "Accueil & visuels", promo_banner: "Offre mise en avant", home_message: "Message du site", delivery_message: "Livraison", store_contact: "Coordonnées" };

export default function WebsiteContent() {
  const [values, setValues] = useState<Record<ContentKey, Content>>(defaults);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { void (async () => {
    const { data, error } = await requireSupabase().from("site_settings").select("key,value");
    if (error) { setMessage("Le contenu du site n’a pas pu être chargé. Réessayez."); return; }
    const next = { ...defaults };
    for (const row of data || []) if (row.key in next) next[row.key as ContentKey] = { ...next[row.key as ContentKey], ...(row.value as Content) };
    setValues(next);
  })(); }, []);
  function setField(key: ContentKey, field: string, value: string | boolean) { setValues(old => ({ ...old, [key]: { ...old[key], [field]: value } })); }
  async function save(e: FormEvent<HTMLFormElement>, key: ContentKey) {
    e.preventDefault(); setBusy(true); const { error } = await requireSupabase().from("site_settings").upsert({ key, value: values[key] });
    setMessage(error ? `Impossible d’enregistrer ${labels[key].toLowerCase()}. Réessayez.` : `${labels[key]} enregistrée. Les visiteurs verront la mise à jour immédiatement.`); setBusy(false);
  }
  async function upload(file: File | undefined, key: ContentKey, field: string) {
    if (!file) return; setBusy(true); const path = `site/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`; const s = requireSupabase();
    const { error } = await s.storage.from("product-images").upload(path, file);
    if (error) setMessage("Cette image n’a pas pu être envoyée. Réessayez."); else setField(key, field, s.storage.from("product-images").getPublicUrl(path).data.publicUrl); setBusy(false);
  }
  return <AdminGuard><AdminShell><Head kicker="SITE / CONTENU" title="Contenu du site" copy="Modifiez l’identité, les textes principaux et les visuels déjà utilisés sur le site public." />
    {message && <div className="error" style={{ marginBottom: 14 }}>{message}</div>}
    <section className="cms-site-grid">{(Object.keys(defaults) as ContentKey[]).map(key => <form key={key} className="card" onSubmit={e => void save(e, key)} style={{ display: "grid", alignContent: "start", gap: 12 }}><div><p className="eyebrow">Configuration publique</p><h2>{labels[key]}</h2></div>
      {key === "promo_banner" && <label><input type="checkbox" checked={Boolean(values[key].enabled)} onChange={e => setField(key, "enabled", e.target.checked)} /> Offre active</label>}
      {fields[key].map(([field, label]) => <label key={field} className="cms-input">{label}{(field === "body" || field === "promise_body") ? <textarea rows={3} value={String(values[key][field] ?? "")} onChange={e => setField(key, field, e.target.value)} /> : <input value={String(values[key][field] ?? "")} onChange={e => setField(key, field, e.target.value)} />}</label>)}
      {(key === "branding" || key === "home_hero") && <div className="cms-site-image">{String(values[key][key === "branding" ? "logo_url" : "image_url"] || "") && <img src={String(values[key][key === "branding" ? "logo_url" : "image_url"])} alt="Aperçu de l’image"/>}<label className="btn"><ImagePlus size={15}/>{key === "branding" ? "Choisir un logo" : "Choisir une image de couverture"}<input type="file" accept="image/*" hidden onChange={e => void upload(e.target.files?.[0], key, key === "branding" ? "logo_url" : "image_url")} /></label></div>}
      <button className="btn primary" style={{ justifySelf: "start" }} disabled={busy}><Save size={15}/>Enregistrer</button>
    </form>)}</section>
  </AdminShell></AdminGuard>;
}
