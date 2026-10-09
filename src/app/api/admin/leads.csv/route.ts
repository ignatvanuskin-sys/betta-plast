/**
 * CSV export of leads (§8.7). Owner/manager only, and the data leaves the
 * server exactly as stored — no vendor lock-in, the owner can always take their
 * customer list with them.
 */
import { NextResponse } from 'next/server';

import { getCurrentUser, hasRole } from '@/lib/auth/session';
import { listLeads } from '@/lib/domain/leads';
import { formatDateTimeRu } from '@/lib/domain/time';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const COLUMNS = [
  'id',
  'created_at',
  'segment',
  'kind',
  'form_kind',
  'name',
  'phone',
  'email',
  'organization',
  'district',
  'address',
  'comment',
  'status',
  'source',
  'page_path',
  'consent_version',
] as const;

function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return '';
  const text = String(value).replace(/"/g, '""').replace(/\r?\n/g, ' ');
  return /[",;]/.test(text) ? `"${text}"` : text;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !hasRole(user, 'manager')) {
    return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
  }

  const { rows } = await listLeads({ limit: 200 });
  const lines = [COLUMNS.join(';')];

  for (const lead of rows) {
    lines.push(
      [
        lead.id,
        formatDateTimeRu(lead.createdAt),
        lead.segment,
        lead.kind,
        lead.formKind,
        lead.name,
        lead.phoneNormalized,
        lead.email,
        lead.organization,
        lead.district,
        lead.address,
        lead.comment,
        lead.status,
        lead.source,
        lead.pagePath,
        lead.consentVersion,
      ]
        .map(escapeCsv)
        .join(';'),
    );
  }

  // BOM keeps Cyrillic intact when the file is opened in Excel.
  const body = `\uFEFF${lines.join('\r\n')}`;

  return new NextResponse(body, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="leads-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
