/**
 * Karrio Real Multi-Carrier Shipping & Rating Adapter
 * Open Source Carrier Gateway (LGPL-3.0 / Enterprise Components)
 * Reference: https://github.com/karrioapi/karrio
 */

export interface KarrioRateRequest {
  shipper: { country_code: string; postal_code?: string; city?: string };
  recipient: { country_code: string; postal_code?: string; city?: string };
  parcels: Array<{ weight: number; length?: number; width?: number; height?: number }>;
}

export interface KarrioRateResponse {
  carrier: string;
  service: string;
  totalCharge: number;
  currency: string;
  transitDays?: number;
}

export class KarrioAdapter {
  private static getApiConfig() {
    return {
      apiUrl: process.env.KARRIO_API_URL || '',
      apiKey: process.env.KARRIO_API_KEY || ''
    };
  }

  static async fetchLiveCarrierRates(payload: KarrioRateRequest): Promise<{ success: boolean; rates?: KarrioRateResponse[]; error?: string }> {
    const { apiUrl, apiKey } = this.getApiConfig();

    if (!apiUrl || !apiKey) {
      return {
        success: false,
        error: 'provider_unavailable',
      };
    }

    try {
      const response = await fetch(`${apiUrl}/v1/rates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${apiKey}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        return {
          success: false,
          error: `Karrio API respondió con estado HTTP ${response.status}`
        };
      }

      const data = await response.json();
      const rates: KarrioRateResponse[] = (data.rates || []).map((r: any) => ({
        carrier: r.carrier_name,
        service: r.service,
        totalCharge: r.total_charge,
        currency: r.currency || 'USD',
        transitDays: r.transit_days
      }));

      return { success: true, rates };
    } catch (e: any) {
      return {
        success: false,
        error: `Error de red al conectar con Karrio: ${e.message || 'provider_unavailable'}`
      };
    }
  }

  static generateThermalLabel(shipment: { trackingNumber: string; origin: any; destination: any; package: any }) {
    return {
      format: 'PDF_4X6',
      trackingNumber: shipment.trackingNumber,
      barcode: `*${shipment.trackingNumber}*`,
      carrier: 'GOPAQ PRIORITY EXPRESS',
      service: 'STANDARD_GROUND',
      createdDate: new Date().toLocaleDateString('es-DO'),
      weight: `${shipment.package?.weightKg || 1} kg`,
      origin: `${shipment.origin?.city || 'SDQ'}, DO`,
      destination: `${shipment.destination?.name || 'Cliente'} - ${shipment.destination?.city || 'SDQ'}, DO`
    };
  }
}
