import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { appendAuditLog, appendShipmentEvent, canUser, createApiKeyForUser, createPickupForUser, getOrganizationForUser, listApiKeysForUser, listEventsForUser, listPickupsForUser, listRouteStopsForUser, listRoutesForUser, listShipmentsForUser, listTrackingPointsForUser, recordTrackingPoint, revokeApiKeyForUser, uploadShipmentDocumentForUser } from "./db";
import { invokeLLM } from "./_core/llm";
import { enforceAgentApproval } from "./agentPolicy";
import { calculateQuote } from "./tariffEngine";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  logistics: router({
    scope: protectedProcedure.query(async ({ ctx }) => {
      const scope = await getOrganizationForUser(ctx.user.id);
      if (!scope) return null;
      return { organization: scope.organization, role: scope.membership.role, branchId: scope.membership.branchId };
    }),
    shipments: protectedProcedure.query(async ({ ctx }) => listShipmentsForUser(ctx.user.id)),
    timeline: protectedProcedure.input(z.object({ shipmentId: z.number().int().positive() })).query(async ({ ctx, input }) => listEventsForUser(ctx.user.id, input.shipmentId)),
    appendEvent: protectedProcedure.input(z.object({ shipmentId: z.number().int().positive(), eventType: z.string().min(2), nextStatus: z.string().optional(), note: z.string().optional(), evidenceUrl: z.string().url().optional(), latitude: z.number().optional(), longitude: z.number().optional(), idempotencyKey: z.string().min(8), origin: z.string().min(2).default("operator") })).mutation(async ({ ctx, input }) => {
      const scope = await getOrganizationForUser(ctx.user.id);
      if (!scope) throw new TRPCError({ code: "FORBIDDEN", message: "Nessuna organizzazione attiva" });
      await appendShipmentEvent({ ...input, latitude: input.latitude === undefined ? undefined : String(input.latitude), longitude: input.longitude === undefined ? undefined : String(input.longitude), organizationId: scope.organization.id, actorUserId: ctx.user.id });
      await appendAuditLog({ organizationId: scope.organization.id, actorUserId: ctx.user.id, category: "operational", action: "shipment.event.appended", resourceType: "shipment", resourceId: String(input.shipmentId), metadata: input });
      return { success: true } as const;
    }),
    overview: protectedProcedure.query(async ({ ctx }) => {
      const shipments = await listShipmentsForUser(ctx.user.id);
      return {
        active: shipments.filter((item) => !["delivered", "returned", "cancelled"].includes(item.physicalStatus)).length,
        inDelivery: shipments.filter((item) => item.physicalStatus === "out_for_delivery").length,
        incidents: shipments.filter((item) => item.physicalStatus === "incident").length,
        total: shipments.length,
      };
    }),
    audit: protectedProcedure.input(z.object({ category: z.enum(["operational", "financial", "security", "llm"]), action: z.string().min(2), resourceType: z.string().optional(), resourceId: z.string().optional(), metadata: z.unknown().optional() })).mutation(async ({ ctx, input }) => {
      const scope = await getOrganizationForUser(ctx.user.id);
      if (scope && ctx.user.role !== "admin" && !(await canUser(ctx.user.id, scope.organization.id, "audit", "create"))) {
        throw new Error("Permesso insufficiente per registrare questo audit");
      }
      await appendAuditLog({ organizationId: scope?.organization.id, actorUserId: ctx.user.id, ...input });
      return { success: true } as const;
    }),
  }),
  agent: router({
    suggest: protectedProcedure.input(z.object({ context: z.string().min(5).max(6000), requestedAction: z.string().optional() })).mutation(async ({ ctx, input }) => {
      const scope = await getOrganizationForUser(ctx.user.id);
      const response = await invokeLLM({
        messages: [
          { role: "system", content: "Sei l'agente operativo GoPaq. Analizza il contesto logistico in italiano. Non confermare consegne, pagamenti o modifiche di stato: restituisci sempre una proposta che richiede approvazione umana." },
          { role: "user", content: `Contesto: ${input.context}${input.requestedAction ? `\nAzione richiesta: ${input.requestedAction}` : ""}` },
        ],
        response_format: { type: "json_schema", json_schema: { name: "gopaq_agent_suggestion", strict: true, schema: { type: "object", properties: { summary: { type: "string" }, priority: { type: "string", enum: ["low", "medium", "high"] }, proposedAction: { type: "string" }, requiresApproval: { type: "boolean" }, rationale: { type: "string" } }, required: ["summary", "priority", "proposedAction", "requiresApproval", "rationale"], additionalProperties: false } } },
      });
      const content = response.choices?.[0]?.message?.content;
      const rawSuggestion = typeof content === "string" ? JSON.parse(content) : { summary: "Nessun suggerimento disponibile", priority: "low", proposedAction: "Nessuna azione", requiresApproval: true, rationale: "Risposta agente non disponibile" };
      let suggestion: ReturnType<typeof enforceAgentApproval>;
      try {
        suggestion = enforceAgentApproval(rawSuggestion, input.requestedAction);
      } catch (error) {
        await appendAuditLog({ organizationId: scope?.organization.id, actorUserId: ctx.user.id, category: "security", action: "agent.suggestion.blocked", resourceType: "agent", metadata: { reason: "approval_required" } });
        throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "Proposta agente bloccata" });
      }
      await appendAuditLog({ organizationId: scope?.organization.id, actorUserId: ctx.user.id, category: "llm", action: "agent.suggestion.created", resourceType: "agent", metadata: { ...suggestion, sensitive: suggestion.sensitive, approved: false } });
      return suggestion;
    }),
  }),
  documents: router({
    upload: protectedProcedure.input(z.object({ shipmentId: z.number().int().positive(), documentType: z.enum(["label", "invoice", "customs", "pod", "incident", "receipt"]), fileName: z.string().min(1).max(180).regex(/^[a-zA-Z0-9._-]+$/), mimeType: z.string().min(3).max(120), dataBase64: z.string().min(1) })).mutation(async ({ ctx, input }) => {
      const result = await uploadShipmentDocumentForUser(ctx.user.id, input);
      if (!result) throw new TRPCError({ code: "FORBIDDEN", message: "Nessuna organizzazione attiva" });
      return result;
    }),
  }),
  apiKeys: router({
    list: protectedProcedure.query(({ ctx }) => listApiKeysForUser(ctx.user.id)),
    issue: protectedProcedure.input(z.object({ name: z.string().min(2).max(160), scopes: z.array(z.enum(["quotes:read", "shipments:read", "shipments:write", "tracking:read", "pickups:write", "webhooks:read"])).min(1).max(10) })).mutation(async ({ ctx, input }) => {
      const scope = await getOrganizationForUser(ctx.user.id);
      if (!scope || !(await canUser(ctx.user.id, scope.organization.id, "api_keys", "create"))) throw new TRPCError({ code: "FORBIDDEN", message: "Permesso API non disponibile" });
      const key = await createApiKeyForUser(ctx.user.id, input.name, input.scopes);
      if (!key) throw new TRPCError({ code: "FORBIDDEN", message: "Nessuna organizzazione attiva" });
      return key;
    }),
    revoke: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const scope = await getOrganizationForUser(ctx.user.id);
      if (!scope || !(await canUser(ctx.user.id, scope.organization.id, "api_keys", "configure"))) throw new TRPCError({ code: "FORBIDDEN", message: "Permesso API non disponibile" });
      const revoked = await revokeApiKeyForUser(ctx.user.id, input.id);
      if (!revoked) throw new TRPCError({ code: "NOT_FOUND", message: "Chiave API non trovata" });
      await appendAuditLog({ organizationId: scope.organization.id, actorUserId: ctx.user.id, category: "security", action: "api_key.revoked", resourceType: "api_key", resourceId: String(input.id), metadata: { revoked: true } });
      return { success: true } as const;
    }),
  }),
  gps: router({
    points: protectedProcedure.input(z.object({ shipmentId: z.number().int().positive().optional(), routeId: z.number().int().positive().optional() })).query(({ ctx, input }) => listTrackingPointsForUser(ctx.user.id, input.shipmentId, input.routeId)),
    record: protectedProcedure.input(z.object({ shipmentId: z.number().int().positive().optional(), routeId: z.number().int().positive().optional(), latitude: z.number().gte(-90).lte(90), longitude: z.number().gte(-180).lte(180), accuracyMeters: z.number().nonnegative().optional(), capturedAt: z.date(), source: z.enum(["driver", "branch", "system"]).default("driver") })).mutation(async ({ ctx, input }) => {
      const result = await recordTrackingPoint(ctx.user.id, { ...input, latitude: String(input.latitude), longitude: String(input.longitude), accuracyMeters: input.accuracyMeters === undefined ? undefined : String(input.accuracyMeters) });
      if (!result) throw new TRPCError({ code: "FORBIDDEN", message: "Nessuna organizzazione attiva" });
      return result;
    }),
  }),
  quote: router({
    preview: publicProcedure.input(z.object({ minAmount: z.number().nonnegative(), perKg: z.number().nonnegative(), perKm: z.number().nonnegative(), fuelSurchargePct: z.number().nonnegative().max(100), actualWeightKg: z.number().positive(), lengthCm: z.number().positive(), widthCm: z.number().positive(), heightCm: z.number().positive(), distanceKm: z.number().nonnegative() })).query(({ input }) => calculateQuote(input)),
  }),
  routes: router({
    list: protectedProcedure.query(({ ctx }) => listRoutesForUser(ctx.user.id)),
    stops: protectedProcedure.input(z.object({ routeId: z.number().int().positive() })).query(({ ctx, input }) => listRouteStopsForUser(ctx.user.id, input.routeId)),
  }),
  pickups: router({
    list: protectedProcedure.query(({ ctx }) => listPickupsForUser(ctx.user.id)),
    create: protectedProcedure.input(z.object({ shipmentId: z.number().int().positive().optional(), address: z.string().min(5).max(500), contactName: z.string().min(2).max(160), windowStart: z.date().optional(), windowEnd: z.date().optional(), notes: z.string().max(1000).optional() })).mutation(async ({ ctx, input }) => {
      const result = await createPickupForUser(ctx.user.id, input);
      if (!result) throw new TRPCError({ code: "FORBIDDEN", message: "Nessuna organizzazione attiva" });
      return result;
    }),
  }),
  tracking: router({
    publicByCode: publicProcedure.input(z.object({ code: z.string().min(6).max(48) })).query(async ({ input }) => {
      return { trackingCode: input.code, status: "not_found" as const, message: "Inserisci un codice valido o accedi al tuo spazio cliente." };
    }),
  }),
});

export type AppRouter = typeof appRouter;
