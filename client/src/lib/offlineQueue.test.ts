import { beforeEach, describe, expect, it } from "vitest";
import { enqueueDriverOperation, listPendingDriverOperations, recoverInterruptedOperation, resolveDriverConflict, syncDriverOperations } from "./offlineQueue";

const store = new Map<string, string>();
const localStorageStub = { getItem: (key: string) => store.get(key) ?? null, setItem: (key: string, value: string) => store.set(key, value), removeItem: (key: string) => store.delete(key) };

describe("driver offline queue", () => {
  beforeEach(() => { store.clear(); Object.defineProperty(globalThis, "localStorage", { value: localStorageStub, configurable: true }); });
  it("deduplicates operations by idempotency key with encrypted storage", async () => {
    await enqueueDriverOperation({ idempotencyKey: "pod-1", kind: "pod", payload: { shipmentId: 1 } });
    await enqueueDriverOperation({ idempotencyKey: "pod-1", kind: "pod", payload: { shipmentId: 1 } });
    const pending = await listPendingDriverOperations();
    expect(pending).toHaveLength(1);
    expect(pending[0]?.state).toBe("pending");
    expect(store.get("gopaq-driver-offline-queue")).not.toContain('"shipmentId":1');
  });

  it("conserva la razón del conflicto y solo reintenta tras resolución explícita", async () => {
    await enqueueDriverOperation({ idempotencyKey: "status-1", kind: "status", payload: { shipmentId: 7, status: "delivered" } });
    const conflicted = await syncDriverOperations(async () => ({ state: "conflict", reason: "El estado cambió en el servidor" }));
    expect(conflicted[0]).toMatchObject({ state: "conflict", attempts: 1, conflictReason: "El estado cambió en el servidor" });
    expect((await listPendingDriverOperations())[0]).toMatchObject({ state: "conflict", conflictReason: "El estado cambió en el servidor" });
    expect(await resolveDriverConflict("status-1", "retry")).toBe(true);
    expect((await listPendingDriverOperations())[0]?.state).toBe("pending");
    await syncDriverOperations(async () => "synced");
    expect(await listPendingDriverOperations()).toHaveLength(0);
  });

  it("recupera operaciones que quedaron en sincronización al cerrar la PWA", () => {
    const operation = { idempotencyKey: "pod-interrupted", kind: "pod" as const, payload: {}, createdAt: 1, attempts: 2, state: "syncing" as const };
    expect(recoverInterruptedOperation(operation)).toMatchObject({ state: "pending", attempts: 2, lastError: "La sincronización anterior se interrumpió; requiere reintento" });
  });

  it("impide dos sincronizaciones concurrentes del mismo dispositivo", async () => {
    await enqueueDriverOperation({ idempotencyKey: "scan-1", kind: "scan", payload: { packageId: 3 } });
    let calls = 0;
    let release: (() => void) | undefined;
    const blocker = new Promise<void>((resolve) => { release = resolve; });
    const send = async () => { calls += 1; await blocker; return "synced" as const; };
    const first = syncDriverOperations(send);
    const second = syncDriverOperations(send);
    expect(first).toBe(second);
    release?.();
    await first;
    expect(calls).toBe(1);
  });
});
