import type { AdminUser } from "@/api/types";
import { ACCOUNT_STATUS_LABEL, deriveAccountStatus, type UserAccountStatus } from "@/lib/userAccountStatus";

// Restrained by design, matching the Integrations area's status-dot
// convention (see VaktaCredentials.tsx) rather than the old rainbow-badge
// style: a colored dot plus text, not a filled pill. Success green is
// reserved for Active; Disabled is deliberately neutral, not red - red
// stays reserved for destructive actions, not a passive account state.
// Pending activation uses the primary accent, since - unlike Disabled -
// it's a state that invites an action (resend the invitation).
const DOT_AND_TEXT: Record<UserAccountStatus, string> = {
  active: "text-success",
  pending: "text-primary",
  disabled: "text-muted-foreground",
};

const DOT_FILL: Record<UserAccountStatus, string> = {
  active: "bg-success",
  pending: "bg-primary",
  disabled: "bg-muted-foreground",
};

export function UserAccountStatusBadge({ user }: { user: Pick<AdminUser, "activatedAt" | "isActive"> }) {
  const status = deriveAccountStatus(user);
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${DOT_AND_TEXT[status]}`}>
      <span className={`size-1.5 rounded-full ${DOT_FILL[status]}`} aria-hidden="true" />
      {ACCOUNT_STATUS_LABEL[status]}
    </span>
  );
}
