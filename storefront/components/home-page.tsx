"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight, Clock3, MapPin, PackageCheck, ShieldCheck, Sparkles } from "lucide-react";
import { formatFcfa } from "@/lib/catalog";
import { ProductCard } from "@/components/product-card";
import { MagneticLink } from "@/components/magnetic-link";
import { useLiveCatalog } from "@/lib/use-live-catalog";
import { DynamicContent } from "@/components/dynamic-content";
import { SiteReviewForm } from "@/components/site-review-form";
import { FloatingParticles, PointerHint, TextAnimate, TrustMarquee } from "@/components/motion-ui";

export function HomePage() {
  const { products, categories, promo, hero, homeMessage, deliveryMessage, deliveryAreas, activePromotions } = useLiveCatalog();
  const featured = products.filter((product) => product.featured).slice(0, 4);

  return (
    <main className="home-main overflow-hidden pt-3">
      <section className="relative mx-3 min-h-[calc(100svh-1.5rem)] overflow-hidden rounded-[2rem] sm:mx-5 sm:rounded-[2.5rem]">
        <img
          src={hero.image_url}
          alt=""
          className="absolute inset-0 h-full w-full scale-110 object-cover"
          data-parallax
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,20,37,.76)_0%,rgba(12,30,52,.37)_52%,rgba(22,32,49,.16)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_25%,rgba(142,202,230,.26),transparent_34%),radial-gradient(circle_at_74%_78%,rgba(255,181,200,.22),transparent_30%)]" />
        <FloatingParticles />

        <div className="page-shell relative z-10 flex min-h-[calc(100svh-1.5rem)] items-end pb-12 pt-36 sm:pb-16 lg:items-center lg:pb-0 lg:pt-28">
          <div className="max-w-4xl" data-reveal>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/12 px-4 py-2 text-sm font-semibold text-white backdrop-blur-xl">
              <Sparkles size={16} aria-hidden />
              {hero.eyebrow}
            </div>
            <h1 className="aurora-text display-type max-w-[11ch] text-[clamp(4rem,10vw,8.8rem)] leading-[.82] text-white">
              <TextAnimate>{hero.title}</TextAnimate>
            </h1>
            <div className="mt-7 flex flex-col items-start gap-6 sm:flex-row sm:items-center">
              <p className="max-w-md text-lg leading-8 text-white/82">{hero.body}</p>
              <div className="flex flex-wrap items-center gap-3">
                <MagneticLink href="/catalogue" className="soft-button pulsating-button shrink-0">
                  Visiter la boutique <ArrowRight size={18} aria-hidden />
                </MagneticLink>
                <Link href="/inscription" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/45 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur-md transition hover:bg-white/20">
                  Créer un compte
                </Link>
                <Link href="#rayons" className="inline-flex min-h-12 items-center gap-2 rounded-full px-4 py-3 text-sm font-bold text-white/85 underline decoration-white/35 underline-offset-4 hover:text-white">
                  Découvrir les rayons <ArrowDown size={16} aria-hidden />
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-dark absolute bottom-6 right-6 hidden max-w-xs rounded-[1.5rem] p-5 lg:block" data-reveal>
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-white/55">{hero.promise_title}</p>
          <p className="mt-2 text-lg leading-7">{hero.promise_body}</p>
        </div>
        <PointerHint />
      </section>

      <TrustMarquee />

      {homeMessage.title && <section className="page-shell pt-12"><p className="eyebrow">{homeMessage.title}</p><p className="max-w-3xl text-lg leading-8 text-ink/68">{homeMessage.body}</p></section>}
      <section id="rayons" className="page-shell section-space">
        <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div data-reveal>
            <p className="eyebrow">{hero.categories_eyebrow}</p>
            <h2 className="display-type section-heading">{hero.categories_title}</h2>
          </div>
          <p className="max-w-md text-base leading-7 text-ink/65" data-reveal>{hero.categories_description}</p>
        </div>

        <div className="rayons-marquee" data-reveal>
          {[categories.slice(0, Math.ceil(categories.length / 2)), categories.slice(Math.ceil(categories.length / 2))].map((row, rowIndex) => row.length > 0 && <div key={rowIndex} className={`rayons-marquee-row ${rowIndex === 1 ? "rayons-marquee-row-reverse" : ""}`}>
            {[...row, ...row].map((category, index) => <Link key={`${category.id}-${index}`} href={`/catalogue?rayon=${category.id}`} className="rayon-marquee-card group relative overflow-hidden rounded-[1.75rem]">
              {category.image.startsWith("http") ? <img src={category.image} alt="" className="absolute inset-0 h-full w-full object-cover blur-[2px] transition duration-700 group-hover:scale-105 group-hover:blur-0" /> : <Image src={category.image} alt="" fill sizes="(max-width: 640px) 78vw, 21rem" className="object-cover blur-[2px] transition duration-700 group-hover:scale-105 group-hover:blur-0" />}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0c1928]/82 via-[#14283b]/10 to-transparent" />
              <div className="absolute inset-x-4 bottom-4 rounded-[1.25rem] border border-white/25 bg-white/12 p-4 text-white backdrop-blur-md"><h3 className="text-xl font-bold leading-tight">{category.name}</h3><p className="mt-2 text-sm text-white/76">{category.description}</p><span className="mt-3 inline-flex items-center gap-2 text-sm font-bold">Découvrir <ArrowRight size={16} aria-hidden /></span></div>
            </Link>)}
          </div>)}
        </div>
      </section>

      <section className="dot-info-section relative mt-3 overflow-hidden py-16 sm:py-24">
        <div className="dot-pattern" aria-hidden />
        <div className="page-shell relative z-10 grid gap-8 lg:grid-cols-[.9fr_1.1fr] lg:items-end">
          <div className="video-text-banner" aria-hidden><video autoPlay muted loop playsInline src="https://cdn.magicui.design/ocean-small.webm" /><span>DOUX</span></div>
          <div data-reveal><p className="eyebrow text-[#245a78]">Chaque détail compte</p><h2 className="display-type max-w-[10ch] text-[clamp(3rem,6vw,5.8rem)] leading-[.9] text-[#10283d]">Tout ce qu’il faut pour bien commencer.</h2><p className="mt-6 max-w-lg text-lg leading-8 text-[#163b55]/78">Des essentiels choisis avec soin, une commande facile à suivre et une équipe disponible à chaque étape.</p></div>
          <div className="grid gap-3 sm:grid-cols-3" data-reveal>{[{number:"01",title:"Choisis avec soin",text:"Des produits adaptés aux premiers moments."},{number:"02",title:"Simple à commander",text:"Ajoutez, confirmez et suivez sans difficulté."},{number:"03",title:"Livré près de vous",text:"Des créneaux clairs pour Douala et ses environs."}].map(item=><div key={item.number} className="dot-info-card rounded-[1.5rem] p-5"><span>{item.number}</span><h3>{item.title}</h3><p>{item.text}</p></div>)}</div>
        </div>
      </section>

      <section className="relative py-20 sm:py-28">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(125deg,rgba(142,202,230,.24),rgba(255,255,255,.15),rgba(255,181,200,.22))]" />
        <div className="page-shell">
          <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div data-reveal>
              <p className="eyebrow">{hero.featured_eyebrow}</p>
              <h2 className="display-type section-heading">{hero.featured_title}</h2>
            </div>
            <Link href="/catalogue" className="outline-button w-fit" data-reveal>Toute la sélection <ArrowRight size={17} aria-hidden /></Link>
          </div>
          <div className="featured-motion-grid grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((product) => <div key={product.id} className="featured-motion-card" data-reveal><ProductCard product={product} compact /></div>)}
          </div>
        </div>
      </section>

      <section className="closing-hero relative min-h-[100svh] w-full overflow-hidden">
        <img src={hero.image_url} alt="" className="absolute inset-0 h-full w-full scale-110 object-cover" data-parallax />
        <div className="absolute inset-0 bg-[#0b1d31]/58" />
        <div className="closing-hero-effect" aria-hidden />
        <div className="page-shell relative z-10 flex min-h-[92svh] items-center justify-center py-24 text-center">
          <div className="max-w-5xl" data-reveal>
            <p className="mb-7 text-sm font-bold uppercase tracking-[0.2em] text-white/55">{hero.promise_title}</p>
            <blockquote className="text-reveal display-type text-[clamp(3.4rem,9vw,8rem)] leading-[.9] text-white">{hero.closing_title}</blockquote>
          </div>
        </div>
      </section>

      <section className="full-bleed-promo section-space">
        <div className={`glass border-beam grid gap-8 rounded-[2rem] p-5 sm:p-8 ${promo.enabled ? "lg:grid-cols-[1.05fr_.95fr]" : "lg:grid-cols-1"} lg:p-10`} data-reveal>
          {(activePromotions[0] || promo.enabled) && <div className="relative overflow-hidden rounded-[1.55rem] bg-[linear-gradient(145deg,#162337,#294a65)] p-7 text-white sm:p-10">
            {activePromotions[0]?.image_url && <img src={activePromotions[0].image_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-20" />}
            <div className="relative"><p className="mb-4 text-sm font-bold uppercase tracking-[0.16em] text-[#9fdcf3]">{hero.offer_eyebrow}</p>
            <h2 className="sparkles-text display-type text-4xl leading-[1.02] sm:text-6xl">{activePromotions[0]?.name || promo.title}</h2>
            <p className="mt-5 max-w-lg text-lg leading-8 text-white/72">{activePromotions[0]?.description || promo.body}</p>
            <Link href="/catalogue?disponible=oui" className="soft-button mt-8">Voir les offres <ArrowRight size={17} aria-hidden /></Link></div>
          </div>}

          <div className="p-2 sm:p-4">
            <div className="mb-6 flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-[#dff2fa]"><MapPin size={20} aria-hidden /></span>
              <div>
                <p className="text-sm font-semibold text-ink/55">{hero.delivery_eyebrow}</p>
                <h3 className="dia-text-reveal text-2xl font-bold">{deliveryMessage.title}</h3>{deliveryMessage.body && <p className="mt-1 text-sm text-ink/60">{deliveryMessage.body}</p>}
              </div>
            </div>
            <div className="animated-list grid gap-3">
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
      <DynamicContent />
      <SiteReviewForm />
    </main>
  );
}
