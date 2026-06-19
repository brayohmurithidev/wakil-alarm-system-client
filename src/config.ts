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
    apiUrl: "https://wakil-alarm-api.fazilabs.com",
  },
  production: {
    environment: "production",
    apiUrl: "https://api-production.wakilsecurity.com",
  },
};

const environment =
  (import.meta.env.VITE_ENVIRONMENT as Environment) ?? "production";
const { apiUrl } = configs[environment];

const apiKey = import.meta.env.VITE_API_KEY || "";

export { apiKey, apiUrl, environment };
export type { Environment };
