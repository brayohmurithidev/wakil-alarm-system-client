#!/usr/bin/env node
// Root-cause audit (2026-09-09) - build-time environment validation.
//
// config.ts already fails fast on a missing VITE_API_URL/
// VITE_GOOGLE_MAPS_API_KEY, but that check is compiled INTO the bundle and
// only actually runs once a browser loads it - confirmed empirically:
// `vite build --mode test` with the variable genuinely absent still exits
// 0 and ships a dist/ containing the error message as dead, uncalled code.
// A misconfigured build succeeds silently and only fails for the first
// real visitor.
//
// This script closes that gap by running the exact same check BEFORE
// tsc/vite ever run, using Vite's own loadEnv() - the same function Vite
// itself uses internally to resolve .env files for a given mode - rather
// than reimplementing .env-file/precedence resolution here. That's
// deliberate: duplicating Vite's env-loading semantics in a hand-rolled
// parser would drift from what `vite build` actually does the moment
// someone adds a new .env file or changes the precedence Vite itself
// uses; asking Vite for its own answer can't drift from itself.
//
// Mode resolution matches vite build's own default: no --mode flag means
// "production", exactly like invoking `vite build` directly. Pass
// --mode <name> to validate a different target (e.g. the build:staging
// script's `vite build --mode staging`).
import { loadEnv } from "vite";

const REQUIRED_VARS = ["VITE_API_URL", "VITE_GOOGLE_MAPS_API_KEY"];

function resolveMode(argv) {
  const flagIndex = argv.indexOf("--mode");
  if (flagIndex !== -1 && argv[flagIndex + 1]) return argv[flagIndex + 1];
  return "production";
}

const mode = resolveMode(process.argv.slice(2));

// Third argument "" (not the usual "VITE_" prefix filter) so this can also
// catch a required variable that was set WITHOUT the VITE_ prefix by
// mistake and report it clearly, rather than reporting a false "missing".
const env = loadEnv(mode, process.cwd(), "");

const missing = REQUIRED_VARS.filter((key) => !env[key]?.trim());

if (missing.length > 0) {
  console.error(
    `\nBuild aborted: missing required environment variable(s) for the "${mode}" mode:\n` +
      missing.map((key) => `  - ${key}`).join("\n") +
      `\n\nVite resolves these the normal way for mode "${mode}" (.env, .env.local, ` +
      `.env.${mode}, .env.${mode}.local, and real shell/CI environment variables - ` +
      `later sources override earlier ones). Set the missing value(s) in whichever of ` +
      `those is appropriate before building.\n` +
      // Never print any variable's actual value - only which names are
      // missing and which mode was checked.
      "",
  );
  process.exit(1);
}

console.log(`Build environment OK for mode "${mode}" (${REQUIRED_VARS.join(", ")} present).`);
