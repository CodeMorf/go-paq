import type { Express, Request, Response } from "express";
import { z } from "zod";
import { authenticateApiKey } from "./db";
import { hasApiScope, isSupportedApiVersion, parseApiAuthorization } from "./apiAuth";
import { calculateQuote } from "./tariffEngine";
import { consumeApiRateLimit } from "./apiRateLimit";

const quoteInput = z.object({ actualWeightKg: z.number().positive(), lengthCm: z.number().positive(), widthCm: z.number().positive(), heightCm: z.number().positive(), distanceKm: z.number().nonnegative(), minAmount: z.number().nonnegative().default(10), perKg: z.number().nonnegative().default(4.5), perKm: z.number().nonnegative().default(0.8), fuelSurchargePct: z.number().min(0).max(100).default(8) });

export function registerPublicApi(app: Express) {
  app.post("/api/v1/quotes", async (req: Request, res: Response) => {
    const requestId = `req_${Date.now().toString(36)}`;
    if (!isSupportedApiVersion(req.header("X-GoPaq-Version"))) return res.status(400).json({ error: { code: "unsupported_version", message: "Versione API non supportata" }, requestId });
    const secret = parseApiAuthorization(req.header("Authorization"));
    if (!secret) return res.status(401).json({ error: { code: "unauthorized", message: "Bearer API key richiesta" }, requestId });
    const key = await authenticateApiKey(secret);
    if (!key || !hasApiScope(key.scopes, "quotes:read")) return res.status(403).json({ error: { code: "forbidden", message: "Scope quotes:read richiesto" }, requestId });
    const rate = consumeApiRateLimit(String(key.id));
    if (!rate.allowed) return res.status(429).setHeader("Retry-After", String(rate.retryAfterSeconds ?? 60)).json({ error: { code: "rate_limited", message: "Troppi tentativi, riprova più tardi" }, requestId });
    const parsed = quoteInput.safeParse(req.body);
    if (!parsed.success) return res.status(422).json({ error: { code: "validation_error", message: "Dati preventivo non validi" }, requestId });
    return res.status(200).json({ data: calculateQuote(parsed.data), requestId });
  });
}
