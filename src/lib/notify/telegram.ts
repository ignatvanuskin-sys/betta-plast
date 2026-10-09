/**
 * Telegram Bot API client (§8.4) — implemented directly against the HTTP API,
 * which §12 explicitly allows ("grammY или Bot API напрямую") and keeps the
 * dependency surface small.
 */
import { telegram } from '../config';
import type { Notifier, TelegramButton, TelegramPayload } from './types';

const API_BASE = 'https://api.telegram.org';

function apiUrl(method: string): string {
  return `${API_BASE}/bot${telegram.botToken}/${method}`;
}

type TelegramResponse<T> = { ok: boolean; result?: T; description?: string };

async function call<T>(method: string, body: Record<string, unknown>): Promise<T> {
  if (!telegram.enabled) {
    throw new Error('Telegram не настроен: не задан TELEGRAM_BOT_TOKEN');
  }
  const response = await fetch(apiUrl(method), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  });
  const json = (await response.json().catch(() => null)) as TelegramResponse<T> | null;
  if (!response.ok || !json?.ok) {
    throw new Error(`Telegram ${method} failed: ${json?.description ?? response.status}`);
  }
  return json.result as T;
}

export function buildReplyMarkup(buttons: TelegramButton[][] | undefined) {
  if (!buttons || buttons.length === 0) return undefined;
  return {
    inline_keyboard: buttons.map((row) =>
      row.map((button) =>
        button.url
          ? { text: button.text, url: button.url }
          : { text: button.text, callback_data: button.callbackData ?? 'noop' },
      ),
    ),
  };
}

export const telegramNotifier: Notifier<TelegramPayload> = {
  channel: 'telegram',
  async send(payload) {
    const reply_markup = buildReplyMarkup(payload.buttons);

    if (payload.editMessageId) {
      try {
        await call('editMessageText', {
          chat_id: payload.chatId,
          message_id: payload.editMessageId,
          text: payload.text,
          parse_mode: payload.parseMode,
          disable_web_page_preview: true,
          reply_markup,
        });
        return;
      } catch (error) {
        // Editing fails when the text is unchanged or the message is too old;
        // fall back to posting a new card so the information is never lost.
        const message = error instanceof Error ? error.message : String(error);
        if (!message.includes('message is not modified')) {
          await call('sendMessage', {
            chat_id: payload.chatId,
            text: payload.text,
            parse_mode: payload.parseMode,
            disable_web_page_preview: true,
            reply_markup,
            disable_notification: payload.disableNotification === true,
          });
        }
        return;
      }
    }

    await call('sendMessage', {
      chat_id: payload.chatId,
      text: payload.text,
      parse_mode: payload.parseMode,
      disable_web_page_preview: true,
      reply_markup,
      disable_notification: payload.disableNotification === true,
    });
  },
};

/** Answers a callback query so the button stops spinning in the client. */
export async function answerCallbackQuery(callbackQueryId: string, text?: string): Promise<void> {
  try {
    await call('answerCallbackQuery', {
      callback_query_id: callbackQueryId,
      text: text?.slice(0, 190),
      show_alert: false,
    });
  } catch {
    // Never block the flow on a cosmetic acknowledgement.
  }
}

export async function setWebhook(url: string, secretToken: string): Promise<void> {
  await call('setWebhook', {
    url,
    secret_token: secretToken || undefined,
    allowed_updates: ['message', 'callback_query'],
    drop_pending_updates: true,
  });
}

export async function deleteWebhook(): Promise<void> {
  await call('deleteWebhook', { drop_pending_updates: true });
}

export type TelegramUpdate = {
  update_id: number;
  message?: {
    message_id: number;
    chat: { id: number; type: string };
    from?: { id: number; first_name?: string; username?: string };
    text?: string;
  };
  callback_query?: {
    id: string;
    from: { id: number; first_name?: string; username?: string };
    message?: { message_id: number; chat: { id: number } };
    data?: string;
  };
};
