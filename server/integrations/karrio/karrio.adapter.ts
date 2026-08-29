/**
 * Karrio self-hosted multi-carrier adapter (LGPL-3.0 core).
 * Official Shipping API uses POST /v1/shipments to create a shipment and obtain rates,
 * then POST /v1/shipments/:id/purchase to buy the selected label.
 */

export interface KarrioRateRequest {
  shipper: { country_code: string; postal_code?: string; city?: string; address_line1?: string; person_name?: string; phone_number?: string; email?: string };
  recipient: { country_code: string; postal_code?: string; city?: string; address_line1?: string; person_name?: string; phone_number?: string; email?: string };
  parcels: Array<{ weight: number; weight_unit?: string; length?: number; width?: number; height?: number; dimension_unit?: string }>;
  reference?: string;
  options?: Record<string, any>;
}

export interface KarrioRateResponse {
  id?: string;
  carrier: string;
  service: string;
  totalCharge: number;
  currency: string;
  transitDays?: number;
}

type KarrioResult<T> = { success: true; data: T } | { success: false; error: string; status?: number };

export class KarrioAdapter {
  private static config() {
    return {
      apiUrl: (process.env.KARRIO_API_URL || '').replace(/\/$/, ''),
      apiKey: process.env.KARRIO_API_KEY || '',
      timeout: Number(process.env.KARRIO_TIMEOUT_MS || 12000)
    };
  }

  static isConfigured() {
    const { apiUrl, apiKey } = this.config();
    return !!apiUrl && !!apiKey;
  }

  private static async request<T>(path: string, init: RequestInit = {}): Promise<KarrioResult<T>> {
    const { apiUrl, apiKey, timeout } = this.config();
    if (!apiUrl || !apiKey) return { success: false, error: 'provider_unavailable' };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(`${apiUrl}${path}`, {
        ...init,
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Token ${apiKey}`,
          ...(init.headers as Record<string, string> || {})
        }
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) return { success: false, status: response.status, error: data?.message || data?.error || `karrio_http_${response.status}` };
      return { success: true, data: data as T };
    } catch (error: any) {
      return { success: false, error: error?.name === 'AbortError' ? 'karrio_timeout' : (error?.message || 'provider_unavailable') };
    } finally {
      clearTimeout(timer);
    }
  }

  static async health(): Promise<{ success: boolean; error?: string }> {
    const { apiUrl } = this.config();
    if (!apiUrl) return { success: false, error: 'provider_unavailable' };
    try {
      const response = await fetch(`${apiUrl}/`, { signal: AbortSignal.timeout(5000) });
      return response.ok ? { success: true } : { success: false, error: `karrio_http_${response.status}` };
    } catch (error: any) {
      return { success: false, error: error?.message || 'provider_unavailable' };
    }
  }

  static async createShipment(payload: KarrioRateRequest): Promise<KarrioResult<any>> {
    return this.request('/v1/shipments', { method: 'POST', body: JSON.stringify(payload) });
  }

  static async fetchLiveCarrierRates(payload: KarrioRateRequest): Promise<{ success: boolean; shipmentId?: string; rates?: KarrioRateResponse[]; error?: string }> {
    const result = await this.createShipment(payload);
    if ('error' in result) return { success: false, error: result.error };
    const shipment: any = result.data;
    const rates: KarrioRateResponse[] = (shipment.rates || []).map((rate: any) => ({
      id: rate.id,
      carrier: rate.carrier_name || rate.carrier_id || rate.carrier || 'unknown',
      service: rate.service || rate.service_name || 'standard',
      totalCharge: Number(rate.total_charge ?? rate.total ?? 0),
      currency: rate.currency || 'USD',
      transitDays: rate.transit_days ?? rate.transit_time
    }));
    return { success: true, shipmentId: shipment.id, rates };
  }

  static async purchaseLabel(shipmentId: string, selectedRateId: string, labelType: 'PDF' | 'ZPL' | 'PNG' = 'PDF'): Promise<KarrioResult<any>> {
    return this.request(`/v1/shipments/${encodeURIComponent(shipmentId)}/purchase`, {
      method: 'POST',
      body: JSON.stringify({ selected_rate_id: selectedRateId, label_type: labelType })
    });
  }
}
