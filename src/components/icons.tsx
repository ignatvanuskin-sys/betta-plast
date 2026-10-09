/**
 * A single line-icon set (§10: no emoji in the interface, one consistent style).
 * Stroke-based, 24×24, inherits `currentColor`.
 */
type IconProps = { className?: string; size?: number };

function base(size: number) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    focusable: false as const,
  };
}

export function IconWindow({ className, size = 24 }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="1.5" />
      <path d="M12 3.5v17M3.5 12h17" />
    </svg>
  );
}

export function IconBalcony({ className, size = 24 }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M4 21V9l8-5 8 5v12" />
      <path d="M4 13h16M8 13v8M12 13v8M16 13v8" />
    </svg>
  );
}

export function IconPartition({ className, size = 24 }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="3.5" y="4" width="17" height="16" rx="1.5" />
      <path d="M12 4v16M5 20h2v2H5zM17 20h2v2h-2z" />
    </svg>
  );
}

export function IconWrench({ className, size = 24 }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M14.7 6.3a4 4 0 1 0 5 5L21 10l-7 7-3-3 7-7-3.3-.7Z" />
      <path d="m8 16-5 5" />
    </svg>
  );
}

export function IconPhone({ className, size = 24 }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M5 3.5h3l1.5 4-2 1.5a12 12 0 0 0 5.5 5.5l1.5-2 4 1.5v3c0 1-.8 1.8-1.8 1.7C9.6 18.3 5.7 14.4 3.3 5.3 3.2 4.3 4 3.5 5 3.5Z" />
    </svg>
  );
}

export function IconWhatsapp({ className, size = 24 }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M20.5 11.6a8.5 8.5 0 0 1-12.6 7.4L3.5 20.5l1.6-4.3A8.5 8.5 0 1 1 20.5 11.6Z" />
      <path d="M8.8 8.2c.3-.6 1-.5 1.2 0l.6 1.4-.7.9c.5 1 1.2 1.7 2.2 2.2l.9-.7 1.4.6c.5.2.6.9 0 1.2-1.4.7-3.2-.2-4.5-1.5S8.1 9.6 8.8 8.2Z" />
    </svg>
  );
}

export function IconCalculator({ className, size = 24 }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="4.5" y="2.5" width="15" height="19" rx="2" />
      <path d="M8 7h8M8 11.5h2M12 11.5h2M16 11.5h.01M8 15.5h2M12 15.5h2M16 15.5h.01M8 19h6" />
    </svg>
  );
}

export function IconCalendar({ className, size = 24 }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M3.5 10h17M8 3.5V6M16 3.5V6" />
    </svg>
  );
}

export function IconCheck({ className, size = 24 }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="m4.5 12.5 5 5 10-11" />
    </svg>
  );
}

export function IconPin({ className, size = 24 }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

export function IconClock({ className, size = 24 }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

export function IconMail({ className, size = 24 }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="3" y="5.5" width="18" height="13" rx="2" />
      <path d="m3.8 6.8 8.2 6 8.2-6" />
    </svg>
  );
}

export function IconShield({ className, size = 24 }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M12 21c4.5-1.8 7-5 7-9V5.8L12 3 5 5.8V12c0 4 2.5 7.2 7 9Z" />
      <path d="m9 12 2 2 4-4.5" />
    </svg>
  );
}

export function IconDoc({ className, size = 24 }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M6 2.5h7l5 5v14H6z" />
      <path d="M13 2.5v5h5M9 13h6M9 17h6" />
    </svg>
  );
}

export function IconStar({ className, size = 24 }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 9.7l5.9-.8z" />
    </svg>
  );
}

export const SERVICE_ICONS = {
  window: IconWindow,
  balcony: IconBalcony,
  partition: IconPartition,
  repair: IconWrench,
} as const;
