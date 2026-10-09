/**
 * Architectural line-art illustrations.
 *
 * The reference design carries most of its visual weight with photographs. Betta
 * Plast has no licensed photography yet, and inventing "our work" photos would
 * be a lie — so these drawn elevations fill the same slots at the same aspect
 * ratios. They are deliberately diagrammatic (not photo-real), and the moment
 * real photos exist the gallery/hero render them instead.
 *
 * All of them are pure SVG: no requests, no layout shift, and they inherit the
 * section's colour through `currentColor`.
 */

type ArtProps = { className?: string; title?: string };

function Frame({ className, title, children }: ArtProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 320 200"
      className={className}
      role="img"
      aria-label={title}
      preserveAspectRatio="xMidYMid slice"
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

/** Two-sash window with a sill — the base product. */
export function WindowArt({ className, title = 'Схема пластикового окна' }: ArtProps) {
  return (
    <Frame className={className} title={title}>
      <g fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round">
        <rect x="58" y="26" width="204" height="130" rx="3" />
        <path d="M160 26v130" />
        <path d="M58 156h204" strokeWidth="5" />
        <path d="M40 164h240" strokeWidth="3" />
        {/* opening arcs */}
        <path d="M120 44a34 34 0 0 1 34 34" strokeDasharray="5 6" strokeWidth="2" />
        <path d="M200 44a34 34 0 0 0-34 34" strokeDasharray="5 6" strokeWidth="2" />
      </g>
      <g fill="currentColor" opacity="0.13">
        <rect x="61" y="29" width="96" height="124" />
      </g>
    </Frame>
  );
}

/** Glazed balcony / loggia with a railing band and side return. */
export function BalconyArt({ className, title = 'Схема остекления балкона' }: ArtProps) {
  return (
    <Frame className={className} title={title}>
      <g fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round">
        <path d="M40 164h250" strokeWidth="5" />
        <rect x="56" y="22" width="218" height="118" rx="3" />
        <path d="M128 22v118M200 22v118" />
        {/* railing band */}
        <path d="M56 108h218" strokeWidth="2" opacity="0.6" />
        <path d="M72 108v32M96 108v32M120 108v32M144 108v32M168 108v32M192 108v32M216 108v32M240 108v32M264 108v32" strokeWidth="1.5" opacity="0.45" />
        {/* side return + roof slab */}
        <path d="M274 22l22-16v142l-22 16" />
        <path d="M34 22h256" strokeWidth="4" />
      </g>
      <g fill="currentColor" opacity="0.13">
        <rect x="59" y="25" width="66" height="80" />
        <rect x="203" y="25" width="68" height="80" />
      </g>
    </Frame>
  );
}

/** Office partition wall with a glass door. */
export function PartitionArt({ className, title = 'Схема стеклянной перегородки' }: ArtProps) {
  return (
    <Frame className={className} title={title}>
      <g fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round">
        <rect x="34" y="18" width="252" height="148" rx="3" />
        <path d="M96 18v148M196 18v148" />
        {/* door leaf */}
        <rect x="196" y="46" width="56" height="120" />
        <circle cx="206" cy="108" r="3.5" fill="currentColor" />
        {/* mullion grid */}
        <path d="M34 84h62M96 84h100" strokeWidth="1.6" opacity="0.5" />
      </g>
      <g fill="currentColor" opacity="0.13">
        <rect x="37" y="21" width="56" height="60" />
        <rect x="99" y="21" width="94" height="60" />
      </g>
    </Frame>
  );
}

/** Window with repair markers: an adjuster and a sealing contour. */
export function RepairArt({ className, title = 'Схема ремонта и регулировки окна' }: ArtProps) {
  return (
    <Frame className={className} title={title}>
      <g fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round">
        <rect x="62" y="30" width="196" height="124" rx="3" />
        <path d="M160 30v124" />
        <rect x="62" y="30" width="196" height="124" rx="3" strokeDasharray="6 7" strokeWidth="1.6" opacity="0.6" />
      </g>
      {/* adjuster / hex key */}
      <g fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
        <circle cx="160" cy="120" r="9" />
        <path d="M160 129v22" />
      </g>
      <g fill="currentColor" opacity="0.13">
        <rect x="65" y="33" width="92" height="118" />
      </g>
    </Frame>
  );
}

export const ART_BY_KIND = {
  window: WindowArt,
  balcony: BalconyArt,
  partition: PartitionArt,
  repair: RepairArt,
} as const;

export type ArtKind = keyof typeof ART_BY_KIND;
