const rawBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

if (!rawBaseUrl) {
  console.error(
    "[api] Missing VITE_API_BASE_URL. Set it in your environment or .env.production for builds."
  );
}

export const API_BASE_URL = rawBaseUrl?.replace(/\/+$/, "") ?? "";

export function requireApiBase(): string {
  if (!API_BASE_URL) {
    throw new Error(
      "VITE_API_BASE_URL is not configured. Please set it before building or running the app."
    );
  }
  return API_BASE_URL;
}
