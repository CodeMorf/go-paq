import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { appendAuditLog, canUser, getOrganizationForUser, listShipmentsForUser } from "./db";

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
  tracking: router({
    publicByCode: publicProcedure.input(z.object({ code: z.string().min(6).max(48) })).query(async ({ input }) => {
      return { trackingCode: input.code, status: "not_found" as const, message: "Inserisci un codice valido o accedi al tuo spazio cliente." };
    }),
  }),
});

export type AppRouter = typeof appRouter;
