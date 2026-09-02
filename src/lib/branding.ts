export type PublicBranding = {
  displayName: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string;
  faviconUrl: string;
  version: number;
  updatedAt: string | null;
};

export const DEFAULT_BRANDING: PublicBranding = {
  displayName: 'GoPaq',
  primaryColor: '#4f46e5',
  secondaryColor: '#0f172a',
  logoUrl: '/assets/brand/gopaq-logo-lockup.png',
  faviconUrl: '/assets/brand/gopaq-mascot.png',
  version: 0,
  updatedAt: null
};

let activeBranding = DEFAULT_BRANDING;
const brandingListeners = new Set<(branding: PublicBranding) => void>();

export function getActiveBranding() {
  return activeBranding;
}

export function setActiveBranding(patch: Partial<PublicBranding>) {
  activeBranding = { ...activeBranding, ...patch };
  brandingListeners.forEach((listener) => listener(activeBranding));
  applyBranding(activeBranding);
}

export function subscribeBranding(listener: (branding: PublicBranding) => void) {
  brandingListeners.add(listener);
  return () => brandingListeners.delete(listener);
}

const colorPattern = /^#[0-9a-f]{6}$/i;

export function safeBrandingColor(value: unknown, fallback: string) {
  const normalized = String(value || '').trim();
  return colorPattern.test(normalized) ? normalized : fallback;
}

export function applyBranding(branding: Partial<PublicBranding> | null | undefined) {
  if (typeof document === 'undefined') return;
  const primaryColor = safeBrandingColor(branding?.primaryColor, DEFAULT_BRANDING.primaryColor);
  const secondaryColor = safeBrandingColor(branding?.secondaryColor, DEFAULT_BRANDING.secondaryColor);
  const root = document.documentElement;
  root.style.setProperty('--gopaq-primary', primaryColor);
  root.style.setProperty('--gopaq-primary-hover', primaryColor);
  root.style.setProperty('--gopaq-secondary', secondaryColor);
  root.style.setProperty('--gopaq-primary-soft', `color-mix(in srgb, ${primaryColor} 10%, white)`);
  root.style.setProperty('--gopaq-primary-border', `color-mix(in srgb, ${primaryColor} 28%, white)`);

  const themeMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (themeMeta) themeMeta.content = primaryColor;
  const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (favicon && branding?.faviconUrl) favicon.href = branding.faviconUrl;
  if (branding?.displayName) document.title = `${branding.displayName} | Plataforma Integral de Logística`;
}
