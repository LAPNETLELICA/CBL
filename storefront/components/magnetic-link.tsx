"use client";

import Link from "next/link";
import type { MouseEvent } from "react";
import { useRef } from "react";

export function MagneticLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLAnchorElement>(null);

  const move = (event: MouseEvent<HTMLAnchorElement>) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const element = ref.current;
    if (!element) return;
    const bounds = element.getBoundingClientRect();
    const x = (event.clientX - bounds.left - bounds.width / 2) * 0.13;
    const y = (event.clientY - bounds.top - bounds.height / 2) * 0.18;
    element.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  };

  const reset = () => {
    if (ref.current) ref.current.style.transform = "translate3d(0, 0, 0)";
  };

  return (
    <Link ref={ref} href={href} className={className} onMouseMove={move} onMouseLeave={reset}>
      {children}
    </Link>
  );
}
