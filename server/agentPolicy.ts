export const AGENT_ACTION_TYPES = ["recommend_tariff", "recommend_status", "detect_anomaly", "draft_response", "update_shipment", "confirm_delivery", "collect_payment", "refund_payment", "send_external_message"] as const;
export type AgentActionType = (typeof AGENT_ACTION_TYPES)[number];

export type AgentSuggestion = {
  summary: string;
  priority: "low" | "medium" | "high";
  proposedAction: string;
  actionType?: AgentActionType;
  requiresApproval: boolean;
  rationale: string;
};

const SENSITIVE_TERMS = /(consegna|pagamento|incasso|rimborso|stato|cancell|finanz|email|whatsapp|restituz)/i;
const SENSITIVE_ACTIONS = new Set<AgentActionType>(["update_shipment", "confirm_delivery", "collect_payment", "refund_payment", "send_external_message"]);

export function enforceAgentApproval(input: AgentSuggestion, requestedAction = "") {
  if (input.actionType && !AGENT_ACTION_TYPES.includes(input.actionType)) throw new Error("Tipo di azione agente non riconosciuto");
  const sensitive = Boolean(input.actionType && SENSITIVE_ACTIONS.has(input.actionType)) || SENSITIVE_TERMS.test(`${requestedAction} ${input.proposedAction}`);
  if (sensitive && input.requiresApproval !== true) throw new Error("La proposta sensibile è stata bloccata: richiede approvazione umana esplicita.");
  return { ...input, requiresApproval: true, sensitive };
}
