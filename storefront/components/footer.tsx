"use client";

import { useSiteBrand } from "@/lib/use-site-brand";
import Link from "next/link";


export function Footer() {
  const brand = useSiteBrand();
  const whatsappUrl = "https://wa.me/237674783984";
  const instagramUrl = "https://www.instagram.com/christbenil?stkn=MXZibXFhN3pycXRrZQ==";
  const facebookUrl = "https://www.facebook.com/share/p/1Cd9o6njkW/";
  return (
    <footer id="contact" className="full-bleed-footer">
      <div className="mx-auto grid w-full gap-8 bg-[#172033] px-6 py-12 text-white sm:px-10 lg:grid-cols-[1.1fr_.9fr_.9fr] lg:px-[max(2.5rem,calc((100vw-82rem)/2))]">
        <div>
          <div className="mb-5 h-20 w-28 overflow-hidden rounded-2xl bg-white">
            <img src={brand.logo_url} alt={brand.site_name} className="h-full w-full object-contain" />
          </div>
          <p className="max-w-sm text-base leading-7 text-white/70">{brand.tagline}</p>
        </div>
        <div>
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.14em] text-white/45">Explorer</p>
          <div className="grid gap-3 text-white/78">
            <Link href="/catalogue">Tous les produits</Link>
            <Link href="/suivi">Suivre une commande</Link>
            <Link href="/connexion">Mon compte</Link>
          </div>
        </div>
        <div>
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.14em] text-white/45">Nous joindre</p>
          <div className="flex gap-3">
            <a href={whatsappUrl} target="_blank" rel="noreferrer" className="footer-social footer-whatsapp" aria-label="Nous contacter sur WhatsApp"><svg viewBox="0 0 32 32" aria-hidden><path d="M16 3.3A12.6 12.6 0 0 0 5.2 22.4L3.5 28.5l6.3-1.7A12.7 12.7 0 1 0 16 3.3Zm0 22.9c-2 0-3.9-.5-5.6-1.5l-.4-.2-3.7 1 1-3.6-.3-.4A10.5 10.5 0 1 1 16 26.2Zm5.8-7.8c-.3-.2-1.8-.9-2.1-1s-.5-.2-.7.2-.8 1-.9 1.2-.3.3-.6.1a8.6 8.6 0 0 1-2.5-1.5 9.4 9.4 0 0 1-1.8-2.2c-.2-.3 0-.5.1-.6l.5-.6c.2-.2.2-.3.3-.5s0-.4 0-.5l-1-2.3c-.2-.5-.5-.4-.7-.4h-.6c-.2 0-.5.1-.8.4s-1 1-1 2.3 1 2.6 1.1 2.8c.1.2 2 3.1 4.9 4.3.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.6-.1 1.8-.7 2.1-1.3s.3-1.2.2-1.3-.2-.2-.5-.4Z"/></svg></a>
            <a href={instagramUrl} target="_blank" rel="noreferrer" className="footer-social footer-instagram" aria-label="Suivez-nous sur Instagram"><svg viewBox="0 0 24 24" aria-hidden><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.4" cy="6.7" r="1"/></svg></a>
            <a href={facebookUrl} target="_blank" rel="noreferrer" className="footer-social footer-facebook" aria-label="Suivez-nous sur Facebook"><svg viewBox="0 0 24 24" aria-hidden><path d="M14 21v-8h2.8l.4-3H14V8.1c0-.9.3-1.6 1.7-1.6H17V3.8c-.3 0-1.2-.1-2.2-.1-2.2 0-3.8 1.4-3.8 4V10H8.5v3H11v8h3Z"/></svg></a>
          </div>
          {brand.phone && <a className="mt-4 block text-sm text-white/70" href={`tel:${brand.phone}`}>{brand.phone}</a>}
          {brand.email && <a className="mt-2 block text-sm text-white/70" href={`mailto:${brand.email}`}>{brand.email}</a>}
          <p className="mt-5 text-sm text-white/55">© {new Date().getFullYear()} {brand.site_name}</p>
        </div>
      </div>
    </footer>
  );
}
