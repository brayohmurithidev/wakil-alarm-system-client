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
    apiUrl: "https://wakil-api-staging.up.railway.app",
  },
  production: {
    environment: "production",
    apiUrl: "not yet ready now",
  },
};

const environment = import.meta.env.VITE_ENVIRONMENT as Environment;
const { apiUrl } = configs[environment];

export { apiUrl, environment };
export type { Environment };
