/**
 * GoPaq Proprietary Routing & Last-Mile Dispatch Engine
 * Clean-room proprietary spatial optimization and stop sequencing for GoPaq
 */

export interface RouteStopInput {
  id: string;
  address: string;
  lat: number;
  lng: number;
  type: 'pickup' | 'delivery';
  contact: { name: string; phone?: string };
  shipmentTracking: string;
}

export interface OptimizedRouteResult {
  orderedStops: RouteStopInput[];
  estimatedDistanceKm: number;
  estimatedDurationMin: number;
}

export class GoPaqRoutingEngine {
  static optimizeStops(stops: RouteStopInput[]): OptimizedRouteResult {
    if (stops.length <= 1) {
      return { orderedStops: stops, estimatedDistanceKm: 3.5, estimatedDurationMin: 20 };
    }

    const unvisited = [...stops];
    const ordered: RouteStopInput[] = [];
    let current = unvisited.shift()!;
    ordered.push(current);

    let totalDist = 0;
    while (unvisited.length > 0) {
      let nearestIdx = 0;
      let minDistance = Infinity;

      for (let i = 0; i < unvisited.length; i++) {
        const candidate = unvisited[i];
        const dist = Math.hypot(candidate.lat - current.lat, candidate.lng - current.lng);
        if (dist < minDistance) {
          minDistance = dist;
          nearestIdx = i;
        }
      }

      current = unvisited.splice(nearestIdx, 1)[0];
      ordered.push(current);
      totalDist += (minDistance * 111);
    }

    const estimatedDistanceKm = Math.round(Math.max(4.0, totalDist) * 10) / 10;
    const estimatedDurationMin = Math.round(ordered.length * 15 + (estimatedDistanceKm * 2.2));

    return {
      orderedStops: ordered,
      estimatedDistanceKm,
      estimatedDurationMin
    };
  }

  static verifyPodSubmission(signatureDataUrl: string, photoUrl?: string) {
    const hasValidSignature = signatureDataUrl && signatureDataUrl.startsWith('data:image');
    return {
      valid: !!hasValidSignature,
      hasPhoto: !!photoUrl,
      timestamp: new Date().toISOString()
    };
  }
}
