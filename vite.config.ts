import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig, loadEnv, type ProxyOptions } from "vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const proxyTarget = env.VITE_API_PROXY_TARGET?.trim();

  const proxyOptions: ProxyOptions | undefined = proxyTarget
    ? {
        target: proxyTarget,
        changeOrigin: true,
        secure: true,
        configure(proxy) {
          proxy.on("proxyReq", (proxyRequest) => {
            // The browser is same-origin with the local Vite server. Do not
            // forward localhost as though it were a browser origin making a
            // direct cross-origin request to staging.
            proxyRequest.removeHeader("origin");
          });

          proxy.on("proxyRes", (proxyResponse) => {
            const cookies = proxyResponse.headers["set-cookie"];
            if (!cookies) return;

            // The staging API correctly issues HTTPS-only cross-site cookies.
            // Through the local same-origin proxy, rewrite only those response
            // attributes so refresh-token flows can be tested over localhost.
            proxyResponse.headers["set-cookie"] = cookies.map((cookie) =>
              cookie
                .replace(/;\s*Secure/gi, "")
                .replace(/;\s*SameSite=None/gi, "; SameSite=Lax"),
            );
          });
        },
      }
    : undefined;

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: proxyOptions
      ? {
          proxy: {
            "/api": proxyOptions,
            "/socket.io": { ...proxyOptions, ws: true },
          },
        }
      : undefined,
  };
});
