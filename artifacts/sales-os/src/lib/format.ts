const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const currencyDetailedFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat("en-US");

const compactFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatCurrency(value: number, detailed = false): string {
  if (!Number.isFinite(value)) return "$0";
  return detailed
    ? currencyDetailedFormatter.format(value)
    : currencyFormatter.format(value);
}

export function formatCompactCurrency(value: number): string {
  if (!Number.isFinite(value)) return "$0";
  return `$${compactFormatter.format(value)}`;
}

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

export function formatPercent(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

export function formatDate(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatMonthLabel(period: string): string {
  // period like "2026-04"
  const [yearStr, monthStr] = period.split("-");
  const date = new Date(Number(yearStr), Number(monthStr) - 1, 1);
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export function formatShortMonth(period: string): string {
  const [yearStr, monthStr] = period.split("-");
  const date = new Date(Number(yearStr), Number(monthStr) - 1, 1);
  return date.toLocaleDateString("en-US", { month: "short" });
}
