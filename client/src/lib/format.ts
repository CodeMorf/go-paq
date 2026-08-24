type Money = { amount: string; currencyCode: string };

/** Formatea importes operativos en español dominicano, con DOP como moneda predeterminada. */
export function formatMoney(value: Money | string | number, currencyCode = "DOP"): string {
  const amountNum = typeof value === "object" && value !== null && "amount" in value
    ? Number.parseFloat(value.amount)
    : typeof value === "string"
      ? Number.parseFloat(value)
      : value;
  const code = typeof value === "object" && value !== null && "currencyCode" in value
    ? value.currencyCode
    : currencyCode;

  if (Number.isNaN(amountNum)) return "—";

  try {
    return new Intl.NumberFormat("es-DO", {
      style: "currency",
      currency: code,
      minimumFractionDigits: amountNum % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(amountNum);
  } catch {
    return `RD$ ${amountNum.toFixed(0)}`;
  }
}
