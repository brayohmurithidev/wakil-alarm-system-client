type Environment = "local" | "staging" | "production";

type Config = {
  environment: Environment;
  apiUrl: string;
};

const configs: Record<Environment, Config> = {
  local: {
    environment: "local",
    apiUrl: "http://localhost:3000",
  },
  staging: {
    environment: "staging",
    apiUrl: "https://api-staging.wakilsecurity.com",
  },
  production: {
    environment: "production",
    apiUrl: "not yet ready",
  },
};

const environment =
  (import.meta.env.VITE_ENVIRONMENT as Environment) ?? "staging";
const { apiUrl } = configs[environment];

const apiKey = import.meta.env.VITE_API_KEY || "";

export { apiKey, apiUrl, environment };
export type { Environment };
