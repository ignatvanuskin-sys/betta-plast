'use client';

import { useEffect } from 'react';

/**
 * Scroll-reveal driver (reference motion: 20px rise, 0.62s ease-out).
 *
 * A single IntersectionObserver handles every `[data-reveal]` element on the
 * page — server components only need to add the attribute, no per-element
 * client code. Content is revealed once and then unobserved.
 */
export function RevealObserver() {
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));

    if (reduced || typeof IntersectionObserver === 'undefined') {
      nodes.forEach((node) => node.classList.add('is-visible'));
      return;
    }

    // Anything already in view on first paint should not animate in late.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const element = entry.target as HTMLElement;
          const delay = element.dataset.revealDelay;
          if (delay) element.style.transitionDelay = `${delay}ms`;
          element.classList.add('is-visible');
          observer.unobserve(element);
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  return null;
}
