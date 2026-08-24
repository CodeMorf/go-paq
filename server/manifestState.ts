export type ManifestStatus = "open" | "sealed" | "in_transit" | "received" | "reconciled";

const transitions: Record<ManifestStatus, ManifestStatus | undefined> = {
  open: "sealed",
  sealed: "in_transit",
  in_transit: "received",
  received: "reconciled",
  reconciled: undefined,
};

export function nextManifestStatus(current: ManifestStatus, requested: ManifestStatus): ManifestStatus {
  const next = transitions[current];
  if (next !== requested) throw new Error(`Transizione manifest non valida: ${current} -> ${requested}`);
  return next;
}
