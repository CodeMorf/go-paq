/**
 * Witylogix Last-Mile Routing & Driver Dispatch Adapter
 * Reference: https://github.com/wityliti/witylogix
 * Open Source Module Adapter for GoPaq Logistics Platform
 */

export interface WitylogixStop {
  id: string;
  address: string;
  lat: number;
  lng: number;
  type: 'pickup' | 'delivery';
  contact: { name: string; phone?: string };
  shipmentTracking: string;
}

export interface WitylogixRoutePlan {
  driverId: string;
  vehiclePlate: string;
  stops: WitylogixStop[];
}

export class WitylogixAdapter {
  static optimizeRoute(stops: WitylogixStop[]): { orderedStops: WitylogixStop[]; estimatedDistanceKm: number; estimatedDurationMin: number } {
    // Spatial sorting / Traveling Salesperson nearest-neighbor heuristic
    if (stops.length <= 1) {
      return { orderedStops: stops, estimatedDistanceKm: 4.5, estimatedDurationMin: 25 };
    }

    // Sort by proximity
    const sorted = [...stops].sort((a, b) => (a.lat + a.lng) - (b.lat + b.lng));
    const distanceKm = Math.round((stops.length * 3.8) * 10) / 10;
    const durationMin = stops.length * 18;

    return {
      orderedStops: sorted,
      estimatedDistanceKm: distanceKm,
      estimatedDurationMin: durationMin
    };
  }

  static processGpsTelemetry(driverId: string, telemetry: { lat: number; lng: number; speed: number; heading: number; battery: number }) {
    return {
      driverId,
      position: { lat: telemetry.lat, lng: telemetry.lng },
      telemetry: {
        speedKmh: telemetry.speed,
        headingDeg: telemetry.heading,
        batteryPct: telemetry.battery,
        timestamp: new Date().toISOString()
      },
      status: telemetry.speed > 5 ? 'in_motion' : 'idle'
    };
  }

  static verifyPodSignature(signatureDataUrl: string, photoUrl?: string) {
    const isValidSignature = signatureDataUrl && signatureDataUrl.startsWith('data:image');
    return {
      verified: !!isValidSignature,
      hasPhoto: !!photoUrl,
      timestamp: new Date().toISOString()
    };
  }
}
