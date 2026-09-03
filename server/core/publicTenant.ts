export function getPublicOrganizationId(): string {
  const configured = String(process.env.GOPAQ_PUBLIC_ORG_ID || '').trim();
  if (configured) return configured;
  if (process.env.NODE_ENV === 'production') {
    throw Object.assign(new Error('GOPAQ_PUBLIC_ORG_ID no está configurado.'), { statusCode: 503 });
  }
  return 'org-gopaq';
}
