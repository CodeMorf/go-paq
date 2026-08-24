export const API_VERSION = "2026-01";

export function parseApiAuthorization(header: string | undefined) {
  if (!header?.startsWith("Bearer gpq_")) return null;
  const token = header.slice("Bearer ".length).trim();
  return token.length >= 16 ? token : null;
}

export function hasApiScope(scopesJson: string, required: string) {
  try {
    const scopes = JSON.parse(scopesJson) as unknown;
    return Array.isArray(scopes) && scopes.includes(required);
  } catch {
    return false;
  }
}

export function isSupportedApiVersion(version: string | undefined) {
  return !version || version === API_VERSION;
}
