"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Activity, Boxes, ChevronLeft, ChevronRight, FileText, Globe, LayoutDashboard, LogOut, Menu, MessageSquareQuote, Percent, Settings2, Shield, ShoppingCart, Truck, UsersRound, X, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";

const groups = [
  { title: "Pilotage", items: [{ href: "/", label: "Vue d’ensemble", icon: LayoutDashboard }] },
  { title: "Commerce", items: [{ href: "/catalog", label: "Catalogue", icon: Boxes }, { href: "/orders", label: "Commandes", icon: ShoppingCart }, { href: "/promotions", label: "Promotions", icon: Percent }, { href: "/delivery", label: "Livraison", icon: Truck }] },
  { title: "Site", items: [{ href: "/website", label: "Contenu du site", icon: Globe }, { href: "/content", label: "Pages & sections", icon: FileText }, { href: "/reviews", label: "Avis & commentaires", icon: MessageSquareQuote }] },
  { title: "Équipe", items: [{ href: "/users", label: "Utilisateurs & rôles", icon: UsersRound }, { href: "/system", label: "Activité & réglages", icon: Activity }] },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => { setCollapsed(localStorage.getItem("cbl-admin-nav-collapsed") === "true"); }, []);
  useEffect(() => { localStorage.setItem("cbl-admin-nav-collapsed", String(collapsed)); }, [collapsed]);
  useEffect(() => { setMobileOpen(false); }, [pathname]);
  return <div className={`admin-bg ${collapsed ? "nav-collapsed" : ""}`}>
    {mobileOpen && <button className="nav-scrim" aria-label="Fermer le menu" onClick={() => setMobileOpen(false)} />}
    <button className="mobile-nav-trigger" aria-label={mobileOpen ? "Fermer la navigation" : "Ouvrir la navigation"} onClick={() => setMobileOpen(value => !value)}>{mobileOpen ? <X size={20}/> : <Menu size={20}/>}</button>
    <aside className={`rail ${mobileOpen ? "mobile-open" : ""}`}>
      <Link href="/" className="admin-brand" aria-label="CBL Control — accueil"><Image src="/brand/christ-beni-logo.jpg" width={42} height={42} alt=""/><div><b>CBL Control</b><span>Administration</span></div></Link>
      <button className="collapse-toggle" onClick={() => setCollapsed(value => !value)} aria-label={collapsed ? "Développer la navigation" : "Réduire la navigation"} title={collapsed ? "Développer" : "Réduire"}>{collapsed ? <ChevronRight size={18}/> : <><ChevronLeft size={18}/><span>Réduire le menu</span></>}</button>
      <nav aria-label="Navigation principale">{groups.map(group => <div className="nav-group" key={group.title}><p className="nav-group-title">{group.title}</p>{group.items.map(item => { const Icon = item.icon; const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href); return <Link key={item.href} href={item.href} className={`rail-link ${active ? "active" : ""}`} title={collapsed ? item.label : undefined} aria-current={active ? "page" : undefined}><Icon size={18}/><span>{item.label}</span></Link>; })}</div>)}</nav>
      <button className="rail-link logout-link" onClick={async () => { await getSupabase()?.auth.signOut(); router.replace("/login"); }} title={collapsed ? "Déconnexion" : undefined}><LogOut size={18}/><span>Déconnexion</span></button>
    </aside>
    <main className="admin-main">{children}</main>
  </div>;
}

export function Head({ kicker, title, copy, actions }: { kicker: string; title: string; copy?: string; actions?: React.ReactNode }) { return <header className="head"><div><p>{kicker}</p><h1>{title}</h1>{copy && <span>{copy}</span>}</div><div className="head-actions">{actions}<a className="btn ghost site-preview-link" href={process.env.NEXT_PUBLIC_STOREFRONT_URL || "http://localhost:3000"} target="_blank" rel="noreferrer"><ExternalLink size={15}/>Voir le site</a><Shield className="head-icon"/></div></header>; }
