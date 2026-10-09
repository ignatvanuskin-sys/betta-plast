'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';

import { trackEventClient } from '@/lib/client/analytics';

export type GalleryEntry = {
  id: number;
  url: string;
  beforeUrl?: string | null;
  category: string;
  caption: string;
  width: number;
  height: number;
};

const CATEGORIES = [
  { value: 'all', label: 'Все работы' },
  { value: 'windows', label: 'Окна' },
  { value: 'balconies', label: 'Балконы и лоджии' },
  { value: 'partitions', label: 'Перегородки' },
  { value: 'repair', label: 'Ремонт' },
];

/**
 * Work gallery with category filters and a full-screen viewer (§10).
 * Until the owner uploads photos the block renders nothing at all — no stock
 * imagery is ever substituted (§7.1).
 */
export function GalleryGrid({ items }: { items: GalleryEntry[] }) {
  const [category, setCategory] = useState('all');
  const [openId, setOpenId] = useState<number | null>(null);

  const filtered = useMemo(
    () => (category === 'all' ? items : items.filter((item) => item.category === category)),
    [category, items],
  );

  const open = filtered.find((item) => item.id === openId) ?? null;

  if (items.length === 0) return null;

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((entry) => (
          <button
            key={entry.value}
            type="button"
            onClick={() => setCategory(entry.value)}
            aria-pressed={category === entry.value}
            className={`min-h-11 rounded-full border px-4 text-sm font-medium ${
              category === entry.value ? 'border-glass bg-glass-soft text-glass' : 'border-line bg-surface text-ink-soft'
            }`}
          >
            {entry.label}
          </button>
        ))}
      </div>

      {/* CSS masonry, matching the reference gallery: every photo keeps its own
          aspect ratio instead of being cropped into a uniform grid. */}
      <div className="masonry mt-6">
        {filtered.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setOpenId(item.id);
              trackEventClient('gallery_open', { category: item.category });
            }}
            className="media-round group block w-full border border-line bg-cream text-left"
          >
            <Image
              src={item.url}
              alt={item.caption || 'Работа Бетта Пласт'}
              width={item.width || 1200}
              height={item.height || 900}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="h-auto w-full object-cover transition-opacity group-hover:opacity-90"
            />
            {item.caption ? (
              <span className="block px-4 py-3 text-sm leading-relaxed text-ink-soft">{item.caption}</span>
            ) : null}
          </button>
        ))}
      </div>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={open.caption || 'Просмотр работы'}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setOpenId(null)}
        >
          <div className="relative max-h-full w-full max-w-4xl">
            <Image
              src={open.url}
              alt={open.caption || 'Работа Бетта Пласт'}
              width={open.width || 1200}
              height={open.height || 900}
              className="h-auto w-full rounded-lg object-contain"
            />
            {open.caption ? <p className="mt-2 text-center text-sm text-white">{open.caption}</p> : null}
            <button
              type="button"
              onClick={() => setOpenId(null)}
              className="absolute -top-3 -right-3 flex h-11 w-11 items-center justify-center rounded-full bg-white text-ink"
            >
              <span className="sr-only">Закрыть</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
