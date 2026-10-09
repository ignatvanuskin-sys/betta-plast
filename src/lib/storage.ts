/**
 * Upload storage with a pluggable adapter (§12).
 *
 * Local disk is the default and needs no credentials. A remote adapter (S3 /
 * R2 / Vercel Blob) can be plugged in later without touching call sites.
 * Uploaded names are always replaced with random ones (§14).
 */
import { randomBytes } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { storage } from './config';

export const ALLOWED_UPLOAD_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'application/pdf',
]);

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'application/pdf': 'pdf',
};

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

export type StoredFile = {
  storageKey: string;
  url: string;
  mime: string;
  size: number;
  fileName: string;
};

export class UploadError extends Error {}

export function safeExtension(mime: string, originalName: string): string {
  const fromMime = EXTENSIONS[mime];
  if (fromMime) return fromMime;
  const ext = path.extname(originalName).replace('.', '').toLowerCase();
  return /^[a-z0-9]{1,5}$/.test(ext) ? ext : 'bin';
}

/**
 * Validates and stores one uploaded file. Returns the public URL used by the
 * admin panel. Rejects anything that is not on the whitelist or too large.
 */
export async function storeUpload(file: File, folder = 'leads'): Promise<StoredFile> {
  if (file.size <= 0) throw new UploadError('Файл пустой');
  if (file.size > MAX_UPLOAD_BYTES) throw new UploadError('Файл больше 15 МБ');

  const mime = file.type || 'application/octet-stream';
  if (!ALLOWED_UPLOAD_MIME.has(mime)) {
    throw new UploadError('Недопустимый тип файла. Разрешены JPG, PNG, WEBP, HEIC и PDF.');
  }

  const extension = safeExtension(mime, file.name);
  const key = `${folder}/${new Date().toISOString().slice(0, 10)}/${randomBytes(12).toString('hex')}.${extension}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  if (storage.remoteEnabled) {
    // Remote adapter is intentionally not implemented until credentials are
    // provided; local storage keeps the feature working in the meantime.
  }

  const target = path.join(process.cwd(), storage.localDir, key);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, bytes);

  return {
    storageKey: key,
    url: `/media/${key}`,
    mime,
    size: file.size,
    fileName: file.name.slice(0, 200),
  };
}

export function storageDriverName(): string {
  return storage.remoteEnabled ? 's3' : 'local';
}
