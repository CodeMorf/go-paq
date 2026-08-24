import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { advanceManifestForUser, appendAuditLog, appendShipmentEvent, canUser, createApiKeyForUser, createManifestForUser, createPickupForUser, createShipmentForUser, createWarehouseForUser, confirmShipmentDeliveryForUser, getOrganizationForUser, getPublicTrackingByCode, listApiKeysForUser, listAuditLogsForUser, listBranchesForUser, listShipmentDocumentsForUser, listEventsForUser, listManifestsForUser, listPickupsForUser, listRouteStopsForUser, listRoutesForUser, listShipmentsForUser, listTrackingPointsForUser, listWarehousesForUser, recordTrackingPoint, revokeApiKeyForUser, updateShipmentForUser, updateWarehouseForUser, updateOrganizationProfileForUser, uploadShipmentDocumentForUser } from "./db";
import { invokeLLM } from "./_core/llm";
import { AGENT_ACTION_TYPES, enforceAgentApproval } from "./agentPolicy";
import { calculateQuote } from "./tariffEngine";
import { buildTrackingAuditMetadata, trackingResourceId } from "./trackingAudit";
import { buildDopTariffInput } from "./tariffCatalog";

export const appRouter = router({
  organization: router({
    updateProfile: protectedProcedure.input(z.object({ country: z.string().min(2).max(80), language: z.string().min(2).max(8), currency: z.string().min(3).max(8), timezone: z.string().min(3).max(80), activeServices: z.array(z.string().min(2).max(48)).max(20) })).mutation(async ({ ctx, input }) => {
      const scope = await getOrganizationForUser(ctx.user.id);
      if (!scope || !(await canUser(ctx.user.id, scope.organization.id, "organization", "configure"))) throw new TRPCError({ code: "FORBIDDEN", message: "Permesso configurazione organizzazione non disponibile" });
      const result = await updateOrganizationProfileForUser(ctx.user.id, input);
      if (!result) throw new TRPCError({ code: "FORBIDDEN", message: "Nessuna organizzazione attiva" });
      await appendAuditLog({ organizationId: scope.organization.id, actorUserId: ctx.user.id, category: "security", action: "organization.profile.updated", resourceType: "organization", resourceId: String(scope.organization.id), metadata: input });
      return result;
    }),
  }),
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
    shipments: router({
      list: protectedProcedure.query(async ({ ctx }) => { const scope = await getOrganizationForUser(ctx.user.id); if (!scope || !(await canUser(ctx.user.id, scope.organization.id, "shipments", "view"))) throw new TRPCError({ code: "FORBIDDEN", message: "Permiso de envíos no disponible" }); return listShipmentsForUser(ctx.user.id); }),
      create: protectedProcedure.input(z.object({ branchId: z.number().int().positive().optional(), serviceType: z.enum(["local", "national", "international", "assisted_purchase", "heavy_cargo"]), senderName: z.string().min(2).max(180), recipientName: z.string().min(2).max(180), originAddress: z.string().min(5).max(1000), destinationAddress: z.string().min(5).max(1000), originCountry: z.string().min(2).max(80).default("DO"), destinationCountry: z.string().min(2).max(80).default("DO"), estimatedAmount: z.string().regex(/^\\d+(\\.\\d{1,2})?$/).optional() })).mutation(async ({ ctx, input }) => {
        const scope = await getOrganizationForUser(ctx.user.id);
        if (!scope || !(await canUser(ctx.user.id, scope.organization.id, "shipments", "create"))) throw new TRPCError({ code: "FORBIDDEN", message: "Permiso de creación de envíos no disponible" });
        const result = await createShipmentForUser(ctx.user.id, input);
        if (!result) throw new TRPCError({ code: "FORBIDDEN", message: "La sucursal no pertenece a la organización activa" });
        await appendAuditLog({ organizationId: scope.organization.id, actorUserId: ctx.user.id, category: "operational", action: "shipment.created", resourceType: "shipment", resourceId: String(result.id), metadata: { trackingCode: result.trackingCode, serviceType: result.serviceType } });
        return result;
      }),
      update: protectedProcedure.input(z.object({ id: z.number().int().positive(), branchId: z.number().int().positive().optional(), serviceType: z.enum(["local", "national", "international", "assisted_purchase", "heavy_cargo"]).optional(), senderName: z.string().min(2).max(180).optional(), recipientName: z.string().min(2).max(180).optional(), originAddress: z.string().min(5).max(1000).optional(), destinationAddress: z.string().min(5).max(1000).optional(), originCountry: z.string().min(2).max(80).optional(), destinationCountry: z.string().min(2).max(80).optional(), estimatedAmount: z.string().regex(/^\\d+(\\.\\d{1,2})?$/).optional() })).mutation(async ({ ctx, input }) => {
        const scope = await getOrganizationForUser(ctx.user.id);
        if (!scope || !(await canUser(ctx.user.id, scope.organization.id, "shipments", "edit"))) throw new TRPCError({ code: "FORBIDDEN", message: "Permiso de edición de envíos no disponible" });
        const { id, ...changes } = input;
        const result = await updateShipmentForUser(ctx.user.id, id, changes);
        if (!result) throw new TRPCError({ code: "NOT_FOUND", message: "Envío no encontrado o ya no está editable" });
        await appendAuditLog({ organizationId: scope.organization.id, actorUserId: ctx.user.id, category: "operational", action: "shipment.updated", resourceType: "shipment", resourceId: String(id), metadata: changes });
        return result;
      }),
    }),
    timeline: protectedProcedure.input(z.object({ shipmentId: z.number().int().positive() })).query(async ({ ctx, input }) => { const scope = await getOrganizationForUser(ctx.user.id); if (!scope || !(await canUser(ctx.user.id, scope.organization.id, "tracking", "view"))) throw new TRPCError({ code: "FORBIDDEN", message: "Permesso timeline non disponibile" }); return listEventsForUser(ctx.user.id, input.shipmentId); }),
    appendEvent: protectedProcedure.input(z.object({ shipmentId: z.number().int().positive(), eventType: z.string().min(2), nextStatus: z.string().optional(), note: z.string().optional(), evidenceUrl: z.string().url().optional(), latitude: z.number().optional(), longitude: z.number().optional(), idempotencyKey: z.string().min(8), origin: z.string().min(2).default("operator") })).mutation(async ({ ctx, input }) => {
      const scope = await getOrganizationForUser(ctx.user.id);
      if (!scope || !(await canUser(ctx.user.id, scope.organization.id, "tracking", "create"))) throw new TRPCError({ code: "FORBIDDEN", message: "Permesso modifica timeline non disponibile" });
      await appendShipmentEvent({ ...input, latitude: input.latitude === undefined ? undefined : String(input.latitude), longitude: input.longitude === undefined ? undefined : String(input.longitude), organizationId: scope.organization.id, actorUserId: ctx.user.id });
      await appendAuditLog({ organizationId: scope.organization.id, actorUserId: ctx.user.id, category: "operational", action: "shipment.event.appended", resourceType: "shipment", resourceId: String(input.shipmentId), metadata: input });
      return { success: true } as const;
    }),
    confirmDelivery: protectedProcedure.input(z.object({ shipmentId: z.number().int().positive(), recipientName: z.string().min(2).max(180), note: z.string().max(1000).optional(), evidenceUrl: z.string().url().optional(), latitude: z.number().gte(-90).lte(90).optional(), longitude: z.number().gte(-180).lte(180).optional(), idempotencyKey: z.string().min(8).max(120) })).mutation(async ({ ctx, input }) => {
      const scope = await getOrganizationForUser(ctx.user.id);
      if (!scope || !(await canUser(ctx.user.id, scope.organization.id, "tracking", "create"))) throw new TRPCError({ code: "FORBIDDEN", message: "Permiso de confirmación de entrega no disponible" });
      try {
        const result = await confirmShipmentDeliveryForUser(ctx.user.id, { ...input, latitude: input.latitude === undefined ? undefined : String(input.latitude), longitude: input.longitude === undefined ? undefined : String(input.longitude) });
        if (!result) throw new TRPCError({ code: "NOT_FOUND", message: "Envío no encontrado en la organización activa" });
        await appendAuditLog({ organizationId: scope.organization.id, actorUserId: ctx.user.id, category: "operational", action: "shipment.delivery.confirmed", resourceType: "shipment", resourceId: String(input.shipmentId), metadata: { recipientName: input.recipientName, evidenceProvided: Boolean(input.evidenceUrl), idempotencyKey: input.idempotencyKey } });
        return result;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "Entrega no confirmada" });
      }
    }),
    overview: protectedProcedure.query(async ({ ctx }) => {
      const scope = await getOrganizationForUser(ctx.user.id); if (!scope || !(await canUser(ctx.user.id, scope.organization.id, "shipments", "view"))) throw new TRPCError({ code: "FORBIDDEN", message: "Permesso KPI spedizioni non disponibile" });
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
      if (!scope || !(await canUser(ctx.user.id, scope.organization.id, "audit", "create"))) throw new TRPCError({ code: "FORBIDDEN", message: "Permesso registrazione audit non disponibile" });
      await appendAuditLog({ organizationId: scope.organization.id, actorUserId: ctx.user.id, ...input });
      return { success: true } as const;
    }),
  }),
  agent: router({
    suggest: protectedProcedure.input(z.object({ context: z.string().min(5).max(6000), requestedAction: z.string().optional() })).mutation(async ({ ctx, input }) => {
      const scope = await getOrganizationForUser(ctx.user.id);
      if (!scope) throw new TRPCError({ code: "FORBIDDEN", message: "Nessuna organizzazione attiva per l’agente" });
      const response = await invokeLLM({
        messages: [
          { role: "system", content: "Sei l'agente operativo GoPaq. Analizza il contesto logistico in italiano. Non confermare consegne, pagamenti o modifiche di stato: restituisci sempre una proposta che richiede approvazione umana." },
          { role: "user", content: `Contesto: ${input.context}${input.requestedAction ? `\nAzione richiesta: ${input.requestedAction}` : ""}` },
        ],
        response_format: { type: "json_schema", json_schema: { name: "gopaq_agent_suggestion", strict: true, schema: { type: "object", properties: { summary: { type: "string" }, priority: { type: "string", enum: ["low", "medium", "high"] }, proposedAction: { type: "string" }, actionType: { type: "string", enum: [...AGENT_ACTION_TYPES] }, requiresApproval: { type: "boolean" }, rationale: { type: "string" } }, required: ["summary", "priority", "proposedAction", "actionType", "requiresApproval", "rationale"], additionalProperties: false } } },
      });
      const content = response.choices?.[0]?.message?.content;
      const rawSuggestion = typeof content === "string" ? JSON.parse(content) : { summary: "Nessun suggerimento disponibile", priority: "low", proposedAction: "Nessuna azione", actionType: "detect_anomaly" as const, requiresApproval: true, rationale: "Risposta agente non disponibile" };
      let suggestion: ReturnType<typeof enforceAgentApproval>;
      try {
        suggestion = enforceAgentApproval(rawSuggestion, input.requestedAction);
      } catch (error) {
        await appendAuditLog({ organizationId: scope.organization.id, actorUserId: ctx.user.id, category: "security", action: "agent.suggestion.blocked", resourceType: "agent", metadata: { reason: "approval_required" } });
        throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "Proposta agente bloccata" });
      }
      await appendAuditLog({ organizationId: scope.organization.id, actorUserId: ctx.user.id, category: "llm", action: "agent.suggestion.created", resourceType: "agent", metadata: { ...suggestion, sensitive: suggestion.sensitive, approved: false } });
      return suggestion;
    }),
  }),
  audit: router({
    list: protectedProcedure.query(async ({ ctx }) => { const scope = await getOrganizationForUser(ctx.user.id); if (!scope || !(await canUser(ctx.user.id, scope.organization.id, "audit", "view"))) throw new TRPCError({ code: "FORBIDDEN", message: "Permesso audit non disponibile" }); return listAuditLogsForUser(ctx.user.id); }),
  }),
  documents: router({
    upload: protectedProcedure.input(z.object({ shipmentId: z.number().int().positive(), documentType: z.enum(["label", "invoice", "customs", "pod", "incident", "receipt"]), fileName: z.string().min(1).max(180).regex(/^[a-zA-Z0-9._-]+$/), mimeType: z.string().min(3).max(120), dataBase64: z.string().min(1) })).mutation(async ({ ctx, input }) => {
      const scope = await getOrganizationForUser(ctx.user.id);
      if (!scope || !(await canUser(ctx.user.id, scope.organization.id, "documents", "create"))) throw new TRPCError({ code: "FORBIDDEN", message: "Permesso documenti non disponibile" });
      const result = await uploadShipmentDocumentForUser(ctx.user.id, input);
      if (!result) throw new TRPCError({ code: "FORBIDDEN", message: "Spedizione non appartenente all'organizzazione attiva" });
      await appendAuditLog({ organizationId: scope.organization.id, actorUserId: ctx.user.id, category: "operational", action: "shipment.document.uploaded", resourceType: "shipment_document", resourceId: String(input.shipmentId), metadata: { documentType: input.documentType, mimeType: input.mimeType } });
      return result;
    }),
    list: protectedProcedure.input(z.object({ shipmentId: z.number().int().positive().optional() }).optional()).query(async ({ ctx, input }) => { const scope = await getOrganizationForUser(ctx.user.id); if (!scope || !(await canUser(ctx.user.id, scope.organization.id, "documents", "view"))) throw new TRPCError({ code: "FORBIDDEN", message: "Permesso documenti non disponibile" }); return listShipmentDocumentsForUser(ctx.user.id, input?.shipmentId); }),
  }),
  apiKeys: router({
    list: protectedProcedure.query(async ({ ctx }) => { const scope = await getOrganizationForUser(ctx.user.id); if (!scope || !(await canUser(ctx.user.id, scope.organization.id, "api_keys", "view"))) throw new TRPCError({ code: "FORBIDDEN", message: "Permesso chiavi API non disponibile" }); return listApiKeysForUser(ctx.user.id); }),
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
    points: protectedProcedure.input(z.object({ shipmentId: z.number().int().positive().optional(), routeId: z.number().int().positive().optional() })).query(async ({ ctx, input }) => { const scope = await getOrganizationForUser(ctx.user.id); if (!scope || !(await canUser(ctx.user.id, scope.organization.id, "tracking", "view"))) throw new TRPCError({ code: "FORBIDDEN", message: "Permesso tracking non disponibile" }); const result = await listTrackingPointsForUser(ctx.user.id, input.shipmentId, input.routeId); await appendAuditLog({ organizationId: scope.organization.id, actorUserId: ctx.user.id, category: "security", action: "tracking.points.viewed", resourceType: "tracking_points", resourceId: trackingResourceId(input), metadata: buildTrackingAuditMetadata(input, result.length) }); return result; }),
    record: protectedProcedure.input(z.object({ shipmentId: z.number().int().positive().optional(), routeId: z.number().int().positive().optional(), latitude: z.number().gte(-90).lte(90), longitude: z.number().gte(-180).lte(180), accuracyMeters: z.number().nonnegative().optional(), capturedAt: z.date(), source: z.enum(["driver", "branch", "system"]).default("driver") })).mutation(async ({ ctx, input }) => {
      const scope = await getOrganizationForUser(ctx.user.id); if (!scope || !(await canUser(ctx.user.id, scope.organization.id, "tracking", "create"))) throw new TRPCError({ code: "FORBIDDEN", message: "Permesso registrazione tracking non disponibile" });
      const result = await recordTrackingPoint(ctx.user.id, { ...input, latitude: String(input.latitude), longitude: String(input.longitude), accuracyMeters: input.accuracyMeters === undefined ? undefined : String(input.accuracyMeters) });
      if (!result) throw new TRPCError({ code: "FORBIDDEN", message: "Punto GPS senza envío o ruta válida de la organización" });
      await appendAuditLog({ organizationId: scope.organization.id, actorUserId: ctx.user.id, category: "operational", action: "tracking.point.recorded", resourceType: "tracking_point", resourceId: String(input.shipmentId ?? input.routeId ?? "unassigned"), metadata: { shipmentId: input.shipmentId, routeId: input.routeId, source: input.source } });
      return result;
    }),
  }),
  quote: router({
    preview: publicProcedure.input(z.object({ actualWeightKg: z.number().positive(), lengthCm: z.number().positive(), widthCm: z.number().positive(), heightCm: z.number().positive(), distanceKm: z.number().nonnegative() })).query(({ input }) => { const tariffInput = buildDopTariffInput(input); return { ...calculateQuote(tariffInput), currency: tariffInput.currency }; }),
  }),
  routes: router({
    list: protectedProcedure.query(async ({ ctx }) => { const scope = await getOrganizationForUser(ctx.user.id); if (!scope || !(await canUser(ctx.user.id, scope.organization.id, "routes", "view"))) throw new TRPCError({ code: "FORBIDDEN", message: "Permesso rotte non disponibile" }); return listRoutesForUser(ctx.user.id); }),
    stops: protectedProcedure.input(z.object({ routeId: z.number().int().positive() })).query(async ({ ctx, input }) => { const scope = await getOrganizationForUser(ctx.user.id); if (!scope || !(await canUser(ctx.user.id, scope.organization.id, "routes", "view"))) throw new TRPCError({ code: "FORBIDDEN", message: "Permesso fermate non disponibile" }); return listRouteStopsForUser(ctx.user.id, input.routeId); }),
  }),
  manifests: router({
    list: protectedProcedure.query(async ({ ctx }) => { const scope = await getOrganizationForUser(ctx.user.id); if (!scope || !(await canUser(ctx.user.id, scope.organization.id, "manifests", "view"))) throw new TRPCError({ code: "FORBIDDEN", message: "Permesso manifest non disponibile" }); return listManifestsForUser(ctx.user.id); }),
    create: protectedProcedure.input(z.object({ branchId: z.number().int().positive().optional(), direction: z.enum(["outbound", "inbound", "transfer"]) })).mutation(async ({ ctx, input }) => {
      const scope = await getOrganizationForUser(ctx.user.id);
      if (!scope || !(await canUser(ctx.user.id, scope.organization.id, "manifests", "create"))) throw new TRPCError({ code: "FORBIDDEN", message: "Permesso creazione manifest non disponibile" });
      const result = await createManifestForUser(ctx.user.id, input);
      if (!result) throw new TRPCError({ code: "FORBIDDEN", message: "Nessuna organizzazione attiva" });
      await appendAuditLog({ organizationId: scope.organization.id, actorUserId: ctx.user.id, category: "operational", action: "manifest.created", resourceType: "manifest", resourceId: result.code, metadata: input });
      return result;
    }),
    advance: protectedProcedure.input(z.object({ manifestId: z.number().int().positive(), nextStatus: z.enum(["sealed", "in_transit", "received", "reconciled"]) })).mutation(async ({ ctx, input }) => {
      const scope = await getOrganizationForUser(ctx.user.id);
      if (!scope || !(await canUser(ctx.user.id, scope.organization.id, "manifests", "edit"))) throw new TRPCError({ code: "FORBIDDEN", message: "Permesso avanzamento manifest non disponibile" });
      try { const result = await advanceManifestForUser(ctx.user.id, input.manifestId, input.nextStatus); if (!result) throw new TRPCError({ code: "NOT_FOUND", message: "Manifest non trovato" }); await appendAuditLog({ organizationId: scope.organization.id, actorUserId: ctx.user.id, category: "operational", action: "manifest.advanced", resourceType: "manifest", resourceId: String(input.manifestId), metadata: { nextStatus: input.nextStatus } }); return result; } catch (error) { if (error instanceof TRPCError) throw error; throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "Transizione manifest non valida" }); }
    }),
  }),
  branches: router({
    list: protectedProcedure.query(async ({ ctx }) => { const scope = await getOrganizationForUser(ctx.user.id); if (!scope || !(await canUser(ctx.user.id, scope.organization.id, "branches", "view"))) throw new TRPCError({ code: "FORBIDDEN", message: "Permiso de sucursales no disponible" }); return listBranchesForUser(ctx.user.id); }),
  }),
  warehouses: router({
    list: protectedProcedure.query(async ({ ctx }) => { const scope = await getOrganizationForUser(ctx.user.id); if (!scope || !(await canUser(ctx.user.id, scope.organization.id, "warehouses", "view"))) throw new TRPCError({ code: "FORBIDDEN", message: "Permiso de almacenes no disponible" }); return listWarehousesForUser(ctx.user.id); }),
    create: protectedProcedure.input(z.object({ branchId: z.number().int().positive(), name: z.string().min(2).max(160), code: z.string().min(2).max(40).regex(/^[A-Za-z0-9_-]+$/), address: z.string().max(1000).optional() })).mutation(async ({ ctx, input }) => {
      const scope = await getOrganizationForUser(ctx.user.id);
      if (!scope || !(await canUser(ctx.user.id, scope.organization.id, "warehouses", "create"))) throw new TRPCError({ code: "FORBIDDEN", message: "Permiso de creación de almacenes no disponible" });
      const result = await createWarehouseForUser(ctx.user.id, input);
      if (!result) throw new TRPCError({ code: "FORBIDDEN", message: "La sucursal no pertenece a la organización activa" });
      await appendAuditLog({ organizationId: scope.organization.id, actorUserId: ctx.user.id, category: "operational", action: "warehouse.created", resourceType: "warehouse", resourceId: String(result.id), metadata: { code: result.code, branchId: result.branchId } });
      return result;
    }),
    update: protectedProcedure.input(z.object({ id: z.number().int().positive(), branchId: z.number().int().positive().optional(), name: z.string().min(2).max(160).optional(), code: z.string().min(2).max(40).regex(/^[A-Za-z0-9_-]+$/).optional(), address: z.string().max(1000).optional(), isActive: z.boolean().optional() })).mutation(async ({ ctx, input }) => {
      const scope = await getOrganizationForUser(ctx.user.id);
      if (!scope || !(await canUser(ctx.user.id, scope.organization.id, "warehouses", "edit"))) throw new TRPCError({ code: "FORBIDDEN", message: "Permiso de edición de almacenes no disponible" });
      const { id, ...changes } = input;
      const result = await updateWarehouseForUser(ctx.user.id, id, changes);
      if (!result) throw new TRPCError({ code: "NOT_FOUND", message: "Almacén no encontrado" });
      await appendAuditLog({ organizationId: scope.organization.id, actorUserId: ctx.user.id, category: "operational", action: "warehouse.updated", resourceType: "warehouse", resourceId: String(id), metadata: changes });
      return result;
    }),
  }),
  pickups: router({
    list: protectedProcedure.query(async ({ ctx }) => { const scope = await getOrganizationForUser(ctx.user.id); if (!scope || !(await canUser(ctx.user.id, scope.organization.id, "pickups", "view"))) throw new TRPCError({ code: "FORBIDDEN", message: "Permesso pickup non disponibile" }); return listPickupsForUser(ctx.user.id); }),
    create: protectedProcedure.input(z.object({ shipmentId: z.number().int().positive().optional(), address: z.string().min(5).max(500), contactName: z.string().min(2).max(160), windowStart: z.date().optional(), windowEnd: z.date().optional(), notes: z.string().max(1000).optional() })).mutation(async ({ ctx, input }) => {
      const scope = await getOrganizationForUser(ctx.user.id);
      if (!scope || !(await canUser(ctx.user.id, scope.organization.id, "pickups", "create"))) throw new TRPCError({ code: "FORBIDDEN", message: "Permesso creazione pickup non disponibile" });
      const result = await createPickupForUser(ctx.user.id, input);
      if (!result) throw new TRPCError({ code: "FORBIDDEN", message: "Nessuna organizzazione attiva" });
      return result;
    }),
  }),
  tracking: router({
    privateByShipment: protectedProcedure.input(z.object({ shipmentId: z.number().int().positive() })).query(async ({ ctx, input }) => { const scope = await getOrganizationForUser(ctx.user.id); if (!scope || !(await canUser(ctx.user.id, scope.organization.id, "tracking", "view"))) throw new TRPCError({ code: "FORBIDDEN", message: "Permesso tracking privato non disponibile" }); return listEventsForUser(ctx.user.id, input.shipmentId); }),
    publicByCode: publicProcedure.input(z.object({ code: z.string().min(6).max(48) })).query(async ({ input }) => {
      const result = await getPublicTrackingByCode(input.code);
      if (!result) return { trackingCode: input.code, status: "not_found" as const, message: "Inserisci un codice valido o accedi al tuo spazio cliente." };
      return { ...result, status: "found" as const };
    }),
  }),
});

export type AppRouter = typeof appRouter;
