import { environment } from "@/config";

export type SessionClearReason =
  | "REFRESH_TOKEN_INVALID"
  | "REFRESH_TOKEN_EXPIRED"
  | "USER_LOGOUT"
  | "ACCOUNT_DISABLED";

type AuthDiagnosticDetails = Record<
  string,
  string | number | boolean | null | undefined
>;

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
