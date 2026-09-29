"use client";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { LoaderCircle, LogOut, Package, Save, UserRound } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { getSupabaseClient } from "@/lib/supabase/client";
import { formatFcfa } from "@/lib/catalog";

type Profile = { full_name: string | null; phone: string | null; role: string };
type Order = { id:string; order_number:string; status:string; payment_status:string; total_fcfa:number; created_at:string };
export default function ProfilePage(){
  const { user, loading, signOut } = useAuth(); const [profile,setProfile]=useState<Profile|null>(null); const [orders,setOrders]=useState<Order[]>([]); const [busy,setBusy]=useState(false); const [message,setMessage]=useState("");
  useEffect(()=>{ const s=getSupabaseClient(); if(!s||!user)return; void Promise.all([s.from("profiles").select("full_name,phone,role").eq("id",user.id).single(),s.from("orders").select("id,order_number,status,payment_status,total_fcfa,created_at").order("created_at",{ascending:false})]).then(([p,o])=>{ if(p.data)setProfile(p.data as Profile); if(o.data)setOrders(o.data as Order[]); }); },[user]);
  async function save(e:FormEvent<HTMLFormElement>){ e.preventDefault(); if(!user)return; setBusy(true); setMessage(""); const f=new FormData(e.currentTarget); const s=getSupabaseClient(); const {error}=await s!.from("profiles").update({full_name:String(f.get("fullName")||""),phone:String(f.get("phone")||"")}).eq("id",user.id); setMessage(error?error.message:"Profil enregistré."); setBusy(false); }
  if(loading) return <main className="page-shell grid min-h-screen place-items-center"><LoaderCircle className="animate-spin"/></main>;
  if(!user) return <main className="page-shell grid min-h-screen place-items-center pt-24"><div className="glass rounded-[2rem] p-10 text-center"><UserRound className="mx-auto"/><h1 className="display-type mt-5 text-5xl">Votre espace personnel.</h1><p className="mt-3 text-ink/60">Connectez-vous par OTP pour gérer votre profil et vos commandes.</p><Link href="/connexion" className="dark-button mt-7">Se connecter</Link></div></main>;
  return <main className="page-shell pb-24 pt-36"><div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
    <section className="glass rounded-[2rem] p-6 sm:p-8"><p className="eyebrow">Profil</p><h1 className="display-type text-5xl">Bonjour.</h1><p className="mt-2 text-ink/55">{user.email ?? user.phone}</p>{profile&&<form onSubmit={save} className="mt-7 grid gap-4"><label className="field-label">Nom complet<input className="field" name="fullName" defaultValue={profile.full_name??""}/></label><label className="field-label">Téléphone<input className="field" name="phone" defaultValue={profile.phone??""}/></label>{message&&<p className="rounded-xl bg-white/60 p-3 text-sm font-semibold">{message}</p>}<button className="dark-button" disabled={busy}>{busy?<LoaderCircle className="animate-spin" size={18}/>:<Save size={18}/>} Enregistrer</button></form>}<button onClick={()=>void signOut()} className="outline-button mt-3 w-full"><LogOut size={17}/>Déconnexion</button></section>
    <section className="glass rounded-[2rem] p-6 sm:p-8"><div className="flex items-center justify-between"><div><p className="eyebrow">Historique</p><h2 className="display-type text-4xl">Mes commandes</h2></div><Package/></div><div className="mt-6 grid gap-3">{orders.length===0?<p className="rounded-2xl border border-dashed border-ink/15 p-8 text-center text-ink/55">Aucune commande liée à ce compte pour le moment.</p>:orders.map(o=><article key={o.id} className="rounded-2xl border border-white/70 bg-white/55 p-4"><div className="flex flex-wrap justify-between gap-3"><div><p className="font-black">{o.order_number}</p><p className="text-sm text-ink/50">{new Date(o.created_at).toLocaleDateString("fr-FR")} · {o.status}</p></div><div className="text-right"><p className="font-black">{formatFcfa(o.total_fcfa)}</p><p className="text-sm text-ink/50">{o.payment_status}</p></div></div></article>)}</div></section>
  </div></main>;
}
