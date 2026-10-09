/**
 * Notification abstraction (§12): the domain layer calls a `Notifier`, it does
 * not know whether the message leaves through Telegram, email or a webhook.
 */

export type TelegramButton = { text: string; callbackData?: string; url?: string };

export type TelegramPayload = {
  kind: 'telegram';
  chatId: string;
  text: string;
  buttons?: TelegramButton[][];
  /** When set, the job edits an existing message instead of posting a new one. */
  editMessageId?: number;
  parseMode?: 'HTML' | 'MarkdownV2';
  disableNotification?: boolean;
};

export type EmailPayload = {
  kind: 'email';
  subject: string;
  text: string;
  to?: string;
};

export type WebhookPayload = {
  kind: 'webhook';
  event: string;
  data: Record<string, unknown>;
};

export type NotificationPayload = TelegramPayload | EmailPayload | WebhookPayload;

export type NotificationChannel = NotificationPayload['kind'];

export interface Notifier<T extends NotificationPayload = NotificationPayload> {
  readonly channel: NotificationChannel;
  /** Throws when delivery fails; the outbox records the error and retries. */
  send(payload: T): Promise<void>;
}
