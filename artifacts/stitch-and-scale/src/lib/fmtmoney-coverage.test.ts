import { describe, expect, it } from "vitest";
import { fmtMoney } from "./intl-pricing-lab";

/**
 * S224 coverage guard: every currency a designer can select in the Receipt
 * Lab (20 options) must render with a symbol/placement — never a bare number.
 */
const RECEIPT_CURRENCY_OPTIONS = [
  "USD", "EUR", "GBP", "CAD", "AUD", "NZD", "CHF", "SEK", "NOK", "DKK",
  "ISK", "JPY", "CNY", "KRW", "INR", "BRL", "MXN", "NGN", "KES", "ZAR",
];

describe("fmtMoney — S224 coverage over all user-selectable currencies", () => {
  it("renders a symbol or placement for every receipt-lab currency", () => {
    const expected: Record<string, string> = {
      USD: "$42.75", EUR: "€42.75", GBP: "£42.75", CAD: "$42.75", AUD: "$42.75", NZD: "$42.75",
      CHF: "CHF 42.75", SEK: "42.75 kr", NOK: "42.75 kr", DKK: "42.75 kr", ISK: "42.75 kr",
      JPY: "¥42.75", CNY: "¥42.75", KRW: "¥42.75", INR: "₹42.75", BRL: "R$ 42.75",
      MXN: "$42.75", NGN: "₦42.75", KES: "KSh 42.75", ZAR: "R 42.75",
    };
    const mismatches = RECEIPT_CURRENCY_OPTIONS.filter((c) => fmtMoney(42.75, c) !== expected[c]);
    expect(mismatches).toEqual([]);
  });

  it("renders MXN and NGN with \$ and ₦ respectively", () => {
    expect(fmtMoney(42.75, "MXN")).toBe("$42.75");
    expect(fmtMoney(42.75, "NGN")).toBe("₦42.75");
  });

  it("renders KES with the KSh placement", () => {
    expect(fmtMoney(42.75, "KES")).toBe("KSh 42.75");
  });

  it("renders ZAR with the R symbol", () => {
    expect(fmtMoney(42.75, "ZAR")).toBe("R 42.75");
  });
});
