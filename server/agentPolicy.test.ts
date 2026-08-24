import { describe, expect, it } from "vitest";
import { enforceAgentApproval } from "./agentPolicy";

const base = { summary: "Analisi completata", priority: "medium" as const, proposedAction: "Controlla la rotta", requiresApproval: true, rationale: "Ritardo rilevato" };

describe("enforceAgentApproval", () => {
  it("blocks a sensitive action when the model omits approval", () => {
    expect(() => enforceAgentApproval({ ...base, proposedAction: "Conferma il pagamento", requiresApproval: false }, "pagamento cliente")).toThrow("approvazione umana");
  });

  it("forces approval on every accepted suggestion", () => {
    expect(enforceAgentApproval({ ...base, requiresApproval: false }, "analizza anomalia")).toMatchObject({ requiresApproval: true, sensitive: false });
  });
});
