export type AgentSuggestion = {
  summary: string;
  priority: "low" | "medium" | "high";
  proposedAction: string;
  requiresApproval: boolean;
  rationale: string;
};

const SENSITIVE_TERMS = /(consegna|pagamento|incasso|rimborso|stato|cancell|finanz|email|whatsapp|restituz)/i;

export function enforceAgentApproval(input: AgentSuggestion, requestedAction = "") {
  const sensitive = SENSITIVE_TERMS.test(`${requestedAction} ${input.proposedAction}`);
  if (sensitive && input.requiresApproval !== true) {
    throw new Error("La proposta sensibile è stata bloccata: richiede approvazione umana esplicita.");
  }
  return { ...input, requiresApproval: true, sensitive };
}
