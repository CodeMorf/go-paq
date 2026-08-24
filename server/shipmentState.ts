export type ShipmentDomain = "commercial" | "physical" | "transport" | "financial" | "incident";
export type ShipmentState = "draft" | "confirmed" | "received" | "in_transit" | "out_for_delivery" | "delivered" | "cancelled" | "paid" | "unpaid" | "open" | "resolved";

const transitions: Record<ShipmentDomain, Record<string, string[]>> = {
  commercial: { draft: ["confirmed", "cancelled"], confirmed: ["cancelled"] },
  physical: { confirmed: ["received"], received: ["in_transit"] },
  transport: { in_transit: ["out_for_delivery"], out_for_delivery: ["delivered"] },
  financial: { unpaid: ["paid"] },
  incident: { open: ["resolved"] },
};

export function canTransition(domain: ShipmentDomain, from: ShipmentState, to: ShipmentState) {
  return transitions[domain]?.[from]?.includes(to) ?? false;
}

export function transitionShipment(domain: ShipmentDomain, from: ShipmentState, to: ShipmentState) {
  if (!canTransition(domain, from, to)) throw new Error(`Transizione non consentita: ${domain} ${from} → ${to}`);
  return to;
}
