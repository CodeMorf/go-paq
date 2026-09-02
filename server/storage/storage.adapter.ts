import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

const defaultRoot = path.resolve(process.cwd(), 'server', 'storage-data');

function storageRoot() {
  return path.resolve(process.env.STORAGE_LOCAL_DIR || defaultRoot);
}

/**
 * Stores browser-uploaded evidence on a persistent object-storage-compatible
 * volume. PostgreSQL receives only the opaque storage key, never a large blob.
 * External S3/MinIO implementations can replace this adapter without changing
 * the shipment or driver domains.
 */
export type StorageCategory = 'signatures' | 'pod-photos' | 'branding';

export async function storeDataUrl(value: string | undefined, category: StorageCategory, maxBytes: number): Promise<string | undefined> {
  if (!value) return undefined;
  if (value.startsWith('storage://')) return value;
  const match = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=\r\n]+)$/.exec(value);
  if (!match) throw Object.assign(new Error('El archivo de evidencia debe ser una imagen válida.'), { statusCode: 422 });
  const [, mime, encoded] = match;
  const buffer = Buffer.from(encoded.replace(/\s/g, ''), 'base64');
  if (!buffer.length || buffer.length > maxBytes) throw Object.assign(new Error('El archivo de evidencia excede el límite permitido.'), { statusCode: 422 });
  const extension = mime === 'image/jpeg' ? 'jpg' : mime.split('/')[1];
  const filename = `${crypto.randomUUID()}.${extension}`;
  const relative = path.join(category, filename);
  const absolute = path.join(storageRoot(), relative);
  await fs.mkdir(path.dirname(absolute), { recursive: true });
  await fs.writeFile(absolute, buffer, { mode: 0o600 });
  return `storage://${relative.replaceAll(path.sep, '/')}`;
}

export async function readStoredFile(value: string | undefined): Promise<{ buffer: Buffer; mimeType: string } | null> {
  if (!value?.startsWith('storage://')) return null;
  const relative = value.slice('storage://'.length).replaceAll('/', path.sep);
  if (!relative || relative.includes('..') || path.isAbsolute(relative)) return null;
  const absolute = path.resolve(storageRoot(), relative);
  const root = path.resolve(storageRoot());
  if (absolute !== root && !absolute.startsWith(`${root}${path.sep}`)) return null;
  try {
    const buffer = await fs.readFile(absolute);
    const extension = path.extname(absolute).toLowerCase();
    const mimeType = extension === '.jpg' || extension === '.jpeg' ? 'image/jpeg' : extension === '.webp' ? 'image/webp' : 'image/png';
    return { buffer, mimeType };
  } catch {
    return null;
  }
}
