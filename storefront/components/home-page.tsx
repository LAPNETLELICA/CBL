"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight, Clock3, MapPin, PackageCheck, ShieldCheck, Sparkles } from "lucide-react";
import { deliveryAreas, formatFcfa } from "@/lib/catalog";
import { ProductCard } from "@/components/product-card";
import { MagneticLink } from "@/components/magnetic-link";
import { useLiveCatalog } from "@/lib/use-live-catalog";

export function HomePage() {
  const { products, categories, promo } = useLiveCatalog();
  const featured = products.filter((product) => product.featured).slice(0, 4);

  return (
    <main className="overflow-hidden pt-3">
      <section className="relative mx-3 min-h-[calc(100svh-1.5rem)] overflow-hidden rounded-[2rem] sm:mx-5 sm:rounded-[2.5rem]">
        <Image
          src="/brand/premium-blur-hero.jpg"
          alt="Paysage naturel volontairement flouté aux tons bleu et rose"
          fill
          priority
          sizes="100vw"
          className="scale-110 object-cover"
          data-parallax
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,20,37,.76)_0%,rgba(12,30,52,.37)_52%,rgba(22,32,49,.16)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_25%,rgba(142,202,230,.26),transparent_34%),radial-gradient(circle_at_74%_78%,rgba(255,181,200,.22),transparent_30%)]" />

        <div className="page-shell relative z-10 flex min-h-[calc(100svh-1.5rem)] items-end pb-12 pt-36 sm:pb-16 lg:items-center lg:pb-0 lg:pt-28">
          <div className="max-w-4xl" data-reveal>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/12 px-4 py-2 text-sm font-semibold text-white backdrop-blur-xl">
              <Sparkles size={16} aria-hidden />
              Une sélection pensée pour grandir en douceur
            </div>
            <h1 className="display-type max-w-[11ch] text-[clamp(4rem,10vw,8.8rem)] leading-[.82] text-white">
              Tout pour les petits bonheurs.
            </h1>
            <div className="mt-7 flex flex-col items-start gap-6 sm:flex-row sm:items-center">
              <p className="max-w-md text-lg leading-8 text-white/82">Des essentiels choisis avec tendresse, pour accompagner les premiers jours et toutes les aventures qui suivent.</p>
              <MagneticLink href="#rayons" className="soft-button shrink-0">
                Explorer <ArrowDown size={18} aria-hidden />
              </MagneticLink>
            </div>
          </div>
        </div>

        <div className="glass-dark absolute bottom-6 right-6 hidden max-w-xs rounded-[1.5rem] p-5 lg:block" data-reveal>
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-white/55">La promesse Christ Béni</p>
          <p className="mt-2 text-lg leading-7">Des choix utiles, doux et accessibles — sans détour.</p>
        </div>
      </section>

      <section id="rayons" className="page-shell section-space">
        <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div data-reveal>
            <p className="eyebrow">Nos rayons</p>
            <h2 className="display-type section-heading">Un univers pour chaque moment.</h2>
          </div>
          <p className="max-w-md text-base leading-7 text-ink/65" data-reveal>Parcourez les essentiels par usage, de la première tenue au sac qui accompagne toutes les sorties.</p>
        </div>

        <div className="grid auto-rows-[18rem] gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category, index) => (
            <Link
              key={category.id}
              href={`/catalogue?rayon=${category.id}`}
              className={`group relative overflow-hidden rounded-[1.75rem] ${index === 0 || index === 5 ? "lg:col-span-2" : ""}`}
              data-reveal
            >
              {category.image.startsWith("http") ? (
                <img src={category.image} alt="" className="absolute inset-0 h-full w-full object-cover blur-[2px] transition duration-700 group-hover:scale-105 group-hover:blur-0" />
              ) : (
                <Image src={category.image} alt="" fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" className="object-cover blur-[2px] transition duration-700 group-hover:scale-105 group-hover:blur-0" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0c1928]/82 via-[#14283b]/10 to-transparent" />
              <div className="absolute inset-x-4 bottom-4 rounded-[1.25rem] border border-white/25 bg-white/12 p-4 text-white backdrop-blur-md transition duration-300 group-hover:bg-white/22">
                <h3 className="text-xl font-bold leading-tight">{category.name}</h3>
                <div className="grid grid-rows-[0fr] transition-all duration-300 group-hover:grid-rows-[1fr]">
                  <div className="overflow-hidden">
                    <p className="pt-2 text-sm text-white/76">{category.description}</p>
                    <span className="mt-3 inline-flex items-center gap-2 text-sm font-bold">Découvrir le rayon <ArrowRight size={16} aria-hidden /></span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="relative py-20 sm:py-28">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(125deg,rgba(142,202,230,.24),rgba(255,255,255,.15),rgba(255,181,200,.22))]" />
        <div className="page-shell">
          <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div data-reveal>
              <p className="eyebrow">Nos coups de cœur</p>
              <h2 className="display-type section-heading">Les quatre chouchous du moment.</h2>
            </div>
            <Link href="/catalogue" className="outline-button w-fit" data-reveal>Toute la sélection <ArrowRight size={17} aria-hidden /></Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((product) => <div key={product.id} data-reveal><ProductCard product={product} compact /></div>)}
          </div>
        </div>
      </section>

      <section className="relative mx-3 min-h-[92svh] overflow-hidden rounded-[2rem] sm:mx-5 sm:rounded-[2.5rem]">
        <Image src="/brand/premium-blur-hero.jpg" alt="Atmosphère naturelle floutée" fill sizes="100vw" className="scale-110 object-cover" data-parallax />
        <div className="absolute inset-0 bg-[#0b1d31]/58" />
        <div className="page-shell relative z-10 flex min-h-[92svh] items-center justify-center py-24 text-center">
          <div className="max-w-5xl" data-reveal>
            <p className="mb-7 text-sm font-bold uppercase tracking-[0.2em] text-white/55">Choisir avec cœur</p>
            <blockquote className="display-type text-[clamp(3.4rem,9vw,8rem)] leading-[.9] text-white">Pensé pour les petits, choisi pour les grands.</blockquote>
          </div>
        </div>
      </section>

      <section className="page-shell section-space">
        <div className="glass grid gap-8 rounded-[2rem] p-5 sm:p-8 lg:grid-cols-[1.05fr_.95fr] lg:p-10" data-reveal>
          <div className="rounded-[1.55rem] bg-[linear-gradient(145deg,#162337,#294a65)] p-7 text-white sm:p-10">
            <p className="mb-4 text-sm font-bold uppercase tracking-[0.16em] text-[#9fdcf3]">Offres du moment</p>
            <h2 className="display-type text-4xl leading-[1.02] sm:text-6xl">{promo.title}</h2>
            <p className="mt-5 max-w-lg text-lg leading-8 text-white/72">{promo.body}</p>
            <Link href="/catalogue?disponible=oui" className="soft-button mt-8">Voir les offres <ArrowRight size={17} aria-hidden /></Link>
          </div>

          <div className="p-2 sm:p-4">
            <div className="mb-6 flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-[#dff2fa]"><MapPin size={20} aria-hidden /></span>
              <div>
                <p className="text-sm font-semibold text-ink/55">Livraison claire</p>
                <h3 className="text-2xl font-bold">Délais & tarifs</h3>
              </div>
            </div>
            <div className="grid gap-3">
              {deliveryAreas.map((area) => (
                <div key={area.name} className="grid gap-2 rounded-2xl border border-ink/8 bg-white/46 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div>
                    <p className="font-bold">{area.name}</p>
                    <p className="mt-1 flex items-center gap-2 text-sm text-ink/58"><Clock3 size={15} aria-hidden /> {area.window}</p>
                  </div>
                  <p className="font-bold text-[#32789a]">{formatFcfa(area.fee)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-3" data-reveal>
          {[
            { icon: ShieldCheck, title: "Paiement vérifié", text: "Chaque confirmation est contrôlée côté serveur." },
            { icon: PackageCheck, title: "Stock réel", text: "La disponibilité est vérifiée avant validation." },
            { icon: MapPin, title: "Suivi simple", text: "Retrouvez chaque étape avec votre numéro de commande." },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-[1.5rem] border border-white/70 bg-white/48 p-6 backdrop-blur-xl">
              <Icon size={23} strokeWidth={1.7} aria-hidden />
              <h3 className="mt-4 text-lg font-bold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-ink/62">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
