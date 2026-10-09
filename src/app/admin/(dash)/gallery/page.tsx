import Image from 'next/image';

import { toggleGalleryItemAction, uploadGalleryAction } from '../../actions';
import { ActionForm } from '@/components/admin/ActionForm';
import { getGallery } from '@/lib/domain/content';

export const dynamic = 'force-dynamic';

const CATEGORIES = [
  { value: 'windows', label: 'Окна' },
  { value: 'balconies', label: 'Балконы и лоджии' },
  { value: 'partitions', label: 'Перегородки' },
  { value: 'repair', label: 'Ремонт' },
];

/**
 * Only the owner's own photos belong here (§0.6). Stock imagery is never used,
 * even temporarily — an empty gallery simply stays hidden.
 */
export default async function AdminGalleryPage() {
  const items = await getGallery({ limit: 100 });

  return (
    <div className="grid gap-6">
      <h1 className="text-xl font-bold">Галерея работ</h1>

      <section className="card">
        <h2 className="font-semibold">Загрузить фото</h2>
        <p className="hint mt-1">JPG, PNG, WEBP, HEIC или PDF, до 15 МБ. Загружайте только свои фотографии объектов.</p>
        <ActionForm action={uploadGalleryAction} submitLabel="Загрузить" className="mt-3">
          <input name="files" type="file" multiple accept="image/*,application/pdf" className="field py-2" required />
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="category">
                Категория
              </label>
              <select id="category" name="category" className="field" defaultValue="windows">
                {CATEGORIES.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="caption">
                Подпись
              </label>
              <input id="caption" name="caption" className="field" placeholder="например: лоджия 4,2 м, тёплое остекление" />
            </div>
          </div>
          <label className="mt-3 flex items-center gap-2 text-sm">
            <input type="checkbox" name="showOnHome" className="h-5 w-5" />
            Показывать на главной
          </label>
        </ActionForm>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.length === 0 ? (
          <p className="card hint sm:col-span-2 lg:col-span-3">
            Пока нет фотографий. Блок «Наши работы» на сайте скрыт — это нормально.
          </p>
        ) : null}
        {items.map((item) => (
          <article key={item.id} className="card">
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-surface-2">
              <Image src={item.url} alt={item.caption || 'Работа'} fill sizes="33vw" className="object-cover" />
            </div>
            <p className="mt-2 text-sm">{item.caption || '—'}</p>
            <p className="hint">{CATEGORIES.find((entry) => entry.value === item.category)?.label ?? item.category}</p>
            <ActionForm action={toggleGalleryItemAction} submitLabel="Сохранить" className="mt-3" variant="outline">
              <input type="hidden" name="id" value={item.id} />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="home" value="1" defaultChecked={false} className="h-5 w-5" />
                на главной
              </label>
              <label className="mt-2 flex items-center gap-2 text-sm">
                <input type="checkbox" name="active" value="1" defaultChecked className="h-5 w-5" />
                показывать
              </label>
            </ActionForm>
          </article>
        ))}
      </section>
    </div>
  );
}
