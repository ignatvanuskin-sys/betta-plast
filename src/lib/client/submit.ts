'use client';

/**
 * Shared client-side submit helper: attaches the consent version, attribution,
 * device info and the session id, then normalises server errors into a
 * `{ field: message }` shape the forms can render.
 */
import { captureAttribution, detectDevice, getSessionId, trackEventClient } from './analytics';

export type SubmitPayload = {
  formKind: string;
  kind: string;
  segment?: 'b2c' | 'b2b';
  name: string;
  phone: string;
  email?: string;
  organization?: string;
  district?: string;
  address?: string;
  comment?: string;
  preferredContact?: string;
  preferredDates?: string;
  calcPayload?: Record<string, unknown>;
  consent: boolean;
  consentVersion: string;
  /** Hidden anti-spam field; must stay empty. */
  honeypot?: string;
};

export type SubmitResult =
  | { ok: true; id: number; repeated: boolean }
  | { ok: false; errors: Record<string, string>; message: string };

export function newSubmissionId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function submitLead(
  payload: SubmitPayload,
  files: File[] = [],
  submissionId: string = newSubmissionId(),
): Promise<SubmitResult> {
  const attribution = captureAttribution();

  const body = new FormData();
  body.set('payload', JSON.stringify(payload));
  body.set('submissionId', submissionId);
  body.set('device', detectDevice());
  body.set('sessionId', getSessionId());
  if (attribution.src) body.set('src', attribution.src);
  if (attribution.utm) body.set('utm', JSON.stringify(attribution.utm));
  if (attribution.referrer) body.set('referrer', attribution.referrer);
  if (attribution.landingPath) body.set('landingPath', attribution.landingPath);
  body.set('pagePath', typeof window === 'undefined' ? '' : window.location.pathname);
  for (const file of files.slice(0, 3)) body.append('files', file);

  try {
    const response = await fetch('/api/leads', { method: 'POST', body });
    const json = (await response.json().catch(() => null)) as
      | { ok: true; id: number; repeated: boolean }
      | { ok: false; errors?: Record<string, string>; message?: string }
      | null;

    if (response.ok && json && 'ok' in json && json.ok) {
      trackEventClient('lead_submit', { formKind: payload.formKind, kind: payload.kind });
      return { ok: true, id: json.id, repeated: json.repeated };
    }

    if (json && 'errors' in json && json.errors) {
      return { ok: false, errors: json.errors, message: json.message ?? 'Проверьте отмеченные поля' };
    }
    return {
      ok: false,
      errors: {},
      message:
        (json && 'message' in json && json.message) ||
        `Не удалось отправить заявку (${response.status}). Попробуйте ещё раз или позвоните нам.`,
    };
  } catch {
    return {
      ok: false,
      errors: {},
      message: 'Не удалось отправить заявку. Ваши данные сохранены в форме: попробуйте ещё раз или позвоните нам.',
    };
  }
}
