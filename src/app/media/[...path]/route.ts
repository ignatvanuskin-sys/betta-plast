/**
 * Serves locally stored uploads (lead photos, gallery images) when no remote
 * storage adapter is configured. Path traversal is impossible: every segment is
 * validated and the resolved path must stay inside the storage root.
 */
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';

import { NextResponse, type NextRequest } from 'next/server';

import { storage } from '@/lib/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
  pdf: 'application/pdf',
};

export async function GET(_request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await context.params;

  if (!segments || segments.length === 0 || segments.some((segment) => !/^[A-Za-z0-9._-]+$/.test(segment))) {
    return new NextResponse('Not found', { status: 404 });
  }

  const root = path.resolve(process.cwd(), storage.localDir);
  const target = path.resolve(root, ...segments);
  if (!target.startsWith(root + path.sep)) {
    return new NextResponse('Not found', { status: 404 });
  }

  try {
    const info = await stat(target);
    if (!info.isFile()) return new NextResponse('Not found', { status: 404 });

    const extension = path.extname(target).slice(1).toLowerCase();
    const stream = Readable.toWeb(createReadStream(target)) as ReadableStream;

    return new NextResponse(stream, {
      headers: {
        'content-type': MIME[extension] ?? 'application/octet-stream',
        'content-length': String(info.size),
        'cache-control': 'private, max-age=3600',
        'x-content-type-options': 'nosniff',
      },
    });
  } catch {
    return new NextResponse('Not found', { status: 404 });
  }
}
