import { environment } from "@/config";

// Session Diagnostics Phase - REFRESH_TOKEN_REUSE_DETECTED added. Deliberately
// spelled identically to the API's own ADMIN_REFRESH_ERROR_CODE.REFRESH_TOKEN_REUSE_DETECTED
// (src/lib/adminTokens.ts, API repo) so a server-sent `code` can be used as
// this value directly - see classifyRefreshFailure in axios.ts. This is the
// one SessionClearReason the Control Center session-reliability audit
// specifically needed distinguishable: previously the backend returned the
// identical 401 body for "this token is unknown/invalid" and "this token
// WAS valid but was just replayed after rotation, and every session for the
// account has now been revoked" - the second one is far more consequential
// (it silently ends every other device's session too) and deserves its own
// category in diagnostics rather than reading as an ordinary invalid token.
export type SessionClearReason =
  | "REFRESH_TOKEN_INVALID"
  | "REFRESH_TOKEN_EXPIRED"
  | "REFRESH_TOKEN_REUSE_DETECTED"
  | "USER_LOGOUT"
  | "ACCOUNT_DISABLED"
  | "SESSION_MISSING";

// The canonical reason enum for AUTH_LOGOUT_TRIGGERED diagnostics.
// SessionClearReason is more granular (it also drives which localStorage
// keys/UI messaging apply); this collapses it onto the categories that
// matter when auditing WHY a logout happened. ACCOUNT_DISABLED folds into
// "refresh_invalid" here (the raw SessionClearReason is still logged
// alongside it via `rawReason`) since both mean "this session can never be
// resumed by refreshing" — the distinction this enum exists to capture.
// REFRESH_TOKEN_REUSE_DETECTED gets its own category rather than folding
// into "refresh_invalid" - collapsing it back in would defeat the entire
// point of adding it.
export type LogoutTriggerReason =
  | "explicit_logout"
  | "refresh_invalid"
  | "refresh_expired"
  | "refresh_reuse_detected"
  | "session_missing";

export function toLogoutTriggerReason(
  reason: SessionClearReason,
): LogoutTriggerReason {
  switch (reason) {
    case "USER_LOGOUT":
      return "explicit_logout";
    case "REFRESH_TOKEN_EXPIRED":
      return "refresh_expired";
    case "REFRESH_TOKEN_REUSE_DETECTED":
      return "refresh_reuse_detected";
    case "SESSION_MISSING":
      return "session_missing";
    case "REFRESH_TOKEN_INVALID":
    case "ACCOUNT_DISABLED":
      return "refresh_invalid";
  }
}

// Best-effort, no-verification decode of a JWT's expiry — used only to tell
// diagnostics apart (was this 401 the access token genuinely aging out on
// schedule, or something else?). Never decodes/logs anything but `exp`.
export function decodeJwtExpiryMs(token: string): number | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = JSON.parse(atob(normalized));
    return typeof json.exp === "number" ? json.exp * 1000 : null;
  } catch {
    return null;
  }
}

type AuthDiagnosticDetails = Record<
  string,
  string | number | boolean | null | undefined
>;

// The only place auth flow should log — dev-console-only, never wired to
// Sentry/network. Never pass a raw token, password, OTP, or Authorization
// header value in `details`; accessTokenPresent is a boolean precisely so
// callers never need to.
export function authDiagnostic(
  event: string,
  details: AuthDiagnosticDetails = {},
): void {
  if (environment === "production") return;

  console.info("[auth]", {
    event,
    timestamp: new Date().toISOString(),
    accessTokenPresent: Boolean(localStorage.getItem("token")),
    ...details,
  });
}
