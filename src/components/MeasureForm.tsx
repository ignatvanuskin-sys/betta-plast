'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { trackEventClient } from '@/lib/client/analytics';
import { newSubmissionId, submitLead } from '@/lib/client/submit';
import { CONSENT_VERSION, KARAGANDA_DISTRICTS } from '@/lib/domain/validation';

type Slot = { startsAt: string; label: string };

function dayKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function humanDay(date: Date): string {
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', weekday: 'short' });
}

/**
 * Measurement booking (§8.3). The customer picks a day and a free time; the
 * request is stored as `pending` and confirmed by a manager. Slots are validated
 * again on the server, so a stale page cannot oversubscribe a window.
 */
export function MeasureForm() {
  const router = useRouter();
  const submissionId = useMemo(() => newSubmissionId(), []);
  const days = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 14 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() + index);
      return date;
    });
  }, []);

  const [day, setDay] = useState(days[0] ?? new Date());
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setSlot(null);
    fetch(`/api/slots?day=${dayKey(day)}`)
      .then((response) => response.json())
      .then((data: { ok: boolean; slots?: Slot[] }) => {
        if (cancelled) return;
        setSlots(data.ok ? (data.slots ?? []) : []);
      })
      .catch(() => {
        if (!cancelled) setSlots([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [day]);

  function setValue(code: string, value: string) {
    setValues((previous) => ({ ...previous, [code]: value }));
  }

  async function handleSubmit() {
    if (!slot) {
      setError('Выберите удобное время');
      return;
    }
    const name = (values.name ?? '').trim();
    const phone = (values.phone ?? '').replace(/\D/g, '');
    if (name.length < 2) return setError('Укажите имя');
    if (phone.length < 10) return setError('Проверьте номер телефона');
    if (values.consent !== 'on') return setError('Нужно согласие на обработку персональных данных');

    setPending(true);
    setError(null);

    const result = await submitLead(
      {
        formKind: 'measure',
        kind: values.kind || 'other',
        segment: 'b2c',
        name,
        phone,
        district: values.district || undefined,
        address: values.address || undefined,
        comment: values.comment || undefined,
        preferredContact: values.preferredContact || 'call',
        calcPayload: { requestedSlot: slot.startsAt, requestedSlotLabel: `${humanDay(day)}, ${slot.label}` },
        consent: true,
        consentVersion: CONSENT_VERSION,
      },
      [],
      submissionId,
    );
    setPending(false);

    if (result.ok) {
      trackEventClient('measure_request', { day: dayKey(day), label: slot.label });
      router.push(`/spasibo?form=measure&id=${result.id}`);
      return;
    }
    setError(Object.values(result.errors)[0] ?? result.message);
  }

  return (
    <div className="grid gap-6">
      <div>
        <p className="label">1. Выберите день</p>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {days.map((date) => {
            const active = dayKey(date) === dayKey(day);
            return (
              <button
                key={dayKey(date)}
                type="button"
                onClick={() => setDay(date)}
                aria-pressed={active}
                className={`min-h-12 shrink-0 rounded-lg border px-3 text-sm ${
                  active ? 'border-glass bg-glass-soft text-glass' : 'border-line bg-surface text-ink-soft'
                }`}
              >
                {humanDay(date)}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="label">2. Выберите время</p>
        {loading ? <p className="hint">Смотрим свободное время…</p> : null}
        {!loading && slots.length === 0 ? (
          <p className="hint">
            На этот день свободного времени нет. Выберите другой день или напишите нам — подберём окно вручную.
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {slots.map((entry) => (
            <button
              key={entry.startsAt}
              type="button"
              onClick={() => {
                setSlot(entry);
                setError(null);
              }}
              aria-pressed={slot?.startsAt === entry.startsAt}
              className={`min-h-11 rounded-lg border px-4 text-sm ${
                slot?.startsAt === entry.startsAt
                  ? 'border-cta bg-[#fdf3ef] font-semibold text-cta'
                  : 'border-line bg-surface text-ink'
              }`}
            >
              {entry.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="m-name">
            3. Имя
          </label>
          <input
            id="m-name"
            className="field"
            autoComplete="name"
            value={values.name ?? ''}
            onChange={(event) => setValue('name', event.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="m-phone">
            Телефон
          </label>
          <input
            id="m-phone"
            className="field"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+7 ___ ___ __ __"
            value={values.phone ?? ''}
            onChange={(event) => setValue('phone', event.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="m-district">
            Район
          </label>
          <select
            id="m-district"
            className="field"
            value={values.district ?? ''}
            onChange={(event) => setValue('district', event.target.value)}
          >
            <option value="">Выберите район</option>
            {KARAGANDA_DISTRICTS.map((district) => (
              <option key={district} value={district}>
                {district}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="m-kind">
            Что замерять
          </label>
          <select
            id="m-kind"
            className="field"
            value={values.kind ?? 'window'}
            onChange={(event) => setValue('kind', event.target.value)}
          >
            <option value="window">Окна</option>
            <option value="balcony">Балкон / лоджия</option>
            <option value="partition">Перегородка</option>
            <option value="other">Другое</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="m-address">
            Адрес
          </label>
          <input
            id="m-address"
            className="field"
            autoComplete="street-address"
            placeholder="улица, дом, квартира, этаж"
            value={values.address ?? ''}
            onChange={(event) => setValue('address', event.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="m-comment">
            Комментарий <span className="hint">(необязательно)</span>
          </label>
          <textarea
            id="m-comment"
            className="field min-h-20"
            value={values.comment ?? ''}
            onChange={(event) => setValue('comment', event.target.value)}
          />
        </div>
      </div>

      <label className="flex items-start gap-3 text-sm text-ink-soft">
        <input
          type="checkbox"
          className="mt-1 h-5 w-5"
          checked={values.consent === 'on'}
          onChange={(event) => setValue('consent', event.target.checked ? 'on' : 'off')}
        />
        <span>
          Согласен на обработку персональных данных согласно{' '}
          <Link href="/politika" className="font-semibold text-glass underline">
            политике конфиденциальности
          </Link>
          .
        </span>
      </label>

      {error ? (
        <p role="alert" className="rounded-lg bg-[#fdf3ef] p-3 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <button type="button" onClick={handleSubmit} className="btn btn-cta" disabled={pending} aria-busy={pending}>
        {pending ? 'Отправляем…' : 'Записаться на замер'}
      </button>
      <p className="hint">
        Запись подтверждает менеджер: мы напишем или позвоним и уточним время. Условия замера — у менеджера.
      </p>
    </div>
  );
}
