import Image from "next/image";
import Link from "next/link";
import { Instagram, MessageCircle } from "lucide-react";

export function Footer() {
  const whatsappUrl = process.env.NEXT_PUBLIC_WHATSAPP_URL;
  const instagramUrl = process.env.NEXT_PUBLIC_INSTAGRAM_URL;
  return (
    <footer className="px-3 pb-3 sm:px-5 sm:pb-5">
      <div className="mx-auto grid max-w-[82rem] gap-8 rounded-[2rem] bg-[#172033] px-6 py-10 text-white sm:px-10 lg:grid-cols-[1.1fr_.9fr_.9fr]">
        <div>
          <div className="mb-5 h-20 w-28 overflow-hidden rounded-2xl bg-white">
            <Image src="/brand/christ-beni-logo.jpg" alt="Christ Béni Layette" width={640} height={640} className="h-full w-full object-contain" />
          </div>
          <p className="max-w-sm text-base leading-7 text-white/70">Des essentiels pour bébé choisis avec attention, disponibles simplement et livrés avec soin.</p>
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
            {whatsappUrl && <a href={whatsappUrl} className="grid h-11 w-11 place-items-center rounded-full bg-white/10 hover:bg-white/18" aria-label="WhatsApp"><MessageCircle size={19} /></a>}
            {instagramUrl && <a href={instagramUrl} className="grid h-11 w-11 place-items-center rounded-full bg-white/10 hover:bg-white/18" aria-label="Instagram"><Instagram size={19} /></a>}
            {!whatsappUrl && !instagramUrl && <Link href="/suivi" className="text-sm leading-6 text-white/68">Suivi et assistance commande</Link>}
          </div>
          <p className="mt-5 text-sm text-white/55">© {new Date().getFullYear()} Christ Béni Layette</p>
        </div>
      </div>
    </footer>
  );
}
