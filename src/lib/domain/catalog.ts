/**
 * Calculator field catalog (§8.2).
 *
 * This is the *seed* and fallback definition. Once seeded into
 * `product_options` the owner can change the set of fields from the admin panel
 * without touching code — the form is rendered from the database, never from a
 * hard-coded list.
 */
import type { LeadKind } from './validation';

export type FieldType = 'number' | 'select' | 'multiselect' | 'boolean' | 'text';

export type FieldChoice = { value: string; label: string };

export type CatalogField = {
  code: string;
  titleRu: string;
  type: FieldType;
  choices?: FieldChoice[];
  unit?: string;
  required?: boolean;
  min?: number;
  max?: number;
  placeholder?: string;
};

const OPENING_CHOICES: FieldChoice[] = [
  { value: 'fixed', label: 'Глухое' },
  { value: 'turn', label: 'Поворотное' },
  { value: 'tilt_turn', label: 'Поворотно-откидное' },
  { value: 'sliding', label: 'Раздвижное' },
  { value: 'mixed', label: 'Комбинированное' },
];

const WINDOW_EXTRAS: FieldChoice[] = [
  { value: 'mosquito_net', label: 'Москитная сетка' },
  { value: 'sill', label: 'Подоконник' },
  { value: 'drip', label: 'Отлив' },
  { value: 'slopes', label: 'Откосы' },
  { value: 'child_lock', label: 'Детский замок' },
];

const BALCONY_EXTRAS: FieldChoice[] = [
  { value: 'insulation', label: 'Утепление' },
  { value: 'cladding', label: 'Обшивка и отделка' },
  { value: 'slopes', label: 'Откосы' },
  { value: 'cabinet', label: 'Шкаф / стеллаж' },
  { value: 'lighting', label: 'Освещение' },
];

const COLOR_CHOICES: FieldChoice[] = [
  { value: 'white', label: 'Белый' },
  { value: 'laminate_wood', label: 'Под дерево' },
  { value: 'grey', label: 'Серый' },
  { value: 'other', label: 'Другой (уточню)' },
];

export const CATALOG: Record<LeadKind, CatalogField[]> = {
  window: [
    { code: 'width', titleRu: 'Ширина проёма', type: 'number', unit: 'мм', required: true, min: 300, max: 6000 },
    { code: 'height', titleRu: 'Высота проёма', type: 'number', unit: 'мм', required: true, min: 300, max: 4000 },
    { code: 'sashes', titleRu: 'Количество створок', type: 'select', required: true, choices: [
      { value: '1', label: '1' },
      { value: '2', label: '2' },
      { value: '3', label: '3' },
      { value: '4', label: '4' },
      { value: '5', label: '5 и более' },
    ] },
    { code: 'opening', titleRu: 'Тип открывания', type: 'select', choices: OPENING_CHOICES },
    { code: 'quantity', titleRu: 'Сколько таких окон', type: 'number', unit: 'шт.', min: 1, max: 100 },
    { code: 'color', titleRu: 'Цвет профиля', type: 'select', choices: COLOR_CHOICES },
    { code: 'extras', titleRu: 'Дополнительно', type: 'multiselect', choices: WINDOW_EXTRAS },
  ],
  balcony: [
    { code: 'objectType', titleRu: 'Что это', type: 'select', required: true, choices: [
      { value: 'balcony', label: 'Балкон' },
      { value: 'loggia', label: 'Лоджия' },
    ] },
    { code: 'length', titleRu: 'Длина', type: 'number', unit: 'м', required: true, min: 0.5, max: 30 },
    { code: 'widthM', titleRu: 'Ширина (вынос)', type: 'number', unit: 'м', min: 0.3, max: 5 },
    { code: 'height', titleRu: 'Высота остекления', type: 'number', unit: 'м', min: 0.5, max: 10 },
    { code: 'glazing', titleRu: 'Вид остекления', type: 'select', required: true, choices: [
      { value: 'cold', label: 'Холодное' },
      { value: 'warm', label: 'Тёплое' },
      { value: 'unknown', label: 'Не знаю — подскажите' },
    ] },
    { code: 'extras', titleRu: 'Что нужно ещё', type: 'multiselect', choices: BALCONY_EXTRAS },
    { code: 'floor', titleRu: 'Этаж', type: 'number', min: 1, max: 40 },
    { code: 'lift', titleRu: 'Есть лифт', type: 'boolean' },
  ],
  partition: [
    { code: 'size', titleRu: 'Размеры (Д × В), м', type: 'text', required: true, placeholder: 'например 3,5 × 2,7' },
    { code: 'partitionType', titleRu: 'Тип перегородки', type: 'select', choices: [
      { value: 'sliding', label: 'Раздвижная' },
      { value: 'swing', label: 'Распашная' },
      { value: 'fixed', label: 'Глухая (витрина)' },
      { value: 'unknown', label: 'Подскажите' },
    ] },
    { code: 'hasDoor', titleRu: 'Нужна дверь', type: 'boolean' },
    { code: 'hasWindow', titleRu: 'Нужно окно/витрина', type: 'boolean' },
    { code: 'quantity', titleRu: 'Количество', type: 'number', unit: 'шт.', min: 1, max: 50 },
  ],
  repair: [
    { code: 'issues', titleRu: 'Что случилось', type: 'multiselect', required: true, choices: [
      { value: 'not_closing', label: 'Не закрывается' },
      { value: 'blowing', label: 'Дует' },
      { value: 'condensation', label: '«Плачет» окно' },
      { value: 'broken_handle', label: 'Сломана ручка' },
      { value: 'balcony_door', label: 'Проблема с балконной дверью' },
      { value: 'other', label: 'Другое' },
    ] },
    { code: 'units', titleRu: 'Сколько окон/дверей', type: 'number', unit: 'шт.', min: 1, max: 50 },
  ],
  other: [
    { code: 'description', titleRu: 'Опишите коротко, что нужно', type: 'text', required: true },
  ],
};

/** Common last-step fields (installation, delivery). */
export const COMMON_FIELDS: CatalogField[] = [
  { code: 'install', titleRu: 'Нужен монтаж', type: 'boolean' },
  { code: 'delivery', titleRu: 'Нужна доставка', type: 'boolean' },
];

export const BALCONY_ESTIMATE_AREAS = ['length', 'widthM'] as const;

/** One-line summary of the calculator payload, used in Telegram and the admin. */
export function describeCalc(kind: LeadKind, payload: Record<string, unknown> | null | undefined): string {
  if (!payload) return '';
  const parts: string[] = [];
  const push = (value: unknown, suffix = '') => {
    if (value === undefined || value === null || value === '') return;
    if (Array.isArray(value) && value.length === 0) return;
    if (Array.isArray(value)) {
      parts.push(`${value.join(', ')}${suffix}`);
      return;
    }
    if (typeof value === 'boolean') {
      // Booleans are only meaningful when true in this context.
      if (value) parts.push(suffix ? suffix : 'да');
      return;
    }
    parts.push(`${String(value)}${suffix}`);
  };

  switch (kind) {
    case 'window':
      if (payload.width && payload.height) parts.push(`${payload.width}×${payload.height} мм`);
      push(payload.sashes, ' ств.');
      push(payload.opening);
      push(payload.quantity, ' шт.');
      push(payload.color);
      push(payload.extras);
      break;
    case 'balcony':
      push(payload.objectType);
      if (payload.length) parts.push(`${payload.length} м${payload.widthM ? ` × ${payload.widthM} м` : ''}`);
      push(payload.height, ' м высота');
      push(payload.glazing);
      push(payload.extras);
      if (payload.floor) parts.push(`этаж ${payload.floor}`);
      if (payload.lift === true) parts.push('лифт есть');
      if (payload.lift === false) parts.push('лифта нет');
      break;
    case 'partition':
      push(payload.size);
      push(payload.partitionType);
      if (payload.hasDoor === true) parts.push('с дверью');
      if (payload.hasWindow === true) parts.push('с окном');
      push(payload.quantity, ' шт.');
      break;
    case 'repair':
      push(payload.issues);
      push(payload.units, ' шт.');
      break;
    default:
      push(payload.description);
  }

  if (payload.install === true) parts.push('монтаж нужен');
  if (payload.delivery === true) parts.push('доставка нужна');
  return parts.join(' · ');
}
