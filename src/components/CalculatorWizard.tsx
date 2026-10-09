'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { CATALOG, COMMON_FIELDS, type CatalogField } from '@/lib/domain/catalog';
import { CONSENT_VERSION, KARAGANDA_DISTRICTS, KIND_LABELS_RU } from '@/lib/domain/validation';
import { trackEventClient } from '@/lib/client/analytics';
import { newSubmissionId, submitLead } from '@/lib/client/submit';

const KINDS = ['window', 'balcony', 'partition', 'repair', 'other'] as const;
type WizardKind = (typeof KINDS)[number];

const STEP_TITLES = ['Что нужно', 'Параметры', 'Где и когда', 'Контакты'];

/**
 * Calculator / questionnaire (§8.2): four steps, one question per screen on
 * mobile, progress bar, and the option set comes from the catalog (seeded into
 * `product_options` so the owner can change it without a deploy).
 *
 * The client sends configuration only — never a price. The server decides
 * whether a price may be shown at all (PRICE_DISPLAY).
 */
export function CalculatorWizard({ initialKind }: { initialKind?: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [kind, setKind] = useState<WizardKind>(
    KINDS.includes(initialKind as WizardKind) ? (initialKind as WizardKind) : 'balcony',
  );
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const submissionId = useMemo(() => newSubmissionId(), []);

  useEffect(() => {
    trackEventClient('calc_start', { kind });
    // Reported once per mount on purpose.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fields: CatalogField[] = [...(CATALOG[kind] ?? []), ...COMMON_FIELDS];

  function setValue(code: string, value: unknown) {
    setValues((previous) => ({ ...previous, [code]: value }));
  }

  function toggleMulti(code: string, option: string) {
    const current = Array.isArray(values[code]) ? (values[code] as string[]) : [];
    const next = current.includes(option) ? current.filter((item) => item !== option) : [...current, option];
    setValue(code, next);
  }

  function validateStep(): string | null {
    if (step === 1) {
      for (const field of fields) {
        if (!field.required) continue;
        const value = values[field.code];
        if (value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
          return `Заполните: ${field.titleRu}`;
        }
      }
    }
    if (step === 3) {
      const name = String(values.name ?? '').trim();
      const phone = String(values.phone ?? '').replace(/\D/g, '');
      if (name.length < 2) return 'Укажите имя';
      if (phone.length < 10) return 'Проверьте номер телефона';
      if (values.consent !== true) return 'Нужно согласие на обработку персональных данных';
    }
    return null;
  }

  function next() {
    const problem = validateStep();
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setStep((current) => Math.min(current + 1, 3));
  }

  function back() {
    setError(null);
    setStep((current) => Math.max(current - 1, 0));
  }

  async function submit() {
    const problem = validateStep();
    if (problem) {
      setError(problem);
      return;
    }
    setPending(true);
    setError(null);

    const calcPayload: Record<string, unknown> = { ...values };
    delete calcPayload.name;
    delete calcPayload.phone;
    delete calcPayload.consent;
    delete calcPayload.comment;

    const files =
      typeof values.files === 'object' && values.files instanceof FileList
        ? Array.from(values.files).slice(0, 3)
        : [];

    const result = await submitLead(
      {
        formKind: 'calculator',
        kind,
        segment: 'b2c',
        name: String(values.name ?? '').trim(),
        phone: String(values.phone ?? '').trim(),
        district: values.district ? String(values.district) : undefined,
        address: values.address ? String(values.address) : undefined,
        comment: values.comment ? String(values.comment) : undefined,
        preferredContact: String(values.preferredContact ?? 'call'),
        preferredDates: values.preferredDates ? String(values.preferredDates) : undefined,
        calcPayload,
        consent: values.consent === true,
        consentVersion: CONSENT_VERSION,
      },
      files,
      submissionId,
    );
    setPending(false);

    if (result.ok) {
      trackEventClient('calc_complete', { kind });
      router.push(`/spasibo?form=calculator&id=${result.id}&kind=${kind}`);
      return;
    }
    setMessage(result.message);
    setError(Object.values(result.errors)[0] ?? result.message);
  }

  return (
    <div>
      <ol className="flex items-center gap-2" aria-label="Шаги расчёта">
        {STEP_TITLES.map((title, index) => (
          <li key={title} className="flex flex-1 items-center gap-2">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                index <= step ? 'bg-cta text-white' : 'border border-line bg-surface text-muted'
              }`}
              aria-current={index === step ? 'step' : undefined}
            >
              {index + 1}
            </span>
            <span className={`hidden text-sm sm:block ${index <= step ? 'text-ink' : 'text-muted'}`}>{title}</span>
            {index < STEP_TITLES.length - 1 ? (
              <span className={`h-0.5 flex-1 ${index < step ? 'bg-cta' : 'bg-line'}`} aria-hidden="true" />
            ) : null}
          </li>
        ))}
      </ol>

      <div className="mt-6 card">
        {step === 0 ? (
          <fieldset>
            <legend className="text-lg font-semibold">Что нужно рассчитать?</legend>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {KINDS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setKind(option)}
                  aria-pressed={kind === option}
                  className={`min-h-12 rounded-lg border px-4 text-left font-medium ${
                    kind === option ? 'border-glass bg-glass-soft text-glass' : 'border-line bg-surface text-ink'
                  }`}
                >
                  {KIND_LABELS_RU[option]}
                </button>
              ))}
            </div>
          </fieldset>
        ) : null}

        {step === 1 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((field) => (
              <div key={field.code} className={field.type === 'multiselect' || field.type === 'text' ? 'sm:col-span-2' : ''}>
                <label className="label" htmlFor={`calc-${field.code}`}>
                  {field.titleRu}
                  {field.unit ? <span className="hint"> ({field.unit})</span> : null}
                </label>

                {field.type === 'number' ? (
                  <input
                    id={`calc-${field.code}`}
                    className="field"
                    type="number"
                    inputMode="decimal"
                    min={field.min}
                    max={field.max}
                    value={String(values[field.code] ?? '')}
                    onChange={(event) => setValue(field.code, event.target.value)}
                  />
                ) : null}

                {field.type === 'text' ? (
                  <input
                    id={`calc-${field.code}`}
                    className="field"
                    placeholder={field.placeholder}
                    value={String(values[field.code] ?? '')}
                    onChange={(event) => setValue(field.code, event.target.value)}
                  />
                ) : null}

                {field.type === 'select' ? (
                  <select
                    id={`calc-${field.code}`}
                    className="field"
                    value={String(values[field.code] ?? '')}
                    onChange={(event) => setValue(field.code, event.target.value)}
                  >
                    <option value="">Выберите</option>
                    {(field.choices ?? []).map((choice) => (
                      <option key={choice.value} value={choice.value}>
                        {choice.label}
                      </option>
                    ))}
                  </select>
                ) : null}

                {field.type === 'boolean' ? (
                  <label className="flex min-h-12 items-center gap-3">
                    <input
                      id={`calc-${field.code}`}
                      type="checkbox"
                      className="h-5 w-5"
                      checked={values[field.code] === true}
                      onChange={(event) => setValue(field.code, event.target.checked)}
                    />
                    Да
                  </label>
                ) : null}

                {field.type === 'multiselect' ? (
                  <div className="flex flex-wrap gap-2">
                    {(field.choices ?? []).map((choice) => {
                      const active = Array.isArray(values[field.code]) && (values[field.code] as string[]).includes(choice.value);
                      return (
                        <button
                          key={choice.value}
                          type="button"
                          onClick={() => toggleMulti(field.code, choice.value)}
                          aria-pressed={active}
                          className={`min-h-11 rounded-full border px-4 text-sm ${
                            active ? 'border-glass bg-glass-soft text-glass' : 'border-line bg-surface text-ink-soft'
                          }`}
                        >
                          {choice.label}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            ))}
            <p className="hint sm:col-span-2">
              Размеры можно указать примерно — точные цифры снимет замерщик.
            </p>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="calc-district">
                Район
              </label>
              <select
                id="calc-district"
                className="field"
                value={String(values.district ?? '')}
                onChange={(event) => setValue('district', event.target.value)}
              >
                <option value="">Не важно / уточню</option>
                {KARAGANDA_DISTRICTS.map((district) => (
                  <option key={district} value={district}>
                    {district}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="calc-dates">
                Когда удобно принять мастера
              </label>
              <input
                id="calc-dates"
                className="field"
                placeholder="например: будни после 18:00"
                value={String(values.preferredDates ?? '')}
                onChange={(event) => setValue('preferredDates', event.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="calc-address">
                Адрес <span className="hint">(необязательно)</span>
              </label>
              <input
                id="calc-address"
                className="field"
                autoComplete="street-address"
                value={String(values.address ?? '')}
                onChange={(event) => setValue('address', event.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="calc-photos">
                Фото проёма <span className="hint">(до 3 файлов, JPG/PNG/PDF)</span>
              </label>
              <input
                id="calc-photos"
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="field py-2"
                onChange={(event) => setValue('files', event.target.files)}
              />
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="calc-name">
                Имя
              </label>
              <input
                id="calc-name"
                className="field"
                autoComplete="name"
                value={String(values.name ?? '')}
                onChange={(event) => setValue('name', event.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="calc-phone">
                Телефон
              </label>
              <input
                id="calc-phone"
                className="field"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="+7 ___ ___ __ __"
                value={String(values.phone ?? '')}
                onChange={(event) => setValue('phone', event.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="calc-comment">
                Комментарий <span className="hint">(необязательно)</span>
              </label>
              <textarea
                id="calc-comment"
                className="field min-h-24"
                value={String(values.comment ?? '')}
                onChange={(event) => setValue('comment', event.target.value)}
              />
            </div>
            <fieldset className="sm:col-span-2">
              <legend className="label">Как удобнее связаться</legend>
              <div className="flex flex-wrap gap-3 text-sm">
                {[
                  { value: 'call', label: 'Звонок' },
                  { value: 'whatsapp', label: 'WhatsApp' },
                  { value: 'any', label: 'Как удобно' },
                ].map((option) => (
                  <label key={option.value} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="calc-contact"
                      value={option.value}
                      checked={String(values.preferredContact ?? 'call') === option.value}
                      onChange={() => setValue('preferredContact', option.value)}
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="flex items-start gap-3 text-sm text-ink-soft sm:col-span-2">
              <input
                type="checkbox"
                className="mt-1 h-5 w-5"
                checked={values.consent === true}
                onChange={(event) => setValue('consent', event.target.checked)}
              />
              <span>
                Согласен на обработку персональных данных согласно{' '}
                <Link href="/politika" className="font-semibold text-glass underline">
                  политике конфиденциальности
                </Link>
                .
              </span>
            </label>
          </div>
        ) : null}

        {error ? (
          <p role="alert" className="mt-4 rounded-lg bg-[#fdf3ef] p-3 text-sm text-danger">
            {error}
          </p>
        ) : null}
        {message && !error ? <p className="mt-4 text-sm text-danger">{message}</p> : null}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {step > 0 ? (
            <button type="button" onClick={back} className="btn btn-outline">
              Назад
            </button>
          ) : null}
          {step < 3 ? (
            <button type="button" onClick={next} className="btn btn-cta">
              Далее
            </button>
          ) : (
            <button type="button" onClick={submit} className="btn btn-cta" disabled={pending} aria-busy={pending}>
              {pending ? 'Отправляем…' : 'Отправить заявку'}
            </button>
          )}
          <span className="hint">Шаг {step + 1} из 4</span>
        </div>

        {kind === 'balcony' ? (
          <p className="hint mt-4">
            Подсказка: для балкона достаточно длины и ширины в метрах — например 3,2 м на 1,2 м.
          </p>
        ) : null}
      </div>
    </div>
  );
}
