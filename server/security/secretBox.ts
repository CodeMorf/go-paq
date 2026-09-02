import crypto from 'crypto';

function key() {
  const value = process.env.WEBHOOK_ENCRYPTION_KEY || '';
  if (!/^[0-9a-fA-F]{64}$/.test(value)) throw new Error('WEBHOOK_ENCRYPTION_KEY debe ser una clave hexadecimal de 32 bytes.');
  return Buffer.from(value, 'hex');
}

export function encryptSecret(secret: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const ciphertext = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
  return `enc:v1:${iv.toString('hex')}:${cipher.getAuthTag().toString('hex')}:${ciphertext.toString('hex')}`;
}

export function decryptSecret(value: string) {
  if (!value.startsWith('enc:v1:')) {
    if (process.env.NODE_ENV === 'production') throw new Error('Secreto de webhook legado no permitido en producción.');
    return value;
  }
  const [, version, ivHex, tagHex, ciphertextHex] = value.split(':');
  if (version !== 'v1' || !ivHex || !tagHex || !ciphertextHex) throw new Error('Secreto cifrado inválido.');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key(), Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  return Buffer.concat([decipher.update(Buffer.from(ciphertextHex, 'hex')), decipher.final()]).toString('utf8');
}
