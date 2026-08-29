/**
 * GoPaq -> Witylogix remote bridge.
 * Witylogix is AGPL-3.0 and is intentionally deployed as an independent service.
 * No Witylogix source code is embedded in the proprietary GoPaq core.
 */

type Result<T = any> = { success: true; data: T } | { success: false; error: string; status?: number };

export class WitylogixBridge {
  private static config() {
    return {
      baseUrl: (process.env.WITYLOGIX_SERVICE_URL || '').replace(/\/$/, ''),
      token: process.env.WITYLOGIX_API_TOKEN || '',
      timeout: Number(process.env.WITYLOGIX_TIMEOUT_MS || 8000),
      ordersPath: process.env.WITYLOGIX_ORDERS_PATH || '/api/v4/orders',
      driversPath: process.env.WITYLOGIX_DRIVERS_PATH || '/api/v4/drivers',
      routesPath: process.env.WITYLOGIX_ROUTES_PATH || '/api/v4/routes',
      healthPath: process.env.WITYLOGIX_HEALTH_PATH || '/health'
    };
  }

  static isConfigured() { return !!this.config().baseUrl; }

  private static async request<T>(path: string, init: RequestInit = {}): Promise<Result<T>> {
    const cfg = this.config();
    if (!cfg.baseUrl) return { success: false, error: 'witylogix_service_not_configured' };

    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(init.headers as Record<string, string> || {})
    };
    if (cfg.token) headers.Authorization = `Bearer ${cfg.token}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), cfg.timeout);
    try {
      const response = await fetch(`${cfg.baseUrl}${path}`, { ...init, headers, signal: controller.signal });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) return { success: false, status: response.status, error: data?.message || data?.error || `witylogix_http_${response.status}` };
      return { success: true, data: data as T };
    } catch (error: any) {
      return { success: false, error: error?.name === 'AbortError' ? 'witylogix_timeout' : (error?.message || 'witylogix_unavailable') };
    } finally {
      clearTimeout(timeout);
    }
  }

  static health() { return this.request(this.config().healthPath, { method: 'GET' }); }
  static createDeliveryOrder(order: any) { return this.request(this.config().ordersPath, { method: 'POST', body: JSON.stringify(order) }); }
  static listDrivers() { return this.request(this.config().driversPath, { method: 'GET' }); }
  static createRoute(route: any) { return this.request(this.config().routesPath, { method: 'POST', body: JSON.stringify(route) }); }

  static async dispatchToRemoteService(routeData: any): Promise<{ success: boolean; remoteId?: string; error?: string }> {
    const result = await this.createRoute(routeData);
    if ('error' in result) return { success: false, error: result.error };
    const data: any = result.data;
    return { success: true, remoteId: data?.id || data?.route?.id || data?.data?.id };
  }
}
