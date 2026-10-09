/**
 * Single entry point for every website form (§8.1).
 *
 * Order is deliberate: validate → anti-spam → persist → notify.
 * The response never depends on Telegram being reachable.
 */
import { NextResponse, type NextRequest } from 'next/server';

import { attachFiles, createLead, LeadError } from '@/lib/domain/leads';
import { requestMeasurement } from '@/lib/domain/slots';
import { leadSubmissionSchema, zodFieldErrors } from '@/lib/domain/validation';
import { processOutbox } from '@/lib/notify/outbox';
import { storeUpload, UploadError } from '@/lib/storage';
import { trackEvent } from '@/lib/domain/leads';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() ?? 'unknown';
  return request.headers.get('x-real-ip') ?? 'unknown';
}

export async function POST(request: NextRequest) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, message: 'Некорректный запрос' }, { status: 400 });
  }

  const rawPayload = form.get('payload');
  if (typeof rawPayload !== 'string') {
    return NextResponse.json({ ok: false, message: 'Некорректный запрос' }, { status: 400 });
  }

  let parsedJson: Record<string, unknown>;
  try {
    parsedJson = JSON.parse(rawPayload) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, message: 'Некорректный запрос' }, { status: 400 });
  }

  const utmRaw = form.get('utm');
  let utm: Record<string, string> | undefined;
  if (typeof utmRaw === 'string' && utmRaw) {
    try {
      const value = JSON.parse(utmRaw) as Record<string, string>;
      if (value && typeof value === 'object') utm = value;
    } catch {
      utm = undefined;
    }
  }

  const candidate = {
    ...parsedJson,
    submissionId: form.get('submissionId') ?? parsedJson.submissionId,
    src: form.get('src') ?? parsedJson.src ?? undefined,
    utm,
    referrer: form.get('referrer') ?? parsedJson.referrer ?? undefined,
    landingPath: form.get('landingPath') ?? parsedJson.landingPath ?? undefined,
    pagePath: form.get('pagePath') ?? parsedJson.pagePath ?? undefined,
    device: form.get('device') ?? parsedJson.device ?? undefined,
    sessionId: form.get('sessionId') ?? parsedJson.sessionId ?? undefined,
  };

  const parsed = leadSubmissionSchema.safeParse(candidate);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, errors: zodFieldErrors(parsed.error), message: 'Проверьте отмеченные поля' },
      { status: 422 },
    );
  }

  // Honeypot: silently pretend success so bots do not adapt.
  if (parsed.data.honeypot) {
    return NextResponse.json({ ok: true, id: 0, repeated: false });
  }

  let result;
  try {
    result = await createLead(parsed.data, {
      ip: clientIp(request),
      userAgent: request.headers.get('user-agent') ?? undefined,
      channel: 'form',
    });
  } catch (error) {
    if (error instanceof LeadError) {
      const status = error.code === 'rate_limited' ? 429 : 400;
      return NextResponse.json({ ok: false, message: error.message, errors: {} }, { status });
    }
    console.error('[leads] create failed', error);
    return NextResponse.json(
      { ok: false, message: 'Не удалось создать заявку. Попробуйте ещё раз или позвоните нам.', errors: {} },
      { status: 500 },
    );
  }

  // Attachments are stored only for a genuinely new lead.
  if (result.created) {
    const files = form.getAll('files').filter((entry): entry is File => entry instanceof File && entry.size > 0).slice(0, 3);
    if (files.length > 0) {
      try {
        const stored = [];
        for (const file of files) stored.push(await storeUpload(file, `leads/${result.lead.id}`));
        await attachFiles(result.lead.id, stored);
      } catch (error) {
        // A failed attachment must not lose the lead itself.
        console.error('[leads] upload failed', error instanceof UploadError ? error.message : error);
      }
    }

    try {
      await trackEvent({
        name: parsed.data.formKind === 'repair' ? 'repair_request' : 'lead_submit',
        leadId: result.lead.id,
        sessionId: parsed.data.sessionId ?? null,
        path: parsed.data.pagePath ?? null,
        props: { kind: parsed.data.kind, source: result.lead.source },
      });
    } catch (error) {
      console.error('[leads] event failed', error);
    }
  }

  // A measurement request is turned into a `pending` booking straight away so
  // the customer's chosen slot is held while a manager confirms it (§8.3).
  if (result.created && parsed.data.formKind === 'measure') {
    const requested = (parsed.data.calcPayload as { requestedSlot?: unknown } | undefined)?.requestedSlot;
    if (typeof requested === 'string') {
      try {
        await requestMeasurement({
          leadId: result.lead.id,
          startsAt: new Date(requested),
          address: parsed.data.address ?? '',
          district: parsed.data.district ?? null,
          notes: 'Заявка с сайта, ожидает подтверждения менеджера',
          actor: parsed.data.name,
        });
      } catch (error) {
        // The lead is already saved; a taken slot must not lose it.
        console.error('[leads] measurement booking failed', error instanceof Error ? error.message : error);
      }
    }
  }

  // Deliver immediately so the card lands within the 5-second budget; failures
  // stay in the outbox and are retried by cron.
  try {
    await processOutbox(5);
  } catch (error) {
    console.error('[leads] outbox flush failed', error);
  }

  return NextResponse.json({ ok: true, id: result.lead.id, repeated: result.repeated });
}
