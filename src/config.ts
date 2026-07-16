type Environment = "local" | "staging" | "production";

const environment =
    (import.meta.env.VITE_ENVIRONMENT as Environment | undefined) ??
    "production";

const apiUrl = import.meta.env.VITE_API_URL?.trim();

if (!apiUrl) {
  throw new Error(
      `VITE_API_URL is not configured for the "${environment}" environment.`
  );
}

const apiKey = import.meta.env.VITE_API_KEY?.trim() || "";

export { apiKey, apiUrl, environment };
export type { Environment };