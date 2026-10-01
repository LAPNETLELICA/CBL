"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { ArrowLeft, Boxes, ImagePlus, Plus, Save, Trash2, Upload, X } from "lucide-react";
import { AdminGuard } from "@/components/guard";
import { AdminShell, Head } from "@/components/shell";
import { requireSupabase } from "@/lib/supabase";
import { fcfa } from "@/lib/format";

type Category = { id: string; slug: string; name: string; description: string; hero_image_url: string | null; accent: string; display_order: number; active: boolean };
type Product = { id: string; category_id: string; slug: string; sku: string; name: string; description: string; product_type: string; specifications: Record<string, unknown>; price_fcfa: number; stock_quantity: number; age_group: string | null; size_label: string | null; gender: string | null; color: string | null; cover_image_url: string | null; featured: boolean; active: boolean };
type ProductImage = { id: string; storage_path: string; alt_text: string; sort_order: number };
type ProductForm = { id: string; category_id: string; name: string; description: string; price_fcfa: string; stock_quantity: string; age_group: string; size_label: string; gender: string; color: string; cover_image_url: string; characteristics: string; featured: boolean; active: boolean };
const blankProduct: ProductForm = { id: "", category_id: "", name: "", description: "", price_fcfa: "", stock_quantity: "0", age_group: "", size_label: "", gender: "Mixte", color: "", cover_image_url: "", characteristics: "", featured: false, active: true };
const slugify = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const formatCharacteristics = (value: Record<string, unknown>) => Object.entries(value || {}).map(([key, val]) => `${key}: ${String(val)}`).join("\n");
const parseCharacteristics = (value: string) => Object.fromEntries(value.split("\n").map(line => line.split(":")).filter(parts => parts.length >= 2 && parts[0].trim()).map(([key, ...rest]) => [key.trim(), rest.join(":").trim()]));

export default function Catalog() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [extraFiles, setExtraFiles] = useState<File[]>([]);
  const [tab, setTab] = useState<"products" | "categories">("products");
  const [mode, setMode] = useState<"choose" | "new-type" | "existing-type" | "edit">("choose");
  const [productForm, setProductForm] = useState<ProductForm>(blankProduct);
  const [categoryForm, setCategoryForm] = useState({ id: "", slug: "", name: "", description: "", hero_image_url: "", accent: "#9EDAF0", display_order: "0", active: true });
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const s = requireSupabase();
    const [c, p] = await Promise.all([s.from("categories").select("*").order("display_order"), s.from("products").select("*").order("created_at", { ascending: false })]);
    if (c.error || p.error) setMessage("Le catalogue n’a pas pu être chargé. Réessayez.");
    setCategories((c.data || []) as Category[]); setProducts((p.data || []) as Product[]);
    if (!productForm.category_id && c.data?.[0]) setProductForm(v => ({ ...v, category_id: c.data![0].id }));
  }
  useEffect(() => { void load(); }, []);

  async function upload(file: File, folder: string) {
    const path = `${folder}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
    const s = requireSupabase(); const { error } = await s.storage.from("product-images").upload(path, file);
    if (error) throw error;
    return { path, url: s.storage.from("product-images").getPublicUrl(path).data.publicUrl };
  }
  async function uploadCover(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; if (!file) return; setBusy(true);
    try { const image = await upload(file, "catalog"); setProductForm(v => ({ ...v, cover_image_url: image.url })); setMessage("Image principale ajoutée."); }
    catch { setMessage("Cette image n’a pas pu être envoyée. Vérifiez son format et réessayez."); } finally { setBusy(false); event.target.value = ""; }
  }
  async function uploadCategoryImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; if (!file) return; setBusy(true);
    try { const image = await upload(file, "categories"); setCategoryForm(v => ({ ...v, hero_image_url: image.url })); }
    catch { setMessage("Cette image n’a pas pu être envoyée. Vérifiez son format et réessayez."); } finally { setBusy(false); event.target.value = ""; }
  }
  function selectExtraImages(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []).filter(file => file.type.startsWith("image/"));
    setExtraFiles(current => [...current, ...files]); event.target.value = "";
  }
  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const category = categories.find(item => item.id === productForm.category_id);
      if (!category) throw new Error("Choisissez un type de produit.");
      const slug = slugify(productForm.name);
      const payload = { category_id: category.id, slug: productForm.id ? products.find(p => p.id === productForm.id)?.slug || slug : `${slug}-${crypto.randomUUID().slice(0, 6)}`, sku: productForm.id ? products.find(p => p.id === productForm.id)?.sku || `CBL-${crypto.randomUUID().slice(0, 8).toUpperCase()}` : `CBL-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, product_type: category.name, name: productForm.name.trim(), description: productForm.description.trim(), specifications: parseCharacteristics(productForm.characteristics), price_fcfa: Number(productForm.price_fcfa), stock_quantity: Number(productForm.stock_quantity), age_group: productForm.age_group || null, size_label: productForm.size_label || null, gender: productForm.gender || null, color: productForm.color || null, cover_image_url: productForm.cover_image_url || null, featured: productForm.featured, active: productForm.active };
      const s = requireSupabase();
      const result = productForm.id ? await s.from("products").update(payload).eq("id", productForm.id).select("id").single() : await s.from("products").insert(payload).select("id").single();
      if (result.error) throw result.error;
      const productId = result.data.id;
      if (extraFiles.length) {
        const uploaded = await Promise.all(extraFiles.map(file => upload(file, `products/${productId}`)));
        const { error } = await s.from("product_images").insert(uploaded.map((image, index) => ({ product_id: productId, storage_path: image.path, alt_text: productForm.name, sort_order: images.length + index })));
        if (error) throw error;
      }
      setProductForm({ ...blankProduct, category_id: category.id }); setImages([]); setExtraFiles([]); setMode("choose"); setMessage("Produit enregistré et publié sur le catalogue."); await load();
    } catch { setMessage("Le produit n’a pas pu être enregistré. Vérifiez les informations et réessayez."); }
    finally { setBusy(false); }
  }
  async function saveCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    const payload = { slug: slugify(categoryForm.name), name: categoryForm.name.trim(), description: categoryForm.description.trim(), hero_image_url: categoryForm.hero_image_url || null, accent: categoryForm.accent, display_order: Number(categoryForm.display_order), active: categoryForm.active };
    const s = requireSupabase(); const result = categoryForm.id ? await s.from("categories").update(payload).eq("id", categoryForm.id) : await s.from("categories").insert(payload).select("id").single();
    if (result.error) setMessage("Le type de produit n’a pas pu être enregistré. Réessayez.");
    else {
      const id = categoryForm.id || ("data" in result ? result.data?.id : undefined);
      setMessage(categoryForm.id ? "Type de produit modifié." : "Nouveau type créé. Vous pouvez maintenant lui ajouter des produits.");
      setCategoryForm({ id: "", slug: "", name: "", description: "", hero_image_url: "", accent: "#9EDAF0", display_order: String(categories.length + 1), active: true }); await load();
      if (id) { setTab("products"); setProductForm({ ...blankProduct, category_id: id }); setMode("edit"); }
    }
    setBusy(false);
  }
  async function removeImage(image: ProductImage) {
    const s = requireSupabase(); const { error } = await s.from("product_images").delete().eq("id", image.id);
    if (error) setMessage("La photo n’a pas pu être retirée. Réessayez."); else { await s.storage.from("product-images").remove([image.storage_path]); setImages(current => current.filter(item => item.id !== image.id)); }
  }
  async function removeProduct(item: Product) {
    if (!window.confirm(`Supprimer le produit « ${item.name} » ? Cette action retire aussi ses images.`)) return;
    const { error } = await requireSupabase().from("products").delete().eq("id", item.id); setMessage(error ? "Le produit n’a pas pu être supprimé. Vérifiez qu’il n’est pas lié à une commande." : "Produit supprimé."); await load();
  }
  async function removeCategory(item: Category) {
    const used = products.some(product => product.category_id === item.id);
    if (!window.confirm(used ? `« ${item.name} » contient des produits. Supprimez ou déplacez-les avant de supprimer ce type.` : `Supprimer « ${item.name} » ?`)) return;
    const { error } = await requireSupabase().from("categories").delete().eq("id", item.id); setMessage(error ? "Ce type ne peut pas être supprimé tant qu’il contient des produits." : "Type supprimé."); await load();
  }
  async function editProduct(product: Product) {
    setMode("edit"); setTab("products"); setExtraFiles([]);
    setProductForm({ id: product.id, category_id: product.category_id, name: product.name, description: product.description, price_fcfa: String(product.price_fcfa), stock_quantity: String(product.stock_quantity), age_group: product.age_group || "", size_label: product.size_label || "", gender: product.gender || "Mixte", color: product.color || "", cover_image_url: product.cover_image_url || "", characteristics: formatCharacteristics(product.specifications), featured: product.featured, active: product.active });
    const { data } = await requireSupabase().from("product_images").select("id,storage_path,alt_text,sort_order").eq("product_id", product.id).order("sort_order"); setImages((data || []) as ProductImage[]); window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function startExistingType(categoryId: string) { setProductForm({ ...blankProduct, category_id: categoryId }); setImages([]); setExtraFiles([]); setMode("edit"); }

  return <AdminGuard><AdminShell><Head kicker="BOUTIQUE / CATALOGUE" title="Produits & types" copy="Créez des types de produits et gérez simplement leurs articles, photos, prix et disponibilité." actions={<button className="btn primary" onClick={() => { setMode("choose"); setTab("products"); }}><Plus size={16}/>Ajouter</button>} />
    {message && <div className="notice" role="status" style={{ marginBottom: 14 }}>{message}</div>}
    <div className="cms-tabs"><button className={`btn ${tab === "products" ? "primary" : "ghost"}`} onClick={() => setTab("products")}>Produits <span className="tag">{products.length}</span></button><button className={`btn ${tab === "categories" ? "primary" : "ghost"}`} onClick={() => { setTab("categories"); setMode("choose"); }}>Types de produits <span className="tag">{categories.length}</span></button></div>
    {tab === "products" && mode === "choose" && <section className="card cms-choice"><p className="eyebrow">NOUVEL ARTICLE</p><h2>Que souhaitez-vous ajouter ?</h2><div className="cms-choice-grid"><button className="cms-choice-card" onClick={() => { setTab("categories"); setCategoryForm({ id: "", slug: "", name: "", description: "", hero_image_url: "", accent: "#9EDAF0", display_order: String(categories.length + 1), active: true }); }}><span><Plus size={22}/></span><b>Créer un nouveau type de produit</b><small>Créez un rayon et choisissez son image.</small></button><button className="cms-choice-card" onClick={() => setMode("existing-type")}><span><Boxes size={22}/></span><b>Ajouter à un type existant</b><small>Choisissez d’abord la catégorie du produit.</small></button></div></section>}
    {tab === "products" && mode === "existing-type" && <section className="card"><button className="btn ghost" onClick={() => setMode("choose")}><ArrowLeft size={16}/>Retour</button><h2 style={{ marginTop: 14 }}>Dans quel type de produit l’ajouter ?</h2><div className="cms-category-select">{categories.filter(c => c.active).map(category => <button key={category.id} className="cms-type-card" onClick={() => startExistingType(category.id)}>{category.hero_image_url && <img src={category.hero_image_url} alt=""/>}<b>{category.name}</b><small>{products.filter(p => p.category_id === category.id).length} produit(s)</small></button>)}</div>{!categories.length && <p className="sub">Créez un type avant d’ajouter un produit.</p>}</section>}
    {tab === "products" && mode === "edit" && <form className="card" onSubmit={saveProduct} style={{ display: "grid", gap: 14, marginBottom: 16 }}><div className="cms-form-heading"><div><p className="eyebrow">{productForm.id ? "MODIFIER" : "NOUVEAU PRODUIT"}</p><h2>{productForm.id ? productForm.name : "Informations du produit"}</h2></div><button type="button" className="btn ghost" onClick={() => setMode("choose")}><X size={16}/>Fermer</button></div>
      <div className="cms-fields"><label>Nom du produit<input required value={productForm.name} onChange={e => setProductForm(v => ({ ...v, name: e.target.value }))} /></label><label>Type de produit<select required value={productForm.category_id} onChange={e => setProductForm(v => ({ ...v, category_id: e.target.value }))}>{categories.filter(c => c.active).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Prix (FCFA)<input type="number" min="0" required value={productForm.price_fcfa} onChange={e => setProductForm(v => ({ ...v, price_fcfa: e.target.value }))} /></label><label>Quantité disponible<input type="number" min="0" required value={productForm.stock_quantity} onChange={e => setProductForm(v => ({ ...v, stock_quantity: e.target.value }))} /></label><label>Âge concerné<input value={productForm.age_group} onChange={e => setProductForm(v => ({ ...v, age_group: e.target.value }))} placeholder="Ex. 0 à 6 mois" /></label><label>Taille<input value={productForm.size_label} onChange={e => setProductForm(v => ({ ...v, size_label: e.target.value }))} placeholder="Ex. 6 mois" /></label><label>Genre<select value={productForm.gender} onChange={e => setProductForm(v => ({ ...v, gender: e.target.value }))}><option>Mixte</option><option>Fille</option><option>Garçon</option></select></label><label>Couleur<input value={productForm.color} onChange={e => setProductForm(v => ({ ...v, color: e.target.value }))} /></label><label className="cms-wide">Description<textarea rows={3} value={productForm.description} onChange={e => setProductForm(v => ({ ...v, description: e.target.value }))} /></label><label className="cms-wide">Caractéristiques<textarea rows={3} value={productForm.characteristics} onChange={e => setProductForm(v => ({ ...v, characteristics: e.target.value }))} placeholder="Une caractéristique par ligne, par exemple :\nMatière : coton\nEntretien : lavage doux" /></label></div>
      <div className="cms-media-grid"><div className="cms-media-card"><b>Photo principale</b><p className="sub">C’est l’image affichée dans le catalogue.</p>{productForm.cover_image_url && <img className="cms-cover-preview" src={productForm.cover_image_url} alt="Aperçu du produit"/>}<label className="btn"><Upload size={16}/>Choisir une image<input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={e => void uploadCover(e)} /></label></div><div className="cms-media-card"><b>Photos supplémentaires</b><p className="sub">Vous pouvez sélectionner plusieurs photos.</p><label className="btn"><ImagePlus size={16}/>Ajouter des photos<input type="file" multiple accept="image/jpeg,image/png,image/webp" hidden onChange={selectExtraImages}/></label><div className="cms-thumbnails">{images.map(image => <div key={image.id}><img src={requireSupabase().storage.from("product-images").getPublicUrl(image.storage_path).data.publicUrl} alt={image.alt_text}/><button type="button" aria-label="Retirer cette photo" onClick={() => void removeImage(image)}><X size={13}/></button></div>)}{extraFiles.map((file,index)=><div key={`${file.name}-${index}`}><img src={URL.createObjectURL(file)} alt={file.name}/><button type="button" aria-label="Retirer cette photo" onClick={() => setExtraFiles(current => current.filter((_,i) => i !== index))}><X size={13}/></button></div>)}</div></div></div>
      <div className="cms-inline-options"><label><input type="checkbox" checked={productForm.featured} onChange={e => setProductForm(v => ({ ...v, featured: e.target.checked }))}/> Mettre en avant sur l’accueil</label><label><input type="checkbox" checked={productForm.active} onChange={e => setProductForm(v => ({ ...v, active: e.target.checked }))}/> Produit disponible sur le site</label><button className="btn primary" disabled={busy}><Save size={15}/>Enregistrer</button></div>
    </form>}
    {tab === "products" && mode !== "edit" && <div className="card table-wrap"><table className="table"><thead><tr><th>Produit</th><th>Type</th><th>Prix</th><th>Stock</th><th>Disponibilité</th><th>Actions</th></tr></thead><tbody>{products.map(product => <tr key={product.id}><td><b>{product.name}</b><div className="sub">{product.description}</div></td><td>{categories.find(c => c.id === product.category_id)?.name || "—"}</td><td>{fcfa(product.price_fcfa)}</td><td>{product.stock_quantity}</td><td><span className={`tag ${product.active ? "" : "danger"}`}>{product.active ? "Disponible" : "Masqué"}</span></td><td><button className="btn ghost" onClick={() => void editProduct(product)}>Modifier</button> <button className="btn ghost" aria-label={`Supprimer ${product.name}`} onClick={() => void removeProduct(product)}><Trash2 size={15}/></button></td></tr>)}</tbody></table>{!products.length && <p className="sub">Aucun produit enregistré.</p>}</div>}
    {tab === "categories" && <><form className="card" onSubmit={saveCategory} style={{ display: "grid", gap: 12, marginBottom: 16 }}><h2>{categoryForm.id ? "Modifier le type" : "Créer un type de produit"}</h2><div className="cms-fields"><label>Nom du type<input required value={categoryForm.name} onChange={e => setCategoryForm(v => ({ ...v, name: e.target.value }))} placeholder="Ex. Chaussures pour bébé" /></label><label className="cms-wide">Description courte<textarea rows={2} value={categoryForm.description} onChange={e => setCategoryForm(v => ({ ...v, description: e.target.value }))} /></label></div><div className="cms-inline-options"><label><input type="checkbox" checked={categoryForm.active} onChange={e => setCategoryForm(v => ({ ...v, active: e.target.checked }))}/> Visible sur le site</label><label className="btn"><Upload size={16}/>Choisir l’image du type<input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={e => void uploadCategoryImage(e)} /></label>{categoryForm.hero_image_url && <img className="cms-type-preview" src={categoryForm.hero_image_url} alt="Aperçu"/>}<button className="btn primary" disabled={busy}><Save size={15}/>Enregistrer</button></div></form><div className="card table-wrap"><table className="table"><thead><tr><th>Type de produit</th><th>Produits</th><th>État</th><th>Actions</th></tr></thead><tbody>{categories.map(category => <tr key={category.id}><td><b>{category.name}</b><div className="sub">{category.description}</div></td><td>{products.filter(p => p.category_id === category.id).length}</td><td>{category.active ? "Visible" : "Masqué"}</td><td><button className="btn ghost" onClick={() => setCategoryForm({ ...category, slug: category.slug, hero_image_url: category.hero_image_url || "", display_order: String(category.display_order) })}>Modifier</button> <button className="btn ghost" onClick={() => void removeCategory(category)}><Trash2 size={15}/></button></td></tr>)}</tbody></table></div></>}
  </AdminShell></AdminGuard>;
}
