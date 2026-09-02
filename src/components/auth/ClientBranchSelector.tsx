import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, LocateFixed, LoaderCircle, MapPin, MapPinned, Navigation } from 'lucide-react';
import { ApiClient } from '../../api/client';
import { loadGoogleMaps } from '../../lib/googleMaps';

declare global {
  interface Window {
    google?: any;
  }
}

export type ClientBranch = {
  id: string;
  code: string;
  name: string;
  city: string;
  address: string;
  phone?: string | null;
  is_hub?: number | boolean | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
};

type Coordinate = { lat: number; lng: number };
type MapState = 'loading' | 'ready' | 'unconfigured' | 'error';

const toCoordinate = (branch: ClientBranch): Coordinate | null => {
  const lat = Number(branch.latitude);
  const lng = Number(branch.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
};

const distanceKm = (from: Coordinate, to: Coordinate) => {
  const earthRadiusKm = 6371;
  const latDelta = (to.lat - from.lat) * Math.PI / 180;
  const lngDelta = (to.lng - from.lng) * Math.PI / 180;
  const a = Math.sin(latDelta / 2) ** 2 + Math.cos(from.lat * Math.PI / 180) * Math.cos(to.lat * Math.PI / 180) * Math.sin(lngDelta / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const ClientBranchSelector: React.FC<{ selectedBranchId: string; onSelect: (branch: ClientBranch) => void }> = ({ selectedBranchId, onSelect }) => {
  const mapNode = useRef<HTMLDivElement>(null);
  const [branches, setBranches] = useState<ClientBranch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mapState, setMapState] = useState<MapState>('loading');
  const [mapMessage, setMapMessage] = useState('Cargando mapa…');
  const [userLocation, setUserLocation] = useState<Coordinate | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationMessage, setLocationMessage] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      const [branchResult, mapResult] = await Promise.all([ApiClient.getPublicBranches(), ApiClient.getPublicMapConfiguration()]);
      if (!active) return;
      if (branchResult.success) setBranches((branchResult.branches || []) as ClientBranch[]);
      else setError(branchResult.error || 'No fue posible cargar las sucursales.');

      if (!mapResult.success || !mapResult.configured || !mapResult.apiKey) {
        setMapState('unconfigured');
        setMapMessage('El mapa todavía no está configurado por GoPaq.');
      } else {
        try {
          await loadGoogleMaps(mapResult.apiKey);
          if (active) setMapState('ready');
        } catch {
          if (active) {
            setMapState('error');
            setMapMessage('Google Maps no está disponible en este momento.');
          }
        }
      }
      if (active) setLoading(false);
    };
    void load();
    return () => { active = false; };
  }, []);

  const branchesWithCoordinates = useMemo(() => branches.map((branch) => ({ branch, coordinate: toCoordinate(branch) })).filter((item): item is { branch: ClientBranch; coordinate: Coordinate } => !!item.coordinate), [branches]);
  const orderedBranches = useMemo(() => [...branches].sort((a, b) => {
    if (!userLocation) return 0;
    const aCoordinate = toCoordinate(a);
    const bCoordinate = toCoordinate(b);
    if (!aCoordinate && !bCoordinate) return 0;
    if (!aCoordinate) return 1;
    if (!bCoordinate) return -1;
    return distanceKm(userLocation, aCoordinate) - distanceKm(userLocation, bCoordinate);
  }), [branches, userLocation]);

  useEffect(() => {
    if (mapState !== 'ready' || !mapNode.current || !branchesWithCoordinates.length || !window.google?.maps) return;
    const firstCoordinate = branchesWithCoordinates[0].coordinate;
    const center = userLocation || firstCoordinate;
    const map = new window.google.maps.Map(mapNode.current, {
      center,
      zoom: userLocation ? 11 : 12,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      clickableIcons: false
    });
    const markers = branchesWithCoordinates.map(({ branch, coordinate }) => {
      const marker = new window.google.maps.Marker({ map, position: coordinate, title: branch.name, label: selectedBranchId === branch.id ? '✓' : undefined });
      marker.addListener('click', () => onSelect(branch));
      return marker;
    });
    if (userLocation) new window.google.maps.Marker({ map, position: userLocation, title: 'Tu ubicación' });
    return () => markers.forEach((marker: any) => marker.setMap(null));
  }, [branchesWithCoordinates, mapState, onSelect, selectedBranchId, userLocation]);

  const locateNearest = () => {
    if (!navigator.geolocation) {
      setLocationMessage('Este dispositivo no ofrece ubicación. Selecciona la sucursal manualmente.');
      return;
    }
    setLocating(true);
    setLocationMessage('Solicitando permiso de ubicación…');
    navigator.geolocation.getCurrentPosition((position) => {
      const current = { lat: position.coords.latitude, lng: position.coords.longitude };
      setUserLocation(current);
      const nearest = branchesWithCoordinates.reduce<{ branch: ClientBranch; distance: number } | null>((best, item) => {
        const distance = distanceKm(current, item.coordinate);
        return !best || distance < best.distance ? { branch: item.branch, distance } : best;
      }, null);
      if (nearest) {
        onSelect(nearest.branch);
        setLocationMessage(`Sucursal más cercana seleccionada: ${nearest.branch.name} · ${nearest.distance.toFixed(1)} km.`);
      } else {
        setLocationMessage('No hay sucursales con coordenadas verificadas para calcular cercanía.');
      }
      setLocating(false);
    }, (positionError) => {
      const message = positionError.code === positionError.PERMISSION_DENIED
        ? 'Permiso de ubicación rechazado. Selecciona la sucursal manualmente.'
        : 'No fue posible obtener tu ubicación. Selecciona la sucursal manualmente.';
      setLocationMessage(message);
      setLocating(false);
    }, { enableHighAccuracy: true, maximumAge: 300000, timeout: 10000 });
  };

  return <section className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5" aria-labelledby="client-branch-title">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-indigo-700"><MapPinned className="h-4 w-4" /><span className="text-[10px] font-black uppercase tracking-[0.18em]">Sucursal de atención</span></div>
        <h2 id="client-branch-title" className="mt-1 text-base font-black text-slate-900">Elige la sucursal más cercana</h2>
        <p className="mt-1 text-xs leading-5 text-slate-500">Cada cuenta de cliente queda vinculada a una sucursal. Puedes permitir la ubicación del dispositivo para ordenar las sucursales por distancia.</p>
      </div>
      <button type="button" onClick={locateNearest} disabled={locating || loading || !branchesWithCoordinates.length} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-white px-3 py-2 text-xs font-black text-indigo-700 transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50"><LocateFixed className="h-4 w-4" />{locating ? 'Buscando…' : 'Usar mi ubicación'}</button>
    </div>
    {locationMessage && <p role="status" className="mt-3 flex items-start gap-2 rounded-xl border border-indigo-100 bg-white p-3 text-[11px] leading-5 text-indigo-800"><Navigation className="mt-0.5 h-3.5 w-3.5 shrink-0" />{locationMessage}</p>}
    {error && <p role="alert" className="mt-3 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</p>}
    {loading ? <p className="mt-4 flex items-center gap-2 text-xs text-slate-500"><LoaderCircle className="h-4 w-4 animate-spin" />Cargando sucursales reales…</p> : !branches.length ? <p className="mt-4 text-xs text-slate-500">No hay sucursales activas disponibles para el registro.</p> : <div className="mt-4 grid gap-4 lg:grid-cols-[1.05fr_.95fr]">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {mapState === 'ready' && branchesWithCoordinates.length ? <div ref={mapNode} className="h-64 w-full sm:h-72" aria-label="Mapa real de sucursales GoPaq" /> : <div className="flex h-64 flex-col items-center justify-center px-6 text-center sm:h-72"><MapPin className="h-8 w-8 text-slate-300" /><p className="mt-3 text-sm font-black text-slate-700">{mapMessage}</p><p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">{mapState === 'unconfigured' ? 'La lista de sucursales permanece disponible mientras un administrador configura la clave restringida en Super Admin.' : !branchesWithCoordinates.length ? 'La sucursal necesita coordenadas verificadas para aparecer en el mapa.' : 'Puedes continuar seleccionando una sucursal real de la lista.'}</p></div>}
      </div>
      <div className="min-w-0">
        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Sucursales disponibles</p>
        <div className="max-h-72 space-y-2 overflow-y-auto pr-1" role="radiogroup" aria-label="Seleccionar sucursal de cliente">
          {orderedBranches.map((branch) => {
            const coordinate = toCoordinate(branch);
            const distance = userLocation && coordinate ? distanceKm(userLocation, coordinate) : null;
            const selected = selectedBranchId === branch.id;
            return <button key={branch.id} type="button" role="radio" aria-checked={selected} onClick={() => onSelect(branch)} className={`w-full rounded-xl border p-3 text-left transition ${selected ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500/10' : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/40'}`}><span className="flex items-start gap-3"><span className={`mt-0.5 rounded-lg p-2 ${selected ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600'}`}><MapPin className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="flex flex-wrap items-center justify-between gap-2"><span className="text-sm font-black text-slate-900">{branch.name}</span>{selected && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />}</span><span className="mt-1 block text-[11px] text-slate-500">{branch.address} · {branch.city}</span><span className="mt-1 flex flex-wrap gap-x-2 text-[10px] font-bold text-slate-400"><span>{branch.code}</span>{distance !== null && <span className="text-indigo-600">{distance.toFixed(1)} km</span>}{!coordinate && <span>Ubicación pendiente</span>}</span></span></span></button>;
          })}
        </div>
      </div>
    </div>}
    {!selectedBranchId && !loading && branches.length > 0 && <p className="mt-3 text-xs font-bold text-amber-700">Selecciona una sucursal para continuar con el registro.</p>}
  </section>;
};
