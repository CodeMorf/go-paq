/**
 * GoPaq Core Logistics Real API Client
 * Connects frontend directly to GoPaq Core Express Backend on /api/v1
 */

const API_BASE = '/api/v1';

export type ApiResponse<T = Record<string, any>> =
  (({ success: true; error?: never } & T) | ({ success: false; error: string } & Partial<T>)) & { status?: number };

export class ApiClient {
  private static readonly tokenStorageKey = 'gopaq_access_token';
  private static readonly supportStorageKey = 'gopaq_support_session';

  private static getToken(): string | null {
    return typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(this.tokenStorageKey) : null;
  }

  private static setToken(token: string | null) {
    if (typeof sessionStorage === 'undefined') return;
    if (token) {
      sessionStorage.setItem(this.tokenStorageKey, token);
      if (this.tokenIsSupportSession(token)) sessionStorage.setItem(this.supportStorageKey, '1');
      else sessionStorage.removeItem(this.supportStorageKey);
    } else {
      sessionStorage.removeItem(this.tokenStorageKey);
      sessionStorage.removeItem(this.supportStorageKey);
    }
  }

  private static tokenIsSupportSession(token: string): boolean {
    try {
      const encoded = token.split('.')[1];
      if (!encoded) return false;
      const normalized = encoded.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(encoded.length / 4) * 4, '=');
      return !!(JSON.parse(atob(normalized)) as { supportSession?: boolean }).supportSession;
    } catch { return false; }
  }

  private static isSupportSession(): boolean {
    return typeof sessionStorage !== 'undefined' && sessionStorage.getItem(this.supportStorageKey) === '1';
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
      if (res.status === 401 && allowRefresh && !endpoint.startsWith('/auth/') && !this.isSupportSession()) {
        const refreshed = await this.request<{ token: string; user: any }>('/auth/refresh', { method: 'POST' }, false);
        if (refreshed.success && refreshed.token) return this.request<T>(endpoint, options, false);
      }
      if (!res.ok) return { success: false, error: data.error || `HTTP ${res.status}`, status: res.status } as ApiResponse<T>;
      if (endpoint === '/auth/refresh' && data.success && data.token) this.setToken(data.token);
      return data as ApiResponse<T>;
    } catch (err: any) {
      return { success: false, error: err.message || 'Error de conexión con el servidor GoPaq' } as ApiResponse<T>;
    }
  }

  static hasSession() { return !!this.getToken(); }
  static acceptToken(token: string) { this.setToken(token); }
  static async logout() {
    const supportSession = this.isSupportSession();
    try {
      if (!supportSession) await this.request('/auth/logout', { method: 'POST' }, false);
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

  static async register(payload: { email: string; password: string; name: string; phone?: string; companyName?: string; branchId: string; organizationId?: string; tenantSlug?: string }): Promise<ApiResponse<{ token: string; user: any }>> {
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
  static async getConfiguration(): Promise<ApiResponse<{ organizationId: string; categories: string[]; settings: Record<string, Record<string, unknown>>; version: number; configured: boolean; updatedBy: string | null; updatedAt: string | null; googleMaps: { configured: boolean; keyHint: string | null; updatedAt: string | null } }>> {
    return this.request<{ organizationId: string; categories: string[]; settings: Record<string, Record<string, unknown>>; version: number; configured: boolean; updatedBy: string | null; updatedAt: string | null; googleMaps: { configured: boolean; keyHint: string | null; updatedAt: string | null } }>('/configuration');
  }
  static async updateConfiguration(category: string, settings: Record<string, unknown>, expectedVersion: number, reason?: string): Promise<ApiResponse<{ organizationId: string; category: string; settings: Record<string, Record<string, unknown>>; version: number; updatedBy: string; updatedAt: string }>> {
    return this.request<{ organizationId: string; category: string; settings: Record<string, Record<string, unknown>>; version: number; updatedBy: string; updatedAt: string }>(`/configuration/${encodeURIComponent(category)}`, { method: 'PATCH', body: JSON.stringify({ settings, expectedVersion, reason }) });
  }
  static async updateGoogleMapsConfiguration(apiKey: string | null, expectedVersion: number, reason?: string): Promise<ApiResponse<{ organizationId: string; version: number; updatedBy: string; updatedAt: string; googleMaps: { configured: boolean; keyHint: string | null; updatedAt: string | null } }>> {
    return this.request<{ organizationId: string; version: number; updatedBy: string; updatedAt: string; googleMaps: { configured: boolean; keyHint: string | null; updatedAt: string | null } }>('/configuration/google-maps', { method: 'PATCH', body: JSON.stringify({ apiKey, expectedVersion, reason }) });
  }
  static async getPublicMapConfiguration(): Promise<ApiResponse<{ provider: string; configured: boolean; status: string; apiKey?: string }>> {
    return this.request<{ provider: string; configured: boolean; status: string; apiKey?: string }>('/configuration/maps', {}, false);
  }
  static async getPublicBranding(): Promise<ApiResponse<{ branding: { displayName: string; primaryColor: string; secondaryColor: string; logoUrl: string; faviconUrl: string; version: number; updatedAt: string | null } }>> {
    return this.request<{ branding: { displayName: string; primaryColor: string; secondaryColor: string; logoUrl: string; faviconUrl: string; version: number; updatedAt: string | null } }>('/configuration/public', {}, false);
  }
  static async updateBranding(payload: { logo?: string | null; favicon?: string | null; expectedVersion: number; reason?: string }): Promise<ApiResponse<{ settings: Record<string, Record<string, unknown>>; version: number; updatedBy: string; updatedAt: string }>> {
    return this.request<{ settings: Record<string, Record<string, unknown>>; version: number; updatedBy: string; updatedAt: string }>('/configuration/branding', { method: 'PATCH', body: JSON.stringify(payload) });
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
  static async createDriver(payload: { name: string; email?: string; phone: string; licenseNumber: string; vehicleType: string; vehiclePlate: string; branchId: string; userId?: string }): Promise<ApiResponse<{ driver: any; photoUpload: { url: string; expiresAt: string; expiresInHours: number } }>> { return this.request<{ driver: any; photoUpload: { url: string; expiresAt: string; expiresInHours: number } }>('/drivers', { method: 'POST', body: JSON.stringify(payload) }); }
  static async generateDriverPhotoLink(driverId: string): Promise<ApiResponse<{ photoUpload: { url: string; expiresAt: string; expiresInHours: number } }>> { return this.request<{ photoUpload: { url: string; expiresAt: string; expiresInHours: number } }>(`/drivers/${encodeURIComponent(driverId)}/photo-link`, { method: 'POST' }); }
  static async getDriverCard(driverId: string): Promise<ApiResponse<{ card: any }>> { return this.request<{ card: any }>(`/drivers/${encodeURIComponent(driverId)}/card`); }
  static async uploadDriverPhoto(token: string, photoDataUrl: string): Promise<ApiResponse<{ card: any }>> { return this.request<{ card: any }>(`/drivers/photo-upload/${encodeURIComponent(token)}`, { method: 'POST', body: JSON.stringify({ photoDataUrl }) }, false); }
  static async getDriverPhoto(driverId: string): Promise<ApiResponse<{ url: string }>> {
    const token = this.getToken();
    try {
      const response = await fetch(`${API_BASE}/drivers/${encodeURIComponent(driverId)}/photo`, { headers: token ? { Authorization: `Bearer ${token}` } : {}, credentials: 'include' });
      if (!response.ok) return { success: false, error: `HTTP ${response.status}` };
      return { success: true, url: URL.createObjectURL(await response.blob()) };
    } catch (error: any) {
      return { success: false, error: error?.message || 'No fue posible cargar la foto del conductor.' };
    }
  }
  static async sendDriverTelemetry(payload: { driverId: string; lat: number; lng: number; speed?: number; heading?: number; battery?: number }): Promise<ApiResponse<{ processed: any }>> { return this.request<{ processed: any }>('/drivers/telemetry', { method: 'POST', body: JSON.stringify(payload) }); }
  static async getActiveManifest(driverId?: string): Promise<ApiResponse<{ driver: any; route: any; stops: any[] }>> { return this.request<{ driver: any; route: any; stops: any[] }>(`/drivers/active-manifest?driverId=${driverId || ''}`); }
  static async startRoute(routeId: string): Promise<ApiResponse<{ routeId: string; status: string; startedAt: string }>> { return this.request<{ routeId: string; status: string; startedAt: string }>(`/drivers/routes/${encodeURIComponent(routeId)}/start`, { method: 'POST' }); }
  static async completeDriverStop(stopId: string, payload: any, idempotencyKey?: string): Promise<ApiResponse<{ stopId: string; shipmentId: string; trackingNumber: string; status: string; codStatus: string }>> { return this.request<{ stopId: string; shipmentId: string; trackingNumber: string; status: string; codStatus: string }>(`/drivers/stops/${encodeURIComponent(stopId)}/complete`, { method: 'POST', headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined, body: JSON.stringify(payload) }); }
  static async failDriverStop(stopId: string, payload: { reason: string; notes?: string }, idempotencyKey?: string): Promise<ApiResponse<{ stopId: string; status: string; failedAt: string }>> { return this.request<{ stopId: string; status: string; failedAt: string }>(`/drivers/stops/${encodeURIComponent(stopId)}/fail`, { method: 'POST', headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined, body: JSON.stringify(payload) }); }
  static async getBranches(): Promise<ApiResponse<{ branches: any[] }>> { return this.request<{ branches: any[] }>('/branches'); }
  static async createBranch(payload: any): Promise<ApiResponse<{ branch: any }>> { return this.request<{ branch: any }>('/branches', { method: 'POST', body: JSON.stringify(payload) }); }
  static async updateBranch(branchId: string, payload: any): Promise<ApiResponse<{ branch: any }>> { return this.request<{ branch: any }>(`/branches/${encodeURIComponent(branchId)}`, { method: 'PATCH', body: JSON.stringify(payload) }); }
  static async updateBranchStatus(branchId: string, active: boolean): Promise<ApiResponse<{ active: boolean }>> { return this.request<{ active: boolean }>(`/branches/${encodeURIComponent(branchId)}/status`, { method: 'PATCH', body: JSON.stringify({ active }) }); }
  static async updateBranchLocation(branchId: string, payload: { latitude: number | null; longitude: number | null; address?: string }): Promise<ApiResponse<{ branch: any }>> { return this.request<{ branch: any }>(`/branches/${encodeURIComponent(branchId)}/location`, { method: 'PATCH', body: JSON.stringify(payload) }); }
  static async getPublicBranches(): Promise<ApiResponse<{ branches: any[] }>> { return this.request<{ branches: any[] }>('/branches/public'); }
  static async getBranchInventory(branchId: string): Promise<ApiResponse<{ count: number; inventory: any[] }>> { return this.request<{ count: number; inventory: any[] }>(`/branches/${branchId}/inventory`); }
  static async scanBranchShipment(branchId: string, payload: { trackingNumber: string; action: 'receive' | 'store' | 'dispatch'; location?: string }, idempotencyKey?: string): Promise<ApiResponse<{ shipmentId: string; trackingNumber: string; clientName?: string | null; branchName?: string | null; status: string; action: string; previousStatus?: string; processedAt?: string; processedBy?: string }>> { return this.request<{ shipmentId: string; trackingNumber: string; clientName?: string | null; branchName?: string | null; status: string; action: string; previousStatus?: string; processedAt?: string; processedBy?: string }>(`/branches/${encodeURIComponent(branchId)}/scan`, { method: 'POST', headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined, body: JSON.stringify(payload) }); }
  static async closeBranchCash(branchId: string, payload: any, idempotencyKey?: string): Promise<ApiResponse<{ message: string; summary: any }>> { return this.request<{ message: string; summary: any }>(`/branches/${branchId}/cash-close`, { method: 'POST', headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined, body: JSON.stringify(payload) }); }
  static async getClients(params?: Record<string, string | number>): Promise<ApiResponse<{ clients: any[]; pagination?: any }>> { const query = new URLSearchParams(Object.entries(params || {}).map(([key, value]) => [key, String(value)])).toString(); return this.request<{ clients: any[]; pagination?: any }>(`/clients${query ? `?${query}` : ''}`); }
  static async createClient(payload: any): Promise<ApiResponse<{ client: any }>> { return this.request<{ client: any }>('/clients', { method: 'POST', body: JSON.stringify(payload) }); }
  static async updateClient(clientId: string, payload: any): Promise<ApiResponse<{ client: any }>> { return this.request<{ client: any }>(`/clients/${encodeURIComponent(clientId)}`, { method: 'PATCH', body: JSON.stringify(payload) }); }
  static async deactivateClient(clientId: string): Promise<ApiResponse<{ status: string }>> { return this.request<{ status: string }>(`/clients/${encodeURIComponent(clientId)}`, { method: 'DELETE' }); }
  static async startClientSupport(clientId: string): Promise<ApiResponse<{ token: string; expiresAt: string; support: any }>> { return this.request<{ token: string; expiresAt: string; support: any }>(`/clients/${encodeURIComponent(clientId)}/support-session`, { method: 'POST' }); }
  static async getDangerousZones(params?: Record<string, string>): Promise<ApiResponse<{ zones: any[] }>> { const query = new URLSearchParams(params || {}).toString(); return this.request<{ zones: any[] }>(`/dangerous-zones${query ? `?${query}` : ''}`); }
  static async createDangerousZone(payload: any): Promise<ApiResponse<{ zone: any }>> { return this.request<{ zone: any }>('/dangerous-zones', { method: 'POST', body: JSON.stringify(payload) }); }
  static async updateDangerousZone(id: string, payload: any): Promise<ApiResponse<{ zone: any }>> { return this.request<{ zone: any }>(`/dangerous-zones/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(payload) }); }
  static async deactivateDangerousZone(id: string): Promise<ApiResponse<{ status: string }>> { return this.request<{ status: string }>(`/dangerous-zones/${encodeURIComponent(id)}`, { method: 'DELETE' }); }
  static async getRates(params?: Record<string, string>): Promise<ApiResponse<{ rates: any[] }>> { const query = new URLSearchParams(params || {}).toString(); return this.request<{ rates: any[] }>(`/rates${query ? `?${query}` : ''}`); }
  static async createRate(payload: any): Promise<ApiResponse<{ rate: any }>> { return this.request<{ rate: any }>('/rates', { method: 'POST', body: JSON.stringify(payload) }); }
  static async simulateRate(payload: any): Promise<ApiResponse<{ quote: any }>> { return this.request<{ quote: any }>('/rates/simulate', { method: 'POST', body: JSON.stringify(payload) }); }
  static async updateRate(id: string, payload: any): Promise<ApiResponse<{ rate: any }>> { return this.request<{ rate: any }>(`/rates/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(payload) }); }
  static async deactivateRate(id: string): Promise<ApiResponse<{ status: string }>> { return this.request<{ status: string }>(`/rates/${encodeURIComponent(id)}`, { method: 'DELETE' }); }
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
