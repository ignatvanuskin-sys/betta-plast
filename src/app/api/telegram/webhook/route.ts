/**
 * Telegram webhook (§8.4). Authenticated with the secret token Telegram sends
 * in `X-Telegram-Bot-Api-Secret-Token`. Always answers 200 so Telegram does not
 * retry a malformed update forever.
 */
import { NextResponse, type NextRequest } from 'next/server';

import { telegram } from '@/lib/config';
import { handleUpdate } from '@/lib/telegram/handlers';
import type { TelegramUpdate } from '@/lib/notify/telegram';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-telegram-bot-api-secret-token');
  if (!telegram.webhookSecret || secret !== telegram.webhookSecret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let update: TelegramUpdate;
  try {
    update = (await request.json()) as TelegramUpdate;
  } catch {
    return NextResponse.json({ ok: true });
  }

  try {
    await handleUpdate(update);
  } catch (error) {
    console.error('[telegram] handler failed', error);
  }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ ok: true, configured: telegram.enabled });
}
