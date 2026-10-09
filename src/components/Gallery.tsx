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

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setOpenId(item.id);
              trackEventClient('gallery_open', { category: item.category });
            }}
            className="group overflow-hidden rounded-xl border border-line bg-surface text-left"
          >
            <span className="relative block aspect-[4/3] bg-surface-2">
              <Image
                src={item.url}
                alt={item.caption || 'Работа Бетта Пласт'}
                fill
                sizes="(max-width: 640px) 100vw, 33vw"
                className="object-cover transition group-hover:scale-[1.02]"
              />
            </span>
            {item.caption ? <span className="block p-3 text-sm text-ink-soft">{item.caption}</span> : null}
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
