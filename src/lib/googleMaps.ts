declare global {
  interface Window {
    google?: any;
  }
}

let googleMapsLoader: Promise<void> | null = null;

export function loadGoogleMaps(apiKey: string) {
  if (typeof window === 'undefined') return Promise.reject(new Error('Google Maps requiere un navegador.'));
  if (window.google?.maps) return Promise.resolve();
  if (googleMapsLoader) return googleMapsLoader;
  googleMapsLoader = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-gopaq-google-maps="true"]');
    const script = existing || document.createElement('script');
    const loaded = () => window.google?.maps ? resolve() : reject(new Error('Google Maps no devolvió la librería de mapas.'));
    const failed = () => reject(new Error('No fue posible cargar Google Maps.'));
    script.addEventListener('load', loaded, { once: true });
    script.addEventListener('error', failed, { once: true });
    if (!existing) {
      script.dataset.gopaqGoogleMaps = 'true';
      script.async = true;
      script.defer = true;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places`;
      document.head.appendChild(script);
    }
  }).catch((error) => {
    googleMapsLoader = null;
    throw error;
  });
  return googleMapsLoader;
}

export async function geocodeAddress(address: string, apiKey: string) {
  await loadGoogleMaps(apiKey);
  if (!window.google?.maps?.Geocoder) throw new Error('Google Maps no ofrece geocodificación en este momento.');
  const response = await new Promise<any>((resolve, reject) => {
    new window.google.maps.Geocoder().geocode({ address, region: 'DO' }, (results: any[], status: string) => {
      if (status !== 'OK' || !results?.length) return reject(new Error('No se encontró una dirección verificable.'));
      resolve(results[0]);
    });
  });
  const location = response.geometry?.location;
  if (!location || typeof location.lat !== 'function' || typeof location.lng !== 'function') throw new Error('La dirección no devolvió coordenadas verificables.');
  return {
    latitude: Number(location.lat()),
    longitude: Number(location.lng()),
    formattedAddress: String(response.formatted_address || address)
  };
}
