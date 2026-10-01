"use client";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { LoaderCircle, LogOut, Package, Save, ShoppingBag, Star, UserRound } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { getSupabaseClient } from "@/lib/supabase/client";
import { formatFcfa } from "@/lib/catalog";
import { useStore } from "@/components/store-provider";

type Profile = { full_name: string | null };
type Order = { id: string; order_number: string; status: string; payment_status: string; total_fcfa: number; created_at: string };
type Review = { id: string; rating: number; comment: string; status: "pending" | "visible" | "hidden"; created_at: string };
const orderStatus: Record<string,string> = { PENDING:"En attente", CONFIRMED:"Validée", PREPARING:"En préparation", OUT_FOR_DELIVERY:"En livraison", DELIVERED:"Terminée", CANCELLED:"Annulée" };
const paymentStatus: Record<string,string> = { UNPAID:"À régler à la livraison", PENDING:"Paiement en attente", PAID:"Payé", FAILED:"Paiement non abouti", REFUNDED:"Remboursé" };
const reviewStatus: Record<Review["status"],string> = { pending:"En attente de validation", visible:"Publié", hidden:"Non publié" };
export default function ProfilePage() {
  const { user, loading, signOut } = useAuth();
  const { lines, itemCount, subtotal, setCartOpen } = useStore();
  const [profile,setProfile] = useState<Profile|null>(null);
  const [fullName,setFullName] = useState("");
  const [orders,setOrders] = useState<Order[]>([]);
  const [reviews,setReviews] = useState<Review[]>([]);
  const [reviewsAvailable,setReviewsAvailable] = useState(true);
  const [profileLoaded,setProfileLoaded] = useState(false);
  const [busy,setBusy] = useState(false);
  const [deliveryBusy,setDeliveryBusy] = useState("");
  const [message,setMessage] = useState("");
  useEffect(() => {
    const s=getSupabaseClient(); if(!s||!user)return;
    let active=true; setProfileLoaded(false); setReviewsAvailable(true);
    void Promise.all([
      s.from("profiles").select("full_name").eq("id",user.id).maybeSingle(),
      s.from("orders").select("id,order_number,status,payment_status,total_fcfa,created_at").eq("user_id",user.id).order("created_at",{ascending:false}),
      s.from("site_reviews").select("id,rating,comment,status,created_at").eq("user_id",user.id).order("created_at",{ascending:false}),
    ]).then(([p,o,r])=>{
      if(!active)return;
      const loadedProfile = p.data || {full_name:typeof user.user_metadata.full_name==="string"?user.user_metadata.full_name:null};
      setProfile(loadedProfile);
      setFullName(loadedProfile.full_name??"");
      setProfileLoaded(true);
      setOrders((o.data||[]) as Order[]);
      if(r.error)setReviewsAvailable(false);else setReviews((r.data||[]) as Review[]);
      if(p.error||o.error)setMessage("Certaines informations du compte ne sont pas disponibles pour le moment.");
    });
    return()=>{active=false};
  },[user]);
  async function save(e:FormEvent<HTMLFormElement>){
    e.preventDefault(); if(!user)return; setBusy(true); setMessage("");
    const form=new FormData(e.currentTarget); const nextName=String(form.get("fullName")||"").trim();
    const s=getSupabaseClient(); const {error}=await s!.from("profiles").update({full_name:nextName}).eq("id",user.id);
    if(error)setMessage("Vos informations n’ont pas pu être enregistrées. Réessayez.");else{setProfile({full_name:nextName});setFullName(nextName);setMessage("Vos informations ont été enregistrées.");}
    setBusy(false);
  }
  async function confirmDelivery(order:Order){
    if(!window.confirm(`Confirmez-vous avoir reçu la commande ${order.order_number} ?`))return;
    setDeliveryBusy(order.id);setMessage("");
    const {error}=await getSupabaseClient()!.rpc("customer_confirm_delivery",{p_order_id:order.id});
    if(error)setMessage("La réception n’a pas pu être confirmée. Vérifiez que la commande est bien en livraison.");
    else{setOrders(current=>current.map(item=>item.id===order.id?{...item,status:"DELIVERED"}:item));setMessage(`Réception de la commande ${order.order_number} confirmée.`);}
    setDeliveryBusy("");
  }
  if(loading)return <main className="page-shell grid min-h-screen place-items-center"><LoaderCircle className="animate-spin"/></main>;
  if(!user)return <main className="page-shell grid min-h-screen place-items-center pt-24"><div className="glass rounded-[2rem] p-8 text-center sm:p-10"><UserRound className="mx-auto"/><h1 className="display-type mt-5 text-4xl sm:text-5xl">Votre espace personnel.</h1><p className="mt-3 text-ink/60">Connectez-vous pour consulter vos informations et vos commandes.</p><Link href="/connexion" className="dark-button mt-7">Se connecter</Link><Link href="/inscription" className="outline-button mt-3">Créer un compte</Link></div></main>;
  return <main className="page-shell pb-24 pt-36"><div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
    <section className="glass min-w-0 rounded-[2rem] p-6 sm:p-8"><p className="eyebrow">Mon compte</p><h1 className="display-type text-4xl sm:text-5xl">Bonjour{profile?.full_name?`, ${profile.full_name}`:"."}</h1><form onSubmit={save} className="mt-7 grid gap-4"><label className="field-label">Nom complet<input className="field" name="fullName" value={fullName} onChange={event=>setFullName(event.target.value)}/></label><label className="field-label">Adresse e-mail<input className="field" value={user.email??"Adresse e-mail indisponible"} readOnly aria-readonly="true"/></label>{message&&<p role="status" className="rounded-xl bg-white/70 p-3 text-sm font-semibold">{message}</p>}<button className="dark-button" disabled={busy||!profileLoaded}>{busy?<LoaderCircle className="animate-spin" size={18}/>:<Save size={18}/>} Enregistrer mes informations</button></form><button onClick={()=>void signOut()} className="outline-button mt-3 w-full"><LogOut size={17}/>Déconnexion</button></section>
    <div className="grid min-w-0 content-start gap-6"><section className="glass min-w-0 rounded-[2rem] p-6 sm:p-8"><div className="flex items-center justify-between gap-3"><div><p className="eyebrow">Sélection</p><h2 className="display-type text-3xl sm:text-4xl">Mon panier</h2></div><ShoppingBag className="shrink-0"/></div>{lines.length===0?<p className="mt-5 rounded-2xl border border-dashed border-ink/15 p-5 text-center text-ink/60">Votre panier ne contient aucun article.</p>:<><div className="mt-5 grid gap-3">{lines.map(({product,quantity})=><div key={product.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/70 bg-white/55 p-4"><div><b>{product.name}</b><p className="text-sm text-ink/60">Quantité : {quantity}</p></div><b>{formatFcfa(product.price*quantity)}</b></div>)}</div><div className="mt-4 flex flex-wrap items-center justify-between gap-3"><b>Sous-total : {formatFcfa(subtotal)}</b><button type="button" onClick={()=>setCartOpen(true)} className="dark-button"><ShoppingBag size={17}/>Modifier le panier ({itemCount})</button></div></>}</section><section className="glass min-w-0 rounded-[2rem] p-6 sm:p-8"><div className="flex items-center justify-between gap-3"><div><p className="eyebrow">Achats</p><h2 className="display-type text-3xl sm:text-4xl">Mes commandes</h2></div><Package className="shrink-0"/></div><div className="mt-6 grid gap-3">{orders.length===0?<p className="rounded-2xl border border-dashed border-ink/15 p-6 text-center text-ink/60">Aucune commande liée à ce compte pour le moment.</p>:orders.map(o=><article key={o.id} className="rounded-2xl border border-white/70 bg-white/55 p-4"><div className="flex flex-wrap justify-between gap-3"><div><p className="font-black">Commande {o.order_number}</p><p className="text-sm text-ink/65">{new Date(o.created_at).toLocaleDateString("fr-FR")} · {orderStatus[o.status]||"En traitement"}</p><p className="text-sm text-ink/65">{paymentStatus[o.payment_status]||"Paiement en cours"}</p></div><p className="font-black">{formatFcfa(o.total_fcfa)}</p></div>{o.status==="OUT_FOR_DELIVERY"&&<button type="button" className="dark-button mt-4" disabled={deliveryBusy===o.id} onClick={()=>void confirmDelivery(o)}>{deliveryBusy===o.id?<LoaderCircle className="animate-spin" size={18}/>:<Package size={17}/>} Confirmer la réception</button>}{o.status==="DELIVERED"&&<p className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">Livraison reçue et confirmée</p>}</article>)}</div></section>
      <section className="glass min-w-0 rounded-[2rem] p-6 sm:p-8"><div className="flex items-center justify-between gap-3"><div><p className="eyebrow">Votre retour</p><h2 className="display-type text-3xl sm:text-4xl">Mes avis</h2></div><Star className="shrink-0"/></div>{!reviewsAvailable?<p className="mt-5 rounded-2xl border border-dashed border-ink/15 p-5 text-center text-ink/60">Vos avis ne sont pas disponibles pour le moment.</p>:reviews.length===0?<div className="mt-5 rounded-2xl border border-dashed border-ink/15 p-6 text-center"><p className="text-ink/60">Vous n’avez pas encore envoyé d’avis.</p><Link href="/#avis" className="outline-button mt-4">Donner mon avis</Link></div>:<div className="mt-5 grid gap-3">{reviews.map(review=><article key={review.id} className="rounded-2xl border border-white/70 bg-white/55 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><span className="rating-stars" aria-label={`${review.rating} sur 5`}> {"★".repeat(review.rating)}{"☆".repeat(5-review.rating)}</span><span className="text-sm text-ink/60">{reviewStatus[review.status]}</span></div>{review.comment&&<p className="mt-2 whitespace-pre-wrap">{review.comment}</p>}<small className="text-ink/55">{new Date(review.created_at).toLocaleDateString("fr-FR")}</small></article>)}</div>}</section></div>
  </div></main>;
}
