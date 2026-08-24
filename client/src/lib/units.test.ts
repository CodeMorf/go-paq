import { describe, expect, it } from "vitest";
import { toCm, toKg } from "./units";

describe("unit conversions", () => {
  it("normalizes weight units to kilograms", () => {
    expect(toKg(1, "kg")).toBe(1);
    expect(toKg(1000, "g")).toBe(1);
    expect(toKg(1, "lb")).toBeCloseTo(0.45359237, 8);
    expect(toKg(1, "oz")).toBeCloseTo(0.0283495231, 10);
  });

  it("normalizes dimensions to centimeters", () => {
    expect(toCm(30, "cm")).toBe(30);
    expect(toCm(1, "in")).toBe(2.54);
  });
});
