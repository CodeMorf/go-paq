import { describe, expect, it } from "vitest";
import { isAllowedSpecialServiceTransition } from "./db";

describe("special service state machine", () => {
  it("allows the assisted purchase path from quote to fulfillment", () => {
    expect(isAllowedSpecialServiceTransition("requested", "quoted")).toBe(true);
    expect(isAllowedSpecialServiceTransition("quoted", "awaiting_approval")).toBe(true);
    expect(isAllowedSpecialServiceTransition("awaiting_approval", "approved")).toBe(true);
    expect(isAllowedSpecialServiceTransition("approved", "purchasing")).toBe(true);
    expect(isAllowedSpecialServiceTransition("purchasing", "purchased")).toBe(true);
    expect(isAllowedSpecialServiceTransition("purchased", "fulfillment")).toBe(true);
    expect(isAllowedSpecialServiceTransition("fulfillment", "in_progress")).toBe(true);
    expect(isAllowedSpecialServiceTransition("in_progress", "completed")).toBe(true);
  });

  it("blocks skipped states, unknown states and terminal transitions", () => {
    expect(isAllowedSpecialServiceTransition("requested", "approved")).toBe(false);
    expect(isAllowedSpecialServiceTransition("purchasing", "completed")).toBe(false);
    expect(isAllowedSpecialServiceTransition("completed", "in_progress")).toBe(false);
    expect(isAllowedSpecialServiceTransition("unknown", "approved")).toBe(false);
  });
});

