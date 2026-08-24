import { beforeEach, describe, expect, it } from "vitest";
import { enqueueDriverOperation, listPendingDriverOperations } from "./offlineQueue";

const store = new Map<string, string>();
const localStorageStub = { getItem: (key: string) => store.get(key) ?? null, setItem: (key: string, value: string) => store.set(key, value), removeItem: (key: string) => store.delete(key) };

describe("driver offline queue", () => {
  beforeEach(() => { store.clear(); Object.defineProperty(globalThis, "localStorage", { value: localStorageStub, configurable: true }); });
  it("deduplicates operations by idempotency key", () => {
    enqueueDriverOperation({ idempotencyKey: "pod-1", kind: "pod", payload: { shipmentId: 1 } });
    enqueueDriverOperation({ idempotencyKey: "pod-1", kind: "pod", payload: { shipmentId: 1 } });
    expect(listPendingDriverOperations()).toHaveLength(1);
    expect(listPendingDriverOperations()[0]?.state).toBe("pending");
  });
});
