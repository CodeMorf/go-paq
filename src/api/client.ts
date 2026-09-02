/**
 * GoPaq Core Logistics Real API Client
 * Connects frontend directly to GoPaq Core Express Backend on /api/v1
 */

const API_BASE = '/api/v1';

export type ApiResponse<T = Record<string, any>> =
  | ({ success: true; error?: never } & T)
  | ({ success: false; error: string } & Partial<T>);

export class ApiClient {
  private static readonly tokenStorageKey = 'gopaq_access_token';

  private static getToken(): string | null {
    return typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(this.tokenStorageKey) : null;
  }

  private static setToken(token: string | null) {
    if (typeof sessionStorage === 'undefined') return;
    if (token) sessionStorage.setItem(this.tokenStorageKey, token);
    else sessionStorage.removeItem(this.tokenStorageKey);
  }

  private static async request<T = any>(endpoint: string, options: RequestInit = {}, allowRefresh = true): Promise<ApiResponse<T>> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) headers.Authorization = `Bearer ${token}`;

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers, credentials: 'include' });
      const data = await res.json().catch(() => ({ success: false, error: `HTTP ${res.status}` }));
      if (res.status === 401 && allowRefresh && !endpoint.startsWith('/auth/')) {
        const refreshed = await this.request<{ token: string; user: any }>('/auth/refresh', { method: 'POST' }, false);
        if (refreshed.success && refreshed.token) return this.request<T>(endpoint, options, false);
      }
      if (!res.ok) return { success: false, error: data.error || `HTTP ${res.status}` } as ApiResponse<T>;
      if (endpoint === '/auth/refresh' && data.success && data.token) this.setToken(data.token);
      return data as ApiResponse<T>;
    } catch (err: any) {
      return { success: false, error: err.message || 'Error de conexión con el servidor GoPaq' } as ApiResponse<T>;
    }
  }

  static hasSession() { return !!this.getToken(); }
  static async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' }, false);
    } finally {
      this.setToken(null);
    }
  }

  static async login(email: string, password: string, area?: 'super-admin' | 'portal' | 'sucursal' | 'driver'): Promise<ApiResponse<{ token: string; user: any }>> {
    const data = await this.request<{ token: string; user: any }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password, area }) }, false);
    if (data.success && data.token) this.setToken(data.token);
    return data;
  }

  static async demo(area: 'super-admin' | 'portal' | 'sucursal' | 'driver'): Promise<ApiResponse<{ token: string; user: any; demo: boolean }>> {
    const data = await this.request<{ token: string; user: any; demo: boolean }>('/auth/demo', { method: 'POST', body: JSON.stringify({ area }) }, false);
    if (data.success && data.token) this.setToken(data.token);
    return data;
  }

  static async requestPasswordReset(email: string): Promise<ApiResponse<{ status: string }>> {
    return this.request<{ status: string }>('/auth/password/forgot', { method: 'POST', body: JSON.stringify({ email }) }, false);
  }

  static async resetPassword(token: string, password: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>('/auth/password/reset', { method: 'POST', body: JSON.stringify({ token, password }) }, false);
  }

  static async register(payload: { email: string; password: string; name: string; phone?: string; companyName?: string; organizationId?: string; tenantSlug?: string }): Promise<ApiResponse<{ token: string; user: any }>> {
    const data = await this.request<{ token: string; user: any }>('/auth/register', { method: 'POST', body: JSON.stringify(payload) });
    if (data.success && data.token) this.setToken(data.token);
    return data;
  }

  static async getMe(): Promise<ApiResponse<{ user: any }>> { return this.request<{ user: any }>('/auth/me'); }
  static async getReadiness(): Promise<ApiResponse<{ status: string; database: any; redis: any; migrations: boolean }>> {
    try {
      const res = await fetch('/api/ready', { credentials: 'include' });
      const data = await res.json().catch(() => ({ success: false, error: `HTTP ${res.status}` }));
      if (!res.ok) return { success: false, error: data.error || `HTTP ${res.status}` } as ApiResponse<{ status: string; database: any; redis: any; migrations: boolean }>;
      return data as ApiResponse<{ status: string; database: any; redis: any; migrations: boolean }>;
    } catch (err: any) {
      return { success: false, error: err.message || 'No fue posible consultar la preparación del servicio.' };
    }
  }
  static async getConfiguration(): Promise<ApiResponse<{ organizationId: string; categories: string[]; settings: Record<string, Record<string, unknown>>; version: number; configured: boolean; updatedBy: string | null; updatedAt: string | null }>> {
    return this.request<{ organizationId: string; categories: string[]; settings: Record<string, Record<string, unknown>>; version: number; configured: boolean; updatedBy: string | null; updatedAt: string | null }>('/configuration');
  }
  static async updateConfiguration(category: string, settings: Record<string, unknown>, expectedVersion: number, reason?: string): Promise<ApiResponse<{ organizationId: string; category: string; settings: Record<string, Record<string, unknown>>; version: number; updatedBy: string; updatedAt: string }>> {
    return this.request<{ organizationId: string; category: string; settings: Record<string, Record<string, unknown>>; version: number; updatedBy: string; updatedAt: string }>(`/configuration/${encodeURIComponent(category)}`, { method: 'PATCH', body: JSON.stringify({ settings, expectedVersion, reason }) });
  }
  static async getConfigurationRevisions(limit = 50): Promise<ApiResponse<{ revisions: any[] }>> {
    return this.request<{ revisions: any[] }>(`/configuration/revisions?limit=${encodeURIComponent(String(limit))}`);
  }
  static async getUsers(): Promise<ApiResponse<{ users: any[] }>> { return this.request<{ users: any[] }>('/auth/users'); }
  static async getShipments(params?: { status?: string; search?: string }): Promise<ApiResponse<{ count: number; shipments: any[] }>> { const query = new URLSearchParams(params as any).toString(); return this.request<{ count: number; shipments: any[] }>(`/shipments?${query}`); }
  static async getShipment(id: string): Promise<ApiResponse<{ shipment: any }>> { return this.request<{ shipment: any }>(`/shipments/${id}`); }
  static async createShipment(payload: any, idempotencyKey?: string): Promise<ApiResponse<{ shipment: any }>> { return this.request<{ shipment: any }>('/shipments', { method: 'POST', headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined, body: JSON.stringify(payload) }); }
  static async calculateQuote(payload: any): Promise<ApiResponse<{ quote: any }>> { return this.request<{ quote: any }>('/quotes', { method: 'POST', body: JSON.stringify(payload) }); }
  static async getTracking(trackingNumber: string): Promise<ApiResponse<{ shipment: any }>> { return this.request<{ shipment: any }>(`/tracking/${trackingNumber}`); }
  static async getRoutes(): Promise<ApiResponse<{ routes: any[] }>> { return this.request<{ routes: any[] }>('/routes'); }
  static async createRoute(payload: any): Promise<ApiResponse<{ route: any }>> { return this.request<{ route: any }>('/routes', { method: 'POST', body: JSON.stringify(payload) }); }
  static async dispatchRoute(routeId: string, driverId?: string): Promise<ApiResponse<{ message: string }>> { return this.request<{ message: string }>(`/routes/${routeId}/dispatch`, { method: 'POST', body: JSON.stringify({ driverId }) }); }
  static async getDrivers(): Promise<ApiResponse<{ drivers: any[] }>> { return this.request<{ drivers: any[] }>('/drivers'); }
  static async sendDriverTelemetry(payload: { driverId: string; lat: number; lng: number; speed?: number; heading?: number; battery?: number }): Promise<ApiResponse<{ processed: any }>> { return this.request<{ processed: any }>('/drivers/telemetry', { method: 'POST', body: JSON.stringify(payload) }); }
  static async getActiveManifest(driverId?: string): Promise<ApiResponse<{ driver: any; route: any; stops: any[] }>> { return this.request<{ driver: any; route: any; stops: any[] }>(`/drivers/active-manifest?driverId=${driverId || ''}`); }
  static async startRoute(routeId: string): Promise<ApiResponse<{ routeId: string; status: string; startedAt: string }>> { return this.request<{ routeId: string; status: string; startedAt: string }>(`/drivers/routes/${encodeURIComponent(routeId)}/start`, { method: 'POST' }); }
  static async completeDriverStop(stopId: string, payload: any, idempotencyKey?: string): Promise<ApiResponse<{ stopId: string; shipmentId: string; trackingNumber: string; status: string; codStatus: string }>> { return this.request<{ stopId: string; shipmentId: string; trackingNumber: string; status: string; codStatus: string }>(`/drivers/stops/${encodeURIComponent(stopId)}/complete`, { method: 'POST', headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined, body: JSON.stringify(payload) }); }
  static async failDriverStop(stopId: string, payload: { reason: string; notes?: string }, idempotencyKey?: string): Promise<ApiResponse<{ stopId: string; status: string; failedAt: string }>> { return this.request<{ stopId: string; status: string; failedAt: string }>(`/drivers/stops/${encodeURIComponent(stopId)}/fail`, { method: 'POST', headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined, body: JSON.stringify(payload) }); }
  static async getBranches(): Promise<ApiResponse<{ branches: any[] }>> { return this.request<{ branches: any[] }>('/branches'); }
  static async getPublicBranches(): Promise<ApiResponse<{ branches: any[] }>> { return this.request<{ branches: any[] }>('/branches/public'); }
  static async getBranchInventory(branchId: string): Promise<ApiResponse<{ count: number; inventory: any[] }>> { return this.request<{ count: number; inventory: any[] }>(`/branches/${branchId}/inventory`); }
  static async scanBranchShipment(branchId: string, payload: { trackingNumber: string; action: 'receive' | 'store' | 'dispatch'; location?: string }, idempotencyKey?: string): Promise<ApiResponse<{ shipmentId: string; trackingNumber: string; status: string; action: string }>> { return this.request<{ shipmentId: string; trackingNumber: string; status: string; action: string }>(`/branches/${encodeURIComponent(branchId)}/scan`, { method: 'POST', headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined, body: JSON.stringify(payload) }); }
  static async closeBranchCash(branchId: string, payload: any): Promise<ApiResponse<{ message: string; summary: any }>> { return this.request<{ message: string; summary: any }>(`/branches/${branchId}/cash-close`, { method: 'POST', body: JSON.stringify(payload) }); }
  static async getClients(): Promise<ApiResponse<{ clients: any[] }>> { return this.request<{ clients: any[] }>('/clients'); }
  static async createClient(payload: any): Promise<ApiResponse<{ client: any }>> { return this.request<{ client: any }>('/clients', { method: 'POST', body: JSON.stringify(payload) }); }
  static async getApiKeys(): Promise<ApiResponse<{ keys: any[] }>> { return this.request<{ keys: any[] }>('/api-keys'); }
  static async createApiKey(payload: any): Promise<ApiResponse<{ apiKey: any }>> { return this.request<{ apiKey: any }>('/api-keys', { method: 'POST', body: JSON.stringify(payload) }); }
  static async getCodLedger(): Promise<ApiResponse<{ summary: any; transactions: any[] }>> { return this.request<{ summary: any; transactions: any[] }>('/cod/ledger'); }
  static async receiveCod(transactionIds: string[], branchId?: string, notes?: string, idempotencyKey?: string): Promise<ApiResponse<{ status: string; transactionIds: string[]; processedAt: string }>> { return this.request<{ status: string; transactionIds: string[]; processedAt: string }>('/cod/receive', { method: 'POST', headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined, body: JSON.stringify({ transactionIds, branchId, notes }) }); }
  static async reconcileCod(transactionIds: string[], branchId?: string, notes?: string, idempotencyKey?: string): Promise<ApiResponse<{ status: string; transactionIds: string[]; processedAt: string }>> { return this.request<{ status: string; transactionIds: string[]; processedAt: string }>('/cod/reconcile', { method: 'POST', headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined, body: JSON.stringify({ transactionIds, branchId, notes }) }); }
  static async settleCod(transactionIds: string[], notes?: string, idempotencyKey?: string): Promise<ApiResponse<{ message: string; settlementReference: string; settledAt: string }>> { return this.request<{ message: string; settlementReference: string; settledAt: string }>('/cod/settle', { method: 'POST', headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined, body: JSON.stringify({ transactionIds, notes }) }); }
  static async getInternationalLockers(): Promise<ApiResponse<{ lockers: any[] }>> { return this.request<{ lockers: any[] }>('/international/lockers'); }
  static async getInternationalPackages(): Promise<ApiResponse<{ count: number; packages: any[] }>> { return this.request<{ count: number; packages: any[] }>('/international/packages'); }
  static async prealertInternational(payload: any, idempotencyKey?: string): Promise<ApiResponse<{ package: any }>> { return this.request<{ package: any }>('/international/prealert', { method: 'POST', headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined, body: JSON.stringify(payload) }); }
  static async consolidateInternationalPackages(packageIds: string[], notes?: string): Promise<ApiResponse<{ message: string; masterTracking: string; packagesConsolidated: number }>> { return this.request<{ message: string; masterTracking: string; packagesConsolidated: number }>('/international/consolidate', { method: 'POST', body: JSON.stringify({ packageIds, notes }) }); }
  static async getIntegrationsHealth(): Promise<ApiResponse<{ witylogix: any; karrio: any; database: any }>> { return this.request<{ witylogix: any; karrio: any; database: any }>('/integrations/health'); }
  static async getMovingOrders(): Promise<ApiResponse<{ orders: any[] }>> { return this.request<{ orders: any[] }>('/moving/orders'); }
  static async quoteMoving(payload: any): Promise<ApiResponse<{ quote: any }>> { return this.request<{ quote: any }>('/moving/quote', { method: 'POST', body: JSON.stringify(payload) }); }
  static async createMovingOrder(payload: any, idempotencyKey?: string): Promise<ApiResponse<{ order: any; quote: any }>> { return this.request<{ order: any; quote: any }>('/moving/orders', { method: 'POST', headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined, body: JSON.stringify(payload) }); }
  static async getHeavyCargoOrders(): Promise<ApiResponse<{ orders: any[] }>> { return this.request<{ orders: any[] }>('/heavy-cargo/orders'); }
  static async quoteHeavyCargo(payload: any): Promise<ApiResponse<{ quote: any }>> { return this.request<{ quote: any }>('/heavy-cargo/quote', { method: 'POST', body: JSON.stringify(payload) }); }
  static async createHeavyCargoOrder(payload: any, idempotencyKey?: string): Promise<ApiResponse<{ order: any; quote: any }>> { return this.request<{ order: any; quote: any }>('/heavy-cargo/orders', { method: 'POST', headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined, body: JSON.stringify(payload) }); }
}
