/**
 * Witylogix remote integration bridge.
 *
 * Witylogix is AGPL-3.0. GoPaq does not embed or copy Witylogix source code.
 * This bridge talks to an independently deployed Witylogix service over HTTP.
 * The exact Witylogix route paths are configurable because deployments may expose
 * the API behind a gateway or versioned prefix.
 */

type WitylogixResult<T = any> = { success: true; data: T } | { success: false; error: string; status?: number };

export class WitylogixBridge {
  private static config() {
    const baseUrl = (process.env.WITYLOGIX_SERVICE_URL || '').replace(/\/$/, '');
    return {
      baseUrl,
      token: process.env.WITYLOGIX_API_TOKEN || '',
      ordersPath: process.env.WITYLOGIX_ORDERS_PATH || '/api/orders',
      driversPath: process.env.WITYLOGIX_DRIVERS_PATH || '/api/drivers',
      routesPath: process.env.WITYLOGIX_ROUTES_PATH || '/api/routes',
      healthPath: process.env.WITYLOGIX_HEALTH_PATH || '/health'
    };
  }

  static isConfigured(): boolean {
    return !!this.config().baseUrl;
  }

  private static async request<T>(path: string, init: RequestInit = {}): Promise<WitylogixResult<T>> {
    const { baseUrl, token } = this.config();
    if (!baseUrl) return { success: false, error: 'witylogix_service_not_configured' };

    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(init.headers as Record<string, string> || {})
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), Number(process.env.WITYLOGIX_TIMEOUT_MS || 8000));
      const response = await fetch(`${baseUrl}${path}`, { ...init, headers, signal: controller.signal });
      clearTimeout(timeout);

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        return {
          success: false,
          status: response.status,
          error: payload?.message || payload?.error || `witylogix_http_${response.status}`
        };
      }
      return { success: true, data: payload as T };
    } catch (error: any) {
      return { success: false, error: error?.name === 'AbortError' ? 'witylogix_timeout' : (error?.message || 'witylogix_unavailable') };
    }
  }

  static health() {
    return this.request(this.config().healthPath, { method: 'GET' });
  }

  static createDeliveryOrder(order: any) {
    return this.request(this.config().ordersPath, { method: 'POST', body: JSON.stringify(order) });
  }

  static listDrivers() {
    return this.request(this.config().driversPath, { method: 'GET' });
  }

  static createRoute(route: any) {
    return this.request(this.config().routesPath, { method: 'POST', body: JSON.stringify(route) });
  }

  static dispatchToRemoteService(routeData: any): Promise<WitylogixResult<any>> {
    return this.createRoute(routeData);
  }
}
