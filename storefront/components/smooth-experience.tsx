"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function SmoothExperience() {
  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return;

    gsap.registerPlugin(ScrollTrigger);
    const lenis = new Lenis({
      duration: 1.05,
      smoothWheel: true,
      wheelMultiplier: 0.85,
    });

    const frame = (time: number) => {
      lenis.raf(time * 1000);
    };

    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(frame);
    gsap.ticker.lagSmoothing(0);

    const revealAnimations = gsap.utils.toArray<HTMLElement>("[data-reveal]").map((element) =>
      gsap.fromTo(
        element,
        { y: 42, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: { trigger: element, start: "top 88%", end: "bottom 12%", toggleActions: "play reverse play reverse" },
        },
      ),
    );

    const parallax = gsap.utils.toArray<HTMLElement>("[data-parallax]").map((element) =>
      gsap.to(element, {
        yPercent: 12,
        ease: "none",
        scrollTrigger: { trigger: element.parentElement, start: "top bottom", end: "bottom top", scrub: true },
      }),
    );

    return () => {
      revealAnimations.forEach((animation) => animation.kill());
      parallax.forEach((animation) => animation.kill());
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
      gsap.ticker.remove(frame);
      lenis.destroy();
    };
  }, []);

  return null;
}
