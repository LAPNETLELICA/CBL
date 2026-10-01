"use client";

import { FormEvent, useEffect, useState } from "react";
import { ImagePlus, Plus, Save, Trash2 } from "lucide-react";
import { AdminGuard } from "@/components/guard";
import { AdminShell, Head } from "@/components/shell";
import { requireSupabase } from "@/lib/supabase";

type Section = { id: string; slug: string; title: string; description: string; layout: "cards" | "feature"; display_order: number; active: boolean };
type Article = { id: string; section_id: string; slug: string; title: string; excerpt: string; body: string; image_url: string | null; display_order: number; active: boolean };
const slugify = (v: string) => v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const blankSection = { id: "", slug: "", title: "", description: "", layout: "cards" as "cards" | "feature", display_order: "0", active: true };
const blankArticle = { id: "", section_id: "", slug: "", title: "", excerpt: "", body: "", image_url: "", display_order: "0", active: true };

export default function ContentManagement() {
  const [sections, setSections] = useState<Section[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [sectionForm, setSectionForm] = useState(blankSection);
  const [articleForm, setArticleForm] = useState(blankArticle);
  const [selectedSection, setSelectedSection] = useState("all");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function load() {
    const s = requireSupabase();
    const [a, b] = await Promise.all([s.from("site_sections").select("*").order("display_order"), s.from("site_articles").select("*").order("display_order")]);
    setSections((a.data || []) as Section[]); setArticles((b.data || []) as Article[]);
    if (!articleForm.section_id && a.data?.[0]) setArticleForm(v => ({ ...v, section_id: a.data![0].id }));
    if (a.error || b.error) setMessage("Le contenu n’a pas pu être chargé. Réessayez.");
  }
  useEffect(() => { void load(); }, []);
  async function saveSection(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); const payload = { slug: slugify(sectionForm.slug || sectionForm.title), title: sectionForm.title.trim(), description: sectionForm.description.trim(), layout: sectionForm.layout, display_order: Number(sectionForm.display_order), active: sectionForm.active };
    const s = requireSupabase(); const result = sectionForm.id ? await s.from("site_sections").update(payload).eq("id", sectionForm.id) : await s.from("site_sections").insert(payload);
    setMessage(result.error ? "La section n’a pas pu être enregistrée. Réessayez." : "Section enregistrée."); if (!result.error) { setSectionForm(blankSection); await load(); } setBusy(false);
  }
  async function saveArticle(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); const payload = { section_id: articleForm.section_id, slug: slugify(articleForm.slug || articleForm.title), title: articleForm.title.trim(), excerpt: articleForm.excerpt.trim(), body: articleForm.body.trim(), image_url: articleForm.image_url || null, display_order: Number(articleForm.display_order), active: articleForm.active };
    const s = requireSupabase(); const result = articleForm.id ? await s.from("site_articles").update(payload).eq("id", articleForm.id) : await s.from("site_articles").insert(payload);
    setMessage(result.error ? "Le contenu n’a pas pu être enregistré. Réessayez." : "Contenu enregistré."); if (!result.error) { setArticleForm({ ...blankArticle, section_id: sections[0]?.id || "" }); await load(); } setBusy(false);
  }
  async function upload(file?: File) {
    if (!file) return; setBusy(true); const path = `content/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`; const s = requireSupabase();
    const { error } = await s.storage.from("product-images").upload(path, file); if (error) setMessage("Cette image n’a pas pu être envoyée. Réessayez."); else setArticleForm(v => ({ ...v, image_url: s.storage.from("product-images").getPublicUrl(path).data.publicUrl })); setBusy(false);
  }
  async function removeSection(section: Section) {
    if (!window.confirm(`Supprimer « ${section.title} » et son contenu associé ?`)) return;
    const { error } = await requireSupabase().from("site_sections").delete().eq("id", section.id); setMessage(error ? "La section n’a pas pu être supprimée. Réessayez." : "Section supprimée."); await load();
  }
  async function removeArticle(article: Article) {
    if (!window.confirm(`Supprimer « ${article.title} » ?`)) return;
    const { error } = await requireSupabase().from("site_articles").delete().eq("id", article.id); setMessage(error ? "Le contenu n’a pas pu être supprimé. Réessayez." : "Contenu supprimé."); await load();
  }
  const visibleArticles = articles.filter(a => selectedSection === "all" || a.section_id === selectedSection);
  return <AdminGuard><AdminShell>
    <Head kicker="SITE / CONTENU" title="Sections & articles" copy="Créez et organisez les contenus éditoriaux affichés sur la page d’accueil." />
    {message && <div className="error" style={{ marginBottom: 14 }}>{message}</div>}
    <section className="layout-2">
      <form className="card" onSubmit={saveSection} style={{ display: "grid", gap: 12 }}><h2>{sectionForm.id ? "Modifier la section" : "Nouvelle section"}</h2><div className="cms-fields"><label>Titre<input required value={sectionForm.title} onChange={e => setSectionForm(v => ({ ...v, title: e.target.value, slug: v.id ? v.slug : slugify(e.target.value) }))} /></label><label>Affichage<select value={sectionForm.layout} onChange={e => setSectionForm(v => ({ ...v, layout: e.target.value as "cards" | "feature" }))}><option value="cards">Grille de cartes</option><option value="feature">Mise en avant</option></select></label><label className="cms-wide">Introduction<textarea rows={2} value={sectionForm.description} onChange={e => setSectionForm(v => ({ ...v, description: e.target.value }))} /></label></div><div style={{ display: "flex", gap: 10 }}><label><input type="checkbox" checked={sectionForm.active} onChange={e => setSectionForm(v => ({ ...v, active: e.target.checked }))} /> Publiée</label><button className="btn primary" disabled={busy}><Save size={15}/>Enregistrer</button>{sectionForm.id && <button type="button" className="btn ghost" onClick={() => setSectionForm(blankSection)}>Annuler</button>}</div></form>
      <div className="card"><h2>Sections du site ({sections.length})</h2><div style={{ display: "grid", gap: 8, marginTop: 12 }}>{sections.map(section => <div key={section.id} className="content-row"><button className="content-select" onClick={() => setSelectedSection(section.id)}><b>{section.title}</b><span>{articles.filter(a => a.section_id === section.id).length} contenus · {section.active ? "Publié" : "Masqué"}</span></button><button className="btn ghost" onClick={() => setSectionForm({ ...section, display_order: String(section.display_order) })}>Modifier</button><button className="btn ghost" aria-label={`Supprimer ${section.title}`} onClick={() => void removeSection(section)}><Trash2 size={15}/></button></div>)}</div></div>
    </section>
    <form className="card" onSubmit={saveArticle} style={{ display: "grid", gap: 12, marginTop: 16 }}><h2>{articleForm.id ? "Modifier le contenu" : "Ajouter un article / contenu"}</h2><div className="cms-fields"><label>Section<select required value={articleForm.section_id || sections[0]?.id || ""} onChange={e => setArticleForm(v => ({ ...v, section_id: e.target.value }))}><option value="">Sélectionner une section</option>{sections.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}</select></label><label>Titre<input required value={articleForm.title} onChange={e => setArticleForm(v => ({ ...v, title: e.target.value, slug: v.id ? v.slug : slugify(e.target.value) }))} /></label><label className="cms-wide">Résumé<textarea rows={2} value={articleForm.excerpt} onChange={e => setArticleForm(v => ({ ...v, excerpt: e.target.value }))} /></label><label className="cms-wide">Texte<textarea rows={5} value={articleForm.body} onChange={e => setArticleForm(v => ({ ...v, body: e.target.value }))} /></label></div><div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}><div className="cms-article-image">{articleForm.image_url && <img src={articleForm.image_url} alt="Aperçu du contenu"/>}<label className="btn"><ImagePlus size={15}/>{articleForm.image_url ? "Changer l’image" : "Ajouter une image"}<input type="file" accept="image/*" hidden onChange={e => void upload(e.target.files?.[0])} /></label></div><label><input type="checkbox" checked={articleForm.active} onChange={e => setArticleForm(v => ({ ...v, active: e.target.checked }))} /> Publié</label><button className="btn primary" disabled={busy || !sections.length}><Plus size={15}/>Enregistrer</button>{articleForm.id && <button type="button" className="btn ghost" onClick={() => setArticleForm({ ...blankArticle, section_id: sections[0]?.id || "" })}>Annuler</button>}</div></form>
    <div className="card table-wrap" style={{ marginTop: 16 }}><div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12 }}><h2>Contenu existant ({visibleArticles.length})</h2><select value={selectedSection} onChange={e => setSelectedSection(e.target.value)}><option value="all">Toutes les sections</option>{sections.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}</select></div><table className="table"><thead><tr><th>Titre</th><th>Section</th><th>État</th><th/></tr></thead><tbody>{visibleArticles.map(article => <tr key={article.id}><td><b>{article.title}</b><div className="sub">{article.excerpt}</div></td><td>{sections.find(s => s.id === article.section_id)?.title || "—"}</td><td>{article.active ? "Publié" : "Brouillon"}</td><td><button className="btn ghost" onClick={() => setArticleForm({ ...article, image_url: article.image_url || "", display_order: String(article.display_order) })}>Modifier</button> <button className="btn ghost" onClick={() => void removeArticle(article)}><Trash2 size={15}/></button></td></tr>)}</tbody></table></div>
  </AdminShell></AdminGuard>;
}
