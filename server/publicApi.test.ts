import { beforeEach, describe, expect, it, vi } from "vitest";
import { registerPublicApi } from "./publicApi";
import { authenticateApiKey, createPickupForOrganization, createShipmentForOrganization, getActiveTariffForOrganization, getShipmentByTrackingForOrganization } from "./db";

vi.mock("./db", () => ({
  authenticateApiKey: vi.fn(),
  createPickupForOrganization: vi.fn(),
  createShipmentForOrganization: vi.fn(),
  getActiveTariffForOrganization: vi.fn(),
  getShipmentByTrackingForOrganization: vi.fn(),
}));

const authMock = vi.mocked(authenticateApiKey);
const tariffMock = vi.mocked(getActiveTariffForOrganization);
const shipmentMock = vi.mocked(createShipmentForOrganization);
const pickupMock = vi.mocked(createPickupForOrganization);
const trackingMock = vi.mocked(getShipmentByTrackingForOrganization);

type Handler = (request: { header: (name: string) => string | undefined; body: unknown; params: Record<string, string> }, response: TestResponse) => Promise<unknown>;
type TestResponse = { statusCode: number; headers: Record<string, string>; body?: unknown; status: (code: number) => TestResponse; setHeader: (name: string, value: string) => TestResponse; json: (body: unknown) => TestResponse };

function makeResponse(): TestResponse {
  const response = {
    statusCode: 200,
    headers: {},
    body: undefined,
    status(code: number) { response.statusCode = code; return response; },
    setHeader(name: string, value: string) { response.headers[name] = value; return response; },
    json(body: unknown) { response.body = body; return response; },
  };
  return response;
}

function makeHandler(method: "post" | "get", path: string) {
  const handlers = new Map<string, Handler>();
  registerPublicApi({
    post: (route: string, callback: Handler) => { handlers.set(`post ${route}`, callback); },
    get: (route: string, callback: Handler) => { handlers.set(`get ${route}`, callback); },
  } as never);
  const handler = handlers.get(`${method} ${path}`);
  if (!handler) throw new Error(`REST handler not registered: ${method} ${path}`);
  return handler;
}

const request = (body: unknown, authorization = "Bearer gpq_live_test_12345", params: Record<string, string> = {}) => ({
  header: (name: string) => name === "Authorization" ? authorization : name === "X-GoPaq-Version" ? "2026-01" : undefined,
  body,
  params,
});

describe("REST API pública", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue({ id: 7, organizationId: 42, scopes: '["quotes:read","shipments:write","pickups:write","tracking:read"]' } as never);
    tariffMock.mockResolvedValue({ minAmount: "100", perKg: "10", perKm: "2", fixedSurcharge: "0", fuelSurchargePct: "0", discountPct: "0", taxPct: "0", volumetricDivisor: "5000", currency: "DOP" } as never);
    shipmentMock.mockResolvedValue({ id: 11, organizationId: 42, trackingCode: "GPQ-TEST" } as never);
    pickupMock.mockResolvedValue({ id: 12, organizationId: 42, status: "requested" } as never);
    trackingMock.mockResolvedValue({ id: 11, organizationId: 42, trackingCode: "GPQ-TEST", commercialStatus: "created" } as never);
  });

  it("ignora parámetros tarifarios del cliente y resuelve la tarifa de la organización", async () => {
    const response = makeResponse();
    await makeHandler("post", "/api/v1/quotes")(request({ actualWeightKg: 2, lengthCm: 10, widthCm: 10, heightCm: 10, distanceKm: 5, serviceType: "national", minAmount: 0, perKg: 0, perKm: 0, fuelSurchargePct: 100 }), response);
    expect(response.statusCode).toBe(200);
    expect(tariffMock).toHaveBeenCalledWith(42, "national", undefined);
    expect(response.body).toMatchObject({ data: { base: 100, fuelSurcharge: 0, total: 100, currency: "DOP", serviceType: "national", tariffSource: "organization" } });
  });

  it("rechaza una cotización si no existe una tarifa vigente", async () => {
    tariffMock.mockResolvedValueOnce(null);
    const response = makeResponse();
    await makeHandler("post", "/api/v1/quotes")(request({ actualWeightKg: 2, lengthCm: 10, widthCm: 10, heightCm: 10, distanceKm: 5, serviceType: "national" }), response);
    expect(response.statusCode).toBe(409);
    expect(response.body).toMatchObject({ error: { code: "tariff_unavailable" } });
  });

  it("crea un envío con la organización de la API key", async () => {
    const response = makeResponse();
    await makeHandler("post", "/api/v1/shipments")(request({ organizationId: 999, serviceType: "moving", senderName: "Ana Pérez", recipientName: "Luis Díaz", originAddress: "Santo Domingo", destinationAddress: "Santiago", originCountry: "DO", destinationCountry: "DO" }), response);
    expect(response.statusCode).toBe(201);
    expect(shipmentMock).toHaveBeenCalledWith(42, expect.objectContaining({ serviceType: "moving" }));
  });

  it("registra un pickup asociado a un shipment", async () => {
    const response = makeResponse();
    await makeHandler("post", "/api/v1/pickups")(request({ shipmentId: 11, address: "Av. Abraham Lincoln 1", contactName: "Ana Pérez", notes: "Llamar antes" }), response);
    expect(response.statusCode).toBe(201);
    expect(pickupMock).toHaveBeenCalledWith(42, expect.objectContaining({ shipmentId: 11 }));
  });

  it("consulta tracking privado con aislamiento por organización", async () => {
    const response = makeResponse();
    await makeHandler("get", "/api/v1/tracking/:trackingCode")(request({}, undefined, { trackingCode: "GPQ-TEST" }), response);
    expect(response.statusCode).toBe(200);
    expect(trackingMock).toHaveBeenCalledWith(42, "GPQ-TEST");
  });

  it("rechaza una solicitud sin API key con un mensaje localizado", async () => {
    const response = makeResponse();
    await makeHandler("post", "/api/v1/quotes")(request({}, ""), response);
    expect(response.statusCode).toBe(401);
    expect(response.body).toMatchObject({ error: { code: "unauthorized", message: "Se requiere una API key Bearer" } });
  });
});
