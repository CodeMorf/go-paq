/**
 * GoPaq Core Logistics Real API Client
 * Connects frontend directly to GoPaq Core Express Backend on /api/v1
 */

const API_BASE = '/api/v1';

export type ApiResponse<T = Record<string, any>> =
  | ({ success: true; error?: never } & T)
  | ({ success: false; error: string } & Partial<T>);

export class ApiClient {
  private static getToken(): string | null {
    return typeof localStorage !== 'undefined' ? localStorage.getItem('gopaq_token') : null;
  }

  private static async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) headers.Authorization = `Bearer ${token}`;

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
      const data = await res.json().catch(() => ({ success: false, error: `HTTP ${res.status}` }));
      if (!res.ok) return { success: false, error: data.error || `HTTP ${res.status}` } as ApiResponse<T>;
      return data as ApiResponse<T>;
    } catch (err: any) {
      return { success: false, error: err.message || 'Error de conexión con el servidor GoPaq' } as ApiResponse<T>;
    }
  }

  static hasSession() { return !!this.getToken(); }
  static logout() { if (typeof localStorage !== 'undefined') localStorage.removeItem('gopaq_token'); }

  static async login(email: string, password: string): Promise<ApiResponse<{ token: string; user: any }>> {
    const data = await this.request<{ token: string; user: any }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    if (data.success && data.token && typeof localStorage !== 'undefined') localStorage.setItem('gopaq_token', data.token);
    return data;
  }

  static async register(payload: { email: string; password: string; name: string; phone?: string; companyName?: string; organizationId?: string; tenantSlug?: string }): Promise<ApiResponse<{ token: string; user: any }>> {
    const data = await this.request<{ token: string; user: any }>('/auth/register', { method: 'POST', body: JSON.stringify(payload) });
    if (data.success && data.token && typeof localStorage !== 'undefined') localStorage.setItem('gopaq_token', data.token);
    return data;
  }

  static async getMe(): Promise<ApiResponse<{ user: any }>> { return this.request<{ user: any }>('/auth/me'); }
  static async getShipments(params?: { status?: string; search?: string }): Promise<ApiResponse<{ count: number; shipments: any[] }>> { const query = new URLSearchParams(params as any).toString(); return this.request<{ count: number; shipments: any[] }>(`/shipments?${query}`); }
  static async getShipment(id: string): Promise<ApiResponse<{ shipment: any }>> { return this.request<{ shipment: any }>(`/shipments/${id}`); }
  static async updateShipmentStatus(id: string, payload: any): Promise<ApiResponse<{ shipment: any }>> { return this.request<{ shipment: any }>(`/shipments/${id}/status`, { method: 'PATCH', body: JSON.stringify(payload) }); }
  static async createShipment(payload: any): Promise<ApiResponse<{ shipment: any }>> { return this.request<{ shipment: any }>('/shipments', { method: 'POST', body: JSON.stringify(payload) }); }
  static async calculateQuote(payload: any): Promise<ApiResponse<{ quote: any }>> { return this.request<{ quote: any }>('/quotes', { method: 'POST', body: JSON.stringify(payload) }); }
  static async getTracking(trackingNumber: string): Promise<ApiResponse<{ shipment: any }>> { return this.request<{ shipment: any }>(`/tracking/${trackingNumber}`); }
  static async getRoutes(): Promise<ApiResponse<{ routes: any[] }>> { return this.request<{ routes: any[] }>('/routes'); }
  static async createRoute(payload: any): Promise<ApiResponse<{ route: any }>> { return this.request<{ route: any }>('/routes', { method: 'POST', body: JSON.stringify(payload) }); }
  static async dispatchRoute(routeId: string, driverId?: string): Promise<ApiResponse<{ message: string }>> { return this.request<{ message: string }>(`/routes/${routeId}/dispatch`, { method: 'POST', body: JSON.stringify({ driverId }) }); }
  static async getDrivers(): Promise<ApiResponse<{ drivers: any[] }>> { return this.request<{ drivers: any[] }>('/drivers'); }
  static async createDriver(payload: any): Promise<ApiResponse<{ driver: any }>> { return this.request<{ driver: any }>('/drivers', { method: 'POST', body: JSON.stringify(payload) }); }
  static async updateDriver(id: string, payload: any): Promise<ApiResponse<{ driver: any }>> { return this.request<{ driver: any }>(`/drivers/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }); }
  static async deleteDriver(id: string): Promise<ApiResponse<{ message: string }>> { return this.request<{ message: string }>(`/drivers/${id}`, { method: 'DELETE' }); }
  static async getVehicles(): Promise<ApiResponse<{ vehicles: any[] }>> { return this.request<{ vehicles: any[] }>('/vehicles'); }
  static async createVehicle(payload: any): Promise<ApiResponse<{ vehicle: any }>> { return this.request<{ vehicle: any }>('/vehicles', { method: 'POST', body: JSON.stringify(payload) }); }
  static async updateVehicle(id: string, payload: any): Promise<ApiResponse<{ vehicle: any }>> { return this.request<{ vehicle: any }>(`/vehicles/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }); }
  static async deleteVehicle(id: string): Promise<ApiResponse<{ message: string }>> { return this.request<{ message: string }>(`/vehicles/${id}`, { method: 'DELETE' }); }
  static async sendDriverTelemetry(payload: { driverId: string; lat: number; lng: number; speed?: number; heading?: number; battery?: number }): Promise<ApiResponse<{ processed: any }>> { return this.request<{ processed: any }>('/drivers/telemetry', { method: 'POST', body: JSON.stringify(payload) }); }
  static async getActiveManifest(driverId?: string): Promise<ApiResponse<{ driver: any; route: any; stops: any[] }>> { return this.request<{ driver: any; route: any; stops: any[] }>(`/drivers/active-manifest?driverId=${driverId || ''}`); }
  static async getBranches(): Promise<ApiResponse<{ branches: any[] }>> { return this.request<{ branches: any[] }>('/branches'); }
  static async getBranchInventory(branchId: string): Promise<ApiResponse<{ count: number; inventory: any[] }>> { return this.request<{ count: number; inventory: any[] }>(`/branches/${branchId}/inventory`); }
  static async closeBranchCash(branchId: string, payload: any): Promise<ApiResponse<{ message: string; summary: any }>> { return this.request<{ message: string; summary: any }>(`/branches/${branchId}/cash-close`, { method: 'POST', body: JSON.stringify(payload) }); }
  static async getClients(): Promise<ApiResponse<{ clients: any[] }>> { return this.request<{ clients: any[] }>('/clients'); }
  static async createClient(payload: any): Promise<ApiResponse<{ client: any }>> { return this.request<{ client: any }>('/clients', { method: 'POST', body: JSON.stringify(payload) }); }
  static async updateClient(id: string, payload: any): Promise<ApiResponse<{ client: any }>> { return this.request<{ client: any }>(`/clients/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }); }
  static async deleteClient(id: string): Promise<ApiResponse<{ message: string }>> { return this.request<{ message: string }>(`/clients/${id}`, { method: 'DELETE' }); }
  static async updateClientCredit(id: string, creditLimitDop: number): Promise<ApiResponse<{ client: any }>> { return this.request<{ client: any }>(`/clients/${id}/credit`, { method: 'PATCH', body: JSON.stringify({ creditLimitDop }) }); }
  static async getCodLedger(): Promise<ApiResponse<{ summary: any; transactions: any[] }>> { return this.request<{ summary: any; transactions: any[] }>('/cod/ledger'); }
  static async getApiKeys(): Promise<ApiResponse<{ keys: any[] }>> { return this.request<{ keys: any[] }>('/api-keys'); }
  static async createApiKey(payload: any): Promise<ApiResponse<{ apiKey: any }>> { return this.request<{ apiKey: any }>('/api-keys', { method: 'POST', body: JSON.stringify(payload) }); }
  static async revokeApiKey(id: string): Promise<ApiResponse<{ message: string }>> { return this.request<{ message: string }>(`/api-keys/${id}`, { method: 'DELETE' }); }
  static async settleCod(transactionIds: string[], notes?: string): Promise<ApiResponse<{ message: string; settlementReference: string; settledAt: string }>> { return this.request<{ message: string; settlementReference: string; settledAt: string }>('/cod/settle', { method: 'POST', body: JSON.stringify({ transactionIds, notes }) }); }
  static async getInternationalLockers(): Promise<ApiResponse<{ lockers: any[] }>> { return this.request<{ lockers: any[] }>('/international/lockers'); }
  static async getInternationalPackages(): Promise<ApiResponse<{ count: number; packages: any[] }>> { return this.request<{ count: number; packages: any[] }>('/international/packages'); }
  static async consolidateInternationalPackages(packageIds: string[], notes?: string): Promise<ApiResponse<{ message: string; masterTracking: string; packagesConsolidated: number }>> { return this.request<{ message: string; masterTracking: string; packagesConsolidated: number }>('/international/consolidate', { method: 'POST', body: JSON.stringify({ packageIds, notes }) }); }
  static async getIntegrationsHealth(): Promise<ApiResponse<{ witylogix: any; karrio: any; database: any }>> { return this.request<{ witylogix: any; karrio: any; database: any }>('/integrations/health'); }
}
