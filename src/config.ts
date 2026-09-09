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

// Root-cause audit (2026-09-09), Phase 2 - previously read directly in
// App.tsx as `import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? ""`, silently
// falling back to an empty string with no warning anywhere. That doesn't
// currently explain the reported map failure - the currently-live
// production bundle at alarm.wakilsecurity.com was fetched and inspected
// directly (it was built locally and hand-deployed to EC2, not via
// Vercel, so Vercel's own env config proves nothing about it) and does
// contain a real key - but a silently-empty key is still a real,
// previously-open failure mode: <APIProvider apiKey=""> would render
// without ever telling anyone why the map is blank.
//
// IMPORTANT: this check, like apiUrl's above, is RUNTIME, not build-time.
// `vite build` only transforms/bundles this module; it never executes it,
// so this throw is compiled into the output and only actually runs the
// moment a browser loads the bundle. Confirmed empirically: `vite build
// --mode test` (with the variable genuinely absent - no .env file, no
// shell var) still exits 0 and emits a full dist/ containing this exact
// error string, uncalled. A build with the variable missing will still
// succeed and ship; only a browser loading that bundle will ever see the
// throw. The actual build-time gate lives in scripts/validateBuildEnv.mjs
// (wired into the `build`/`build:staging` npm scripts, ahead of tsc/vite)
// - this check stays as the runtime backstop for any path that produces a
// bundle without going through that script.
const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim();

if (!googleMapsApiKey) {
  throw new Error(
      `VITE_GOOGLE_MAPS_API_KEY is not configured for the "${environment}" environment.`
  );
}

export { apiKey, apiUrl, environment, googleMapsApiKey };
export type { Environment };