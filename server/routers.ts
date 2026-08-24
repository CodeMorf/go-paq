import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { appendAuditLog, appendShipmentEvent, canUser, getOrganizationForUser, listEventsForUser, listShipmentsForUser } from "./db";
import { invokeLLM } from "./_core/llm";
import { enforceAgentApproval } from "./agentPolicy";

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
  tracking: router({
    publicByCode: publicProcedure.input(z.object({ code: z.string().min(6).max(48) })).query(async ({ input }) => {
      return { trackingCode: input.code, status: "not_found" as const, message: "Inserisci un codice valido o accedi al tuo spazio cliente." };
    }),
  }),
});

export type AppRouter = typeof appRouter;
