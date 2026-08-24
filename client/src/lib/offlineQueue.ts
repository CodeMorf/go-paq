export type OfflineOperation = {
  idempotencyKey: string;
  kind: "scan" | "status" | "pod" | "expense";
  payload: Record<string, unknown>;
  createdAt: number;
  state: "pending" | "syncing" | "synced" | "conflict" | "rejected";
};

const STORAGE_KEY = "gopaq-driver-offline-queue";

function getQueue(): OfflineOperation[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as OfflineOperation[]; } catch { return []; }
}

function saveQueue(queue: OfflineOperation[]) { localStorage.setItem(STORAGE_KEY, JSON.stringify(queue)); }

export function enqueueDriverOperation(operation: Omit<OfflineOperation, "createdAt" | "state">) {
  const queue = getQueue();
  if (!queue.some((item) => item.idempotencyKey === operation.idempotencyKey)) {
    queue.push({ ...operation, createdAt: Date.now(), state: "pending" });
    saveQueue(queue);
  }
  return queue;
}

export function listPendingDriverOperations() {
  return getQueue().filter((item) => item.state === "pending" || item.state === "conflict");
}

export async function syncDriverOperations(send: (operation: OfflineOperation) => Promise<"synced" | "conflict" | "rejected">) {
  const queue = getQueue();
  for (const operation of queue.filter((item) => item.state === "pending" || item.state === "conflict")) {
    operation.state = "syncing";
    saveQueue(queue);
    try { operation.state = await send(operation); } catch { operation.state = "pending"; }
    saveQueue(queue);
  }
  return queue;
}
