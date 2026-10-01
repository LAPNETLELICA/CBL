"use client";

import { useMemo } from "react";

export function FloatingParticles() {
  const particles = useMemo(() => Array.from({ length: 18 }, (_, index) => ({ id: index, left: `${(index * 37) % 100}%`, top: `${(index * 53) % 100}%`, size: 3 + (index % 4) * 2, delay: `${-(index % 7)}s`, duration: `${7 + (index % 5)}s` })), []);
  return <div className="floating-particles" aria-hidden>{particles.map((particle) => <i key={particle.id} style={{ left: particle.left, top: particle.top, width: particle.size, height: particle.size, animationDelay: particle.delay, animationDuration: particle.duration }} />)}</div>;
}

export function TextAnimate({ children }: { children: string }) {
  return <span className="text-animate">{children.split(" ").map((word, index) => <span key={`${word}-${index}`} style={{ animationDelay: `${index * 65}ms` }}>{word}&nbsp;</span>)}</span>;
}

export function TrustMarquee() {
  const messages = ["Paiement contrôlé", "Livraison à Douala", "Stock mis à jour", "Suivi de commande simple", "Service client à l’écoute"];
  return <div className="trust-marquee" aria-label="Nos engagements"><div className="trust-track">{[...messages, ...messages].map((message, index) => <span key={`${message}-${index}`}><b>✦</b>{message}</span>)}</div></div>;
}

export function PointerHint() { return <div className="pointer-hint" aria-hidden><span>Découvrir</span><i>↗</i></div>; }
