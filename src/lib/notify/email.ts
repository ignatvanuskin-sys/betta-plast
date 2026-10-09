/**
 * Fallback notification channel (§8.1): if Telegram is unavailable the lead is
 * still announced by email. Uses the Resend HTTP API through `fetch`, so no
 * extra dependency is required; without keys the channel simply stays off.
 */
import { email } from '../config';
import type { EmailPayload, Notifier } from './types';

export const emailNotifier: Notifier<EmailPayload> = {
  channel: 'email',
  async send(payload) {
    if (!email.enabled) {
      throw new Error('Email-канал не настроен: нужны RESEND_API_KEY и NOTIFY_EMAIL_TO');
    }
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${email.resendApiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from: email.resendFrom,
        to: [payload.to ?? email.notifyTo],
        subject: payload.subject,
        text: payload.text,
      }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`Email не отправлен: HTTP ${response.status} ${body.slice(0, 200)}`);
    }
  },
};
