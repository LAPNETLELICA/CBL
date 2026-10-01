"use client";

import { useSiteBrand } from "@/lib/use-site-brand";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, Check, Menu, ShoppingBag, UserRound, X } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useStore } from "@/components/store-provider";
import { useAuth } from "@/components/auth-provider";

const links = [
  { href: "/", label: "Accueil" },
  { href: "/catalogue", label: "Catalogue" },
  { href: "/suivi", label: "Suivre ma commande" },
  { href: "/#contact", label: "Contact" },
];

export function Navigation() {
  const brand = useSiteBrand();
  const { itemCount, setCartOpen, cartNotice, dismissCartNotice } = useStore();
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [staffRole, setStaffRole] = useState<"system_admin" | "store_manager" | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => setMenuOpen(false), [pathname]);
  useEffect(() => {
    let previous = window.scrollY; let ticking = false;
    const update = () => { const current = window.scrollY; setHidden(current > 120 && current > previous); previous = current; ticking = false; };
    const onScroll = () => { if (!ticking) { ticking = true; window.requestAnimationFrame(update); } };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    let alive = true;
    setStaffRole(null);
    if (!user) return () => { alive = false; };
    void getSupabaseClient()?.from("profiles").select("role,active").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (alive && data?.active && (data.role === "system_admin" || data.role === "store_manager")) setStaffRole(data.role);
    });
    return () => { alive = false; };
  }, [user]);

  const accountHref = user ? "/profil" : "/connexion";
  const adminHref = staffRole === "store_manager"
    ? (process.env.NEXT_PUBLIC_MANAGER_URL || "http://localhost:3001")
    : (process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3002");

  function goBack() {
    const cameFromThisSite = document.referrer.startsWith(window.location.origin);
    if (cameFromThisSite && window.history.length > 1) router.back();
    else router.push("/");
  }

  return (
    <>
      <header className={`fixed inset-x-0 top-0 z-50 px-3 pt-3 transition-transform duration-300 sm:px-5 sm:pt-4 ${hidden && !menuOpen ? "-translate-y-[120%]" : "translate-y-0"}`}>
        <div className="glass mx-auto flex min-h-[4.75rem] max-w-[82rem] items-center justify-between rounded-[1.45rem] px-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-2">

            <Link href="/" aria-label={`${brand.site_name} — accueil`} className="flex items-center">
              <span className="grid h-14 w-20 place-items-center overflow-hidden rounded-2xl bg-white sm:w-24">
                <img src={brand.logo_url} alt={brand.site_name} className="h-full w-full object-contain" />
              </span>
            </Link>
          </div>
          <nav className="hidden items-center gap-7 md:flex">
            {links.map((link) => <Link key={link.href} href={link.href} className={`text-sm font-semibold transition-colors hover:text-[#267fa6] ${pathname === link.href ? "text-[#267fa6]" : "text-ink"}`}>{link.label}</Link>)}
          </nav>
          <div className="flex shrink-0 items-center gap-2">
            {staffRole && <Link href={adminHref} className="hidden items-center gap-2 rounded-full border border-ink/15 bg-white/70 px-4 py-2 text-sm font-semibold text-ink hover:bg-white lg:inline-flex">{staffRole === "store_manager" ? "Gestion boutique" : "Administration"}</Link>}
            <Link href={accountHref} className="icon-button inline-flex" aria-label="Mon compte"><UserRound size={19} />{user && <span className="absolute h-2 w-2 translate-x-4 -translate-y-4 rounded-full bg-emerald-500" />}</Link>
            <button type="button" className="icon-button relative" onClick={() => setCartOpen(true)} aria-label={`Panier, ${itemCount} article${itemCount > 1 ? "s" : ""}`}><ShoppingBag size={19} />{itemCount > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#ef6f9a] px-1 text-[11px] font-bold text-white">{itemCount}</span>}</button>
            <button type="button" className="icon-button md:hidden" onClick={() => setMenuOpen((open) => !open)} aria-label="Menu">{menuOpen ? <X size={20} /> : <Menu size={20} />}</button>
          </div>
        </div>
        {menuOpen && <nav className="glass mx-auto mt-2 grid max-w-[82rem] gap-1 rounded-[1.4rem] p-3 md:hidden">
          {links.map((link) => <Link key={link.href} href={link.href} className="rounded-2xl px-4 py-3 font-semibold hover:bg-white/60">{link.label}</Link>)}
          <Link href={accountHref} className="rounded-2xl px-4 py-3 font-semibold hover:bg-white/60">{user ? "Mon profil" : "Connexion / inscription"}</Link>
          {staffRole && <Link href={adminHref} className="rounded-2xl px-4 py-3 font-semibold hover:bg-white/60">{staffRole === "store_manager" ? "Retour à la gestion boutique" : "Retour à l’administration"}</Link>}
        </nav>}
      </header>
      {pathname !== "/" && <button type="button" onClick={goBack} className="floating-back-button" aria-label="Retour à la page précédente" title="Retour"><ArrowLeft size={19} /></button>}
      {cartNotice && <div className="fixed bottom-5 left-4 right-4 z-[90] mx-auto flex max-w-lg items-center gap-3 rounded-2xl border border-emerald-200 bg-white p-4 text-sm font-semibold text-ink shadow-xl" role="status" aria-live="polite">
        <Check className="shrink-0 text-emerald-700" size={19} />
        <span className="min-w-0 flex-1">{cartNotice}</span>
        <button type="button" className="shrink-0 font-bold text-[#267fa6] underline underline-offset-4" onClick={() => { dismissCartNotice(); setCartOpen(true); }}>Voir le panier</button>
        <button type="button" className="shrink-0 p-1 text-ink/55" onClick={dismissCartNotice} aria-label="Fermer la notification"><X size={17} /></button>
      </div>}
    </>
  );
}
