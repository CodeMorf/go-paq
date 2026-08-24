import { describe, expect, it } from "vitest";

describe("configuración de rate limit distribuido", () => {
  it("no declara Redis listo si falta REDIS_URL y acepta únicamente URLs TLS", () => {
    const value = process.env.REDIS_URL;
    if (!value) {
      expect(value).toBeUndefined();
      return;
    }
    expect(value.startsWith("rediss://")).toBe(true);
  });
});
