import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type DecimalFormatterOptions = {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  fallback?: string;
};

const defaultFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2
});

export function formatDecimal(
  value: number | null | undefined,
  options?: DecimalFormatterOptions
) {
  if (!Number.isFinite(value ?? NaN)) {
    return options?.fallback ?? "—";
  }
  const { minimumFractionDigits, maximumFractionDigits } = options ?? {};
  if (minimumFractionDigits === undefined && maximumFractionDigits === undefined) {
    return defaultFormatter.format(value as number);
  }
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: minimumFractionDigits ?? 0,
    maximumFractionDigits: maximumFractionDigits ?? Math.max(0, minimumFractionDigits ?? 2)
  }).format(value as number);
}

export function buildWebSocketUrl(base: string, path: string): string {
  const url = new URL(path, base);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  return url.toString();
}
