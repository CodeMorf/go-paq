export type PackageState = "expected" | "received" | "inspected" | "stored" | "dispatched" | "delivered" | "incident" | "returned";

const transitions: Record<PackageState, PackageState[]> = {
  expected: ["received", "incident", "returned"],
  received: ["inspected", "stored", "incident", "returned"],
  inspected: ["stored", "incident", "returned"],
  stored: ["dispatched", "incident", "returned"],
  dispatched: ["delivered", "incident", "returned"],
  delivered: [],
  incident: ["received", "returned"],
  returned: [],
};

export function canTransitionPackage(from: PackageState, to: PackageState) {
  return transitions[from]?.includes(to) ?? false;
}

export function transitionPackage(from: PackageState, to: PackageState) {
  if (!canTransitionPackage(from, to)) throw new Error(`Transición de paquete no permitida: ${from} → ${to}`);
  return to;
}
