/**
 * GoPaq Core Logistics Real API Client
 * Connects frontend directly to GoPaq Core Express Backend on /api/v1
 */

const API_BASE = '/api/v1';

export class ApiClient {
  private static getToken(): string | null {
    return localStorage.getItem('gopaq_token');
  }

  private static async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Error de conexión con el servidor GoPaq' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  }

  static async login(email: string, password: string) {
    const data = await this.request<{ success: boolean; token: string; user: any }>('/auth/login', {
      method: 'POST', body: JSON.stringify({ email, password })
    });
    if (data.token) localStorage.setItem('gopaq_token', data.token);
    return data;
  }

  static async register(payload: { name: string; email: string; phone: string; password: string }) {
    const data = await this.request<{ success: boolean; token: string; user: any }>('/auth/register', {
      method: 'POST', body: JSON.stringify(payload)
    });
    if (data.token) localStorage.setItem('gopaq_token', data.token);
    return data;
  }

  static logout() { localStorage.removeItem('gopaq_token'); }
  static hasSession() { return !!this.getToken(); }
  static async getMe() { return this.request<{ success: boolean; user: any }>('/auth/me'); }

  static async getShipments(params?: { status?: string; search?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<{ success: boolean; count: number; shipments: any[] }>(`/shipments?${query}`);
  }
  static async getShipment(id: string) { return this.request<{ success: boolean; shipment: any }>(`/shipments/${id}`); }
  static async createShipment(payload: any) { return this.request<{ success: boolean; shipment: any }>('/shipments', { method: 'POST', body: JSON.stringify(payload) }); }
  static async calculateQuote(payload: any) { return this.request<{ success: boolean; quote: any }>('/quotes', { method: 'POST', body: JSON.stringify(payload) }); }
  static async getTracking(trackingNumber: string) { return this.request<{ success: boolean; shipment: any }>(`/tracking/${trackingNumber}`); }
  static async getRoutes() { return this.request<{ success: boolean; routes: any[] }>('/routes'); }
  static async createRoute(payload: any) { return this.request<{ success: boolean; route: any }>('/routes', { method: 'POST', body: JSON.stringify(payload) }); }
  static async dispatchRoute(routeId: string, driverId?: string) { return this.request<{ success: boolean; message: string }>(`/routes/${routeId}/dispatch`, { method: 'POST', body: JSON.stringify({ driverId }) }); }
  static async getDrivers() { return this.request<{ success: boolean; drivers: any[] }>('/drivers'); }
  static async sendDriverTelemetry(payload: { driverId: string; lat: number; lng: number; speed?: number; heading?: number; battery?: number }) { return this.request<{ success: boolean; processed: any }>('/drivers/telemetry', { method: 'POST', body: JSON.stringify(payload) }); }
  static async getActiveManifest(driverId?: string) { return this.request<{ success: boolean; driver: any; route: any; stops: any[] }>(`/drivers/active-manifest?driverId=${driverId || ''}`); }
  static async getBranches() { return this.request<{ success: boolean; branches: any[] }>('/branches'); }
  static async getBranchInventory(branchId: string) { return this.request<{ success: boolean; count: number; inventory: any[] }>(`/branches/${branchId}/inventory`); }
  static async closeBranchCash(branchId: string, payload: any) { return this.request<{ success: boolean; message: string; summary: any }>(`/branches/${branchId}/cash-close`, { method: 'POST', body: JSON.stringify(payload) }); }
  static async getClients() { return this.request<{ success: boolean; clients: any[] }>('/clients'); }
  static async createClient(payload: any) { return this.request<{ success: boolean; client: any }>('/clients', { method: 'POST', body: JSON.stringify(payload) }); }
  static async getCodLedger() { return this.request<{ success: boolean; summary: any; transactions: any[] }>('/cod/ledger'); }
  static async settleCod(transactionIds: string[], notes?: string) { return this.request<{ success: boolean; message: string; settlementReference: string; settledAt: string }>('/cod/settle', { method: 'POST', body: JSON.stringify({ transactionIds, notes }) }); }
  static async getInternationalLockers() { return this.request<{ success: boolean; lockers: any[] }>('/international/lockers'); }
  static async getInternationalPackages() { return this.request<{ success: boolean; count: number; packages: any[] }>('/international/packages'); }
  static async consolidateInternationalPackages(packageIds: string[], notes?: string) { return this.request<{ success: boolean; message: string; masterTracking: string; packagesConsolidated: number }>('/international/consolidate', { method: 'POST', body: JSON.stringify({ packageIds, notes }) }); }
  static async getMovingOrders() { return this.request<{ success: boolean; orders: any[] }>('/moving/orders'); }
  static async calculateMovingQuote(payload: any) { return this.request<{ success: boolean; quote: any }>('/moving/quote', { method: 'POST', body: JSON.stringify(payload) }); }
  static async getHeavyCargoOrders() { return this.request<{ success: boolean; orders: any[] }>('/heavy-cargo/orders'); }
  static async getApiKeys() { return this.request<{ success: boolean; keys: any[] }>('/api-keys'); }
  static async createApiKey(payload: any) { return this.request<{ success: boolean; message: string; apiKey: any }>('/api-keys', { method: 'POST', body: JSON.stringify(payload) }); }
  static async getWebhooks() { return this.request<{ success: boolean; webhooks: any[] }>('/webhooks'); }
  static async createWebhook(payload: any) { return this.request<{ success: boolean; webhook: any }>('/webhooks', { method: 'POST', body: JSON.stringify(payload) }); }
}
