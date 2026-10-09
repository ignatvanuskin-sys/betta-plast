/**
 * Generic outbound webhook (§8.7) — the integration point for a future CRM or
 * Google Sheets mirror. Disabled (and harmless) when LEAD_WEBHOOK_URL is unset.
 */
import type { Notifier, WebhookPayload } from './types';

const env = process.env;

export function leadWebhookUrl(): string {
  return (env.LEAD_WEBHOOK_URL ?? '').trim();
}

export const webhookNotifier: Notifier<WebhookPayload> = {
  channel: 'webhook',
  async send(payload) {
    const url = leadWebhookUrl();
    if (!url) throw new Error('LEAD_WEBHOOK_URL не задан — вебхук отключён');

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ event: payload.event, sentAt: new Date().toISOString(), data: payload.data }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) {
      throw new Error(`Webhook не отправлен: HTTP ${response.status}`);
    }
  },
};
