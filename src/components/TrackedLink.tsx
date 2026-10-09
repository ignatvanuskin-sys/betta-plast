'use client';

import type { ReactNode } from 'react';

import { trackEventClient } from '@/lib/client/analytics';

type Props = {
  href: string;
  event: string;
  children: ReactNode;
  className?: string;
  /** Extra properties sent with the event (page section, kind of request, …). */
  props?: Record<string, unknown>;
  ariaLabel?: string;
};

/**
 * A link that reports a goal before the browser leaves the page (§8.6).
 * Uses `sendBeacon` so the click on `tel:` / `wa.me` is not lost.
 */
export function TrackedLink({ href, event, children, className, props, ariaLabel }: Props) {
  return (
    <a
      href={href}
      className={className}
      aria-label={ariaLabel}
      target={href.startsWith('http') ? '_blank' : undefined}
      rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
      onClick={() => trackEventClient(event, props)}
    >
      {children}
    </a>
  );
}
