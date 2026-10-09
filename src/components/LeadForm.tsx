'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useRef, useState, type FormEvent } from 'react';

import { newSubmissionId, submitLead, type SubmitPayload } from '@/lib/client/submit';
import { KIND_LABELS_RU, KARAGANDA_DISTRICTS, CONSENT_VERSION } from '@/lib/domain/validation';

export type LeadFormProps = {
  formKind: string;
  defaultKind?: string;
  segment?: 'b2c' | 'b2b';
  /** Renders the "what do you need" select. */
  showKindSelect?: boolean;
  showDistrict?: boolean;
  showComment?: boolean;
  showEmail?: boolean;
  showOrganization?: boolean;
  showAddress?: boolean;
  showDates?: boolean;
  allowFiles?: boolean;
  commentLabel?: string;
  commentPlaceholder?: string;
  submitLabel?: string;
  /** Extra values merged into `calcPayload` (used by the calculator). */
  calcPayload?: Record<string, unknown>;
  onDone?: () => void;
  compact?: boolean;
};

const KIND_OPTIONS = [
  { value: 'window', label: KIND_LABELS_RU.window },
  { value: 'balcony', label: KIND_LABELS_RU.balcony },
  { value: 'partition', label: KIND_LABELS_RU.partition },
  { value: 'repair', label: KIND_LABELS_RU.repair },
  { value: 'other', label: KIND_LABELS_RU.other },
];

/**
 * The universal lead form (§4/§8.1). Every variant on the site is this
 * component with a different set of visible fields — one pipeline, one
 * validation path, one place to change.
 */
export function LeadForm({
  formKind,
  defaultKind = 'other',
  segment = 'b2c',
  showKindSelect = true,
  showDistrict = true,
  showComment = true,
  showEmail = false,
  showOrganization = false,
  showAddress = false,
  showDates = false,
  allowFiles = false,
  commentLabel = 'Комментарий',
  commentPlaceholder = 'Например: нужен балкон 3,2 м, тёплое остекление',
  submitLabel = 'Получить расчёт',
  calcPayload,
  onDone,
  compact = false,
}: LeadFormProps) {
  const router = useRouter();
  const submissionId = useMemo(() => newSubmissionId(), []);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [kind, setKind] = useState(defaultKind);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setErrors({});
    if (pending) return; // double-click protection (idempotent server-side too)

    const form = event.currentTarget;
    const data = new FormData(form);

    const payload: SubmitPayload = {
      formKind,
      kind: showKindSelect ? String(data.get('kind') ?? kind) : kind,
      segment,
      name: String(data.get('name') ?? '').trim(),
      phone: String(data.get('phone') ?? '').trim(),
      email: String(data.get('email') ?? '').trim() || undefined,
      organization: String(data.get('organization') ?? '').trim() || undefined,
      district: String(data.get('district') ?? '').trim() || undefined,
      address: String(data.get('address') ?? '').trim() || undefined,
      comment: String(data.get('comment') ?? '').trim() || undefined,
      preferredContact: String(data.get('preferredContact') ?? 'call'),
      preferredDates: String(data.get('preferredDates') ?? '').trim() || undefined,
      calcPayload: calcPayload && Object.keys(calcPayload).length > 0 ? calcPayload : undefined,
      consent: data.get('consent') === 'on',
      consentVersion: CONSENT_VERSION,
      honeypot: String(data.get('company_website') ?? ''),
    };

    // Client-side mirror of the server rules, for instant feedback.
    const localErrors: Record<string, string> = {};
    if (payload.name.length < 2) localErrors.name = 'Укажите имя';
    if (!/[\d]{10,}/.test(payload.phone.replace(/\D/g, ''))) localErrors.phone = 'Проверьте номер телефона';
    if (!payload.consent) localErrors.consent = 'Нужно согласие на обработку персональных данных';
    if (Object.keys(localErrors).length > 0) {
      setErrors(localErrors);
      setMessage('Проверьте отмеченные поля');
      return;
    }

    const files = allowFiles
      ? (data.getAll('files') as File[]).filter((file) => file instanceof File && file.size > 0).slice(0, 3)
      : [];

    setPending(true);
    const result = await submitLead(payload, files, submissionId);
    setPending(false);

    if (result.ok) {
      onDone?.();
      router.push(`/spasibo?form=${encodeURIComponent(formKind)}&id=${result.id}${result.repeated ? '&repeat=1' : ''}`);
      return;
    }

    setErrors(result.errors);
    setMessage(result.message);
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className={compact ? 'grid gap-3' : 'grid gap-4'}>
      {showKindSelect ? (
        <div>
          <label className="label" htmlFor={`kind-${formKind}`}>
            Что нужно
          </label>
          <select
            id={`kind-${formKind}`}
            name="kind"
            className="field"
            value={kind}
            onChange={(event) => setKind(event.target.value)}
            aria-invalid={Boolean(errors.kind)}
          >
            {KIND_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.kind ? <p className="mt-1 text-sm text-danger">{errors.kind}</p> : null}
        </div>
      ) : null}

      <div className={compact ? 'grid gap-3 sm:grid-cols-2' : 'grid gap-4 sm:grid-cols-2'}>
        <div>
          <label className="label" htmlFor={`name-${formKind}`}>
            Как вас зовут
          </label>
          <input
            id={`name-${formKind}`}
            name="name"
            className="field"
            autoComplete="name"
            enterKeyHint="next"
            aria-invalid={Boolean(errors.name)}
            required
          />
          {errors.name ? <p className="mt-1 text-sm text-danger">{errors.name}</p> : null}
        </div>
        <div>
          <label className="label" htmlFor={`phone-${formKind}`}>
            Телефон
          </label>
          <input
            id={`phone-${formKind}`}
            name="phone"
            className="field"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+7 ___ ___ __ __"
            aria-invalid={Boolean(errors.phone)}
            required
          />
          {errors.phone ? <p className="mt-1 text-sm text-danger">{errors.phone}</p> : null}
        </div>
      </div>

      {showOrganization ? (
        <div>
          <label className="label" htmlFor={`org-${formKind}`}>
            Организация
          </label>
          <input id={`org-${formKind}`} name="organization" className="field" autoComplete="organization" />
        </div>
      ) : null}

      {showEmail ? (
        <div>
          <label className="label" htmlFor={`email-${formKind}`}>
            Email <span className="hint">(необязательно)</span>
          </label>
          <input id={`email-${formKind}`} name="email" type="email" inputMode="email" autoComplete="email" className="field" />
          {errors.email ? <p className="mt-1 text-sm text-danger">{errors.email}</p> : null}
        </div>
      ) : null}

      {showDistrict ? (
        <div>
          <label className="label" htmlFor={`district-${formKind}`}>
            Район
          </label>
          <select id={`district-${formKind}`} name="district" className="field" defaultValue="">
            <option value="">Не важно / уточню</option>
            {KARAGANDA_DISTRICTS.map((district) => (
              <option key={district} value={district}>
                {district}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {showAddress ? (
        <div>
          <label className="label" htmlFor={`address-${formKind}`}>
            Адрес объекта <span className="hint">(улица, дом, квартира)</span>
          </label>
          <input id={`address-${formKind}`} name="address" className="field" autoComplete="street-address" />
        </div>
      ) : null}

      {showDates ? (
        <div>
          <label className="label" htmlFor={`dates-${formKind}`}>
            Когда удобно принять мастера
          </label>
          <input
            id={`dates-${formKind}`}
            name="preferredDates"
            className="field"
            placeholder="например: будни после 18:00"
          />
        </div>
      ) : null}

      {showComment ? (
        <div>
          <label className="label" htmlFor={`comment-${formKind}`}>
            {commentLabel}
          </label>
          <textarea
            id={`comment-${formKind}`}
            name="comment"
            className="field min-h-24"
            rows={3}
            placeholder={commentPlaceholder}
          />
        </div>
      ) : null}

      {allowFiles ? (
        <div>
          <label className="label" htmlFor={`files-${formKind}`}>
            Фото или файл <span className="hint">(до 3 файлов, JPG/PNG/PDF, до 15 МБ)</span>
          </label>
          <input
            id={`files-${formKind}`}
            name="files"
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="field py-2"
          />
          {errors.files ? <p className="mt-1 text-sm text-danger">{errors.files}</p> : null}
        </div>
      ) : null}

      <fieldset>
        <legend className="label">Как удобнее связаться</legend>
        <div className="flex flex-wrap gap-3 text-sm">
          {[
            { value: 'call', label: 'Звонок' },
            { value: 'whatsapp', label: 'WhatsApp' },
            { value: 'any', label: 'Как удобно' },
          ].map((option) => (
            <label key={option.value} className="flex items-center gap-2">
              <input type="radio" name="preferredContact" value={option.value} defaultChecked={option.value === 'call'} />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Honeypot: hidden from people, irresistible to bots. */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor={`hp-${formKind}`}>Не заполняйте это поле</label>
        <input id={`hp-${formKind}`} name="company_website" tabIndex={-1} autoComplete="off" />
      </div>

      <label className="flex items-start gap-3 text-sm text-ink-soft">
        <input type="checkbox" name="consent" className="mt-1 h-5 w-5" aria-invalid={Boolean(errors.consent)} />
        <span>
          Согласен на обработку персональных данных в соответствии с{' '}
          <Link href="/politika" className="font-semibold text-glass underline">
            политикой конфиденциальности
          </Link>
          .
        </span>
      </label>
      {errors.consent ? <p className="text-sm text-danger">{errors.consent}</p> : null}

      {message ? (
        <p role="alert" className="rounded-lg bg-[#fdf3ef] p-3 text-sm text-danger">
          {message}
        </p>
      ) : null}

      <button type="submit" className="btn btn-cta w-full" disabled={pending} aria-busy={pending}>
        {pending ? 'Отправляем…' : submitLabel}
      </button>
      <p className="hint">
        Нажимая кнопку, вы отправляете заявку менеджеру. Мы свяжемся в рабочее время. Ответим и в WhatsApp, если так
        удобнее.
      </p>
    </form>
  );
}
