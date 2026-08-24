export type OfflineOperation = {
  idempotencyKey: string;
  kind: "scan" | "status" | "pod" | "expense" | "gps";
  payload: Record<string, unknown>;
  createdAt: number;
  attempts: number;
  state: "pending" | "syncing" | "synced" | "conflict" | "rejected";
  conflictReason?: string;
  lastError?: string;
  syncedAt?: number;
};

export type OfflineSendResult = "synced" | "conflict" | "rejected" | { state: "synced" | "conflict" | "rejected"; reason?: string };

const STORAGE_KEY = "gopaq-driver-offline-queue";
const KEY_STORAGE_KEY = "gopaq-driver-device-key";

type EncryptedQueue = { version: 1 | 2; iv: string; ciphertext: string };
let activeSync: Promise<OfflineOperation[]> | null = null;

function bytesToBase64(bytes: Uint8Array) { return btoa(String.fromCharCode(...Array.from(bytes))); }
function base64ToBytes(value: string) { return Uint8Array.from(atob(value), (character) => character.charCodeAt(0)); }

async function getEncryptionKey() {
  const cryptoApi = globalThis.crypto;
  if (!cryptoApi?.subtle) throw new Error("Cifrado del dispositivo no disponible");
  let encoded = localStorage.getItem(KEY_STORAGE_KEY);
  if (!encoded) {
    const raw = cryptoApi.getRandomValues(new Uint8Array(32));
    encoded = bytesToBase64(raw);
    localStorage.setItem(KEY_STORAGE_KEY, encoded);
  }
  return cryptoApi.subtle.importKey("raw", base64ToBytes(encoded), { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

function normalizeOperation(operation: Omit<OfflineOperation, "attempts"> & { attempts?: number }): OfflineOperation {
  return { ...operation, attempts: operation.attempts ?? 0 };
}

export function recoverInterruptedOperation(operation: OfflineOperation): OfflineOperation {
  return operation.state === "syncing" ? { ...operation, state: "pending", lastError: "La sincronización anterior se interrumpió; requiere reintento" } : operation;
}

async function readQueue(): Promise<OfflineOperation[]> {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  try {
    const encrypted = JSON.parse(stored) as EncryptedQueue;
    if (encrypted.version !== 1 && encrypted.version !== 2) return [];
    const plain = await globalThis.crypto.subtle.decrypt({ name: "AES-GCM", iv: base64ToBytes(encrypted.iv) }, await getEncryptionKey(), base64ToBytes(encrypted.ciphertext));
    const parsed = JSON.parse(new TextDecoder().decode(plain));
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((operation): operation is OfflineOperation => Boolean(operation && typeof operation.idempotencyKey === "string" && typeof operation.kind === "string" && typeof operation.payload === "object")).map(normalizeOperation).map(recoverInterruptedOperation);
  } catch {
    return [];
  }
}

async function saveQueue(queue: OfflineOperation[]) {
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const plain = new TextEncoder().encode(JSON.stringify(queue));
  const ciphertext = await globalThis.crypto.subtle.encrypt({ name: "AES-GCM", iv }, await getEncryptionKey(), plain);
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 2, iv: bytesToBase64(iv), ciphertext: bytesToBase64(new Uint8Array(ciphertext)) } satisfies EncryptedQueue));
}

export async function enqueueDriverOperation(operation: Omit<OfflineOperation, "createdAt" | "state" | "attempts">) {
  const queue = await readQueue();
  if (!queue.some((item) => item.idempotencyKey === operation.idempotencyKey)) {
    queue.push({ ...operation, createdAt: Date.now(), attempts: 0, state: "pending" });
    await saveQueue(queue);
  }
  return queue;
}

export async function listPendingDriverOperations() {
  const queue = await readQueue();
  return queue.filter((item) => item.state === "pending" || item.state === "conflict");
}

function normalizeSendResult(result: OfflineSendResult) {
  return typeof result === "string" ? { state: result } : result;
}

async function syncQueue(send: (operation: OfflineOperation) => Promise<OfflineSendResult>) {
  const queue = await readQueue();
  for (const operation of queue.filter((item) => item.state === "pending")) {
    operation.state = "syncing";
    operation.attempts += 1;
    operation.lastError = undefined;
    await saveQueue(queue);
    try {
      const result = normalizeSendResult(await send({ ...operation, payload: { ...operation.payload } }));
      operation.state = result.state;
      if (result.state === "conflict") operation.conflictReason = result.reason ?? "El servidor requiere revisión";
      if (result.state === "rejected") operation.lastError = result.reason ?? "El servidor rechazó la operación";
      if (result.state === "synced") { operation.syncedAt = Date.now(); operation.conflictReason = undefined; }
    } catch {
      operation.state = "pending";
      operation.lastError = "No se pudo contactar al servidor";
    }
    await saveQueue(queue);
  }
  return queue;
}

export function syncDriverOperations(send: (operation: OfflineOperation) => Promise<OfflineSendResult>) {
  if (activeSync) return activeSync;
  activeSync = syncQueue(send).finally(() => { activeSync = null; });
  return activeSync;
}

export async function resolveDriverConflict(idempotencyKey: string, resolution: "retry" | "discard") {
  const queue = await readQueue();
  const operation = queue.find((item) => item.idempotencyKey === idempotencyKey && item.state === "conflict");
  if (!operation) return false;
  if (resolution === "retry") {
    operation.state = "pending";
    operation.conflictReason = undefined;
    operation.lastError = undefined;
  } else {
    operation.state = "rejected";
    operation.lastError = "Descartada por el operador después de un conflicto";
  }
  await saveQueue(queue);
  return true;
}
