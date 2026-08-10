import { apiUrl } from "@/config";

const HTTPS_URL = /^https:\/\//i;
const API_MEDIA_PATH = /^\/?api\//i;

/**
 * Dashboard media fields canonically contain complete public HTTPS URLs.
 * Relative API paths are accepted for backwards compatibility. Bare object
 * keys are deliberately rejected: only the owning API knows which bucket or
 * protected media route can resolve them.
 */
export function resolveMediaUrl(value?: string | null): string | null {
  const candidate = value?.trim();
  if (!candidate) return null;
  if (HTTPS_URL.test(candidate)) return candidate;
  if (!API_MEDIA_PATH.test(candidate)) return null;

  const base = apiUrl === "/" ? "" : apiUrl.replace(/\/+$/, "");
  return `${base}/${candidate.replace(/^\/+/, "")}`;
}

const reportedFailures = new Set<string>();

export function reportMediaFailureOnce(kind: string, url: string): void {
  const key = `${kind}:${url}`;
  if (reportedFailures.has(key)) return;
  reportedFailures.add(key);
  console.warn("[media]", {
    event: "MEDIA_LOAD_FAILED",
    kind,
    timestamp: new Date().toISOString(),
  });
}
