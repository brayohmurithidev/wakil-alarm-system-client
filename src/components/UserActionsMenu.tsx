import { KeyRound, MoreHorizontal, Pencil, RotateCcw, Send, ShieldOff } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useResendInvitation } from "@/api/hooks/useResendInvitation";
import { useSendPasswordReset } from "@/api/hooks/useSendPasswordReset";
import { useUpdateUser } from "@/api/hooks/useUpdateUser";
import type { AdminUser } from "@/api/types";
import { notify } from "@/components/Alert/notify";
import { Button } from "@/components/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu/dropdown-menu";
import { type ManagementActor,visibleUserActions } from "@/lib/adminUserManagementPermissions";

type UserActionsMenuProps = {
  actor: ManagementActor;
  target: AdminUser;
  onEdit: (user: AdminUser) => void;
  onDisable: (user: AdminUser) => void;
};

// One compact menu, built entirely from visibleUserActions() (state + actor
// authority) - see the User Management UI Redesign report's "Actor/target
// capability handling" section, and adminUserManagementPermissions.ts for
// the tested decision this only ever renders. Nothing here grants more than
// the backend allows; a stale or wrong client-side read at worst hides an
// action the API would still have permitted (annoying, safe), never the
// reverse.
export function UserActionsMenu({ actor, target, onEdit, onDisable }: UserActionsMenuProps) {
  const { t } = useTranslation();
  const resendInvitation = useResendInvitation();
  const sendPasswordReset = useSendPasswordReset();
  const { mutate: updateUser, isPending: isReactivating } = useUpdateUser();

  const actions = visibleUserActions(actor, target);

  // No action menu at all when the backend would reject every action in it
  // - a "..." button that opens to nothing is worse than no button. Instead
  // say plainly why, so "why some actions are unavailable" (this phase's
  // own goal) is answered inline rather than left as a silent gap.
  if (actions.unmanageableReason) {
    return (
      <span className="text-xs text-muted-foreground">
        {actions.unmanageableReason === "self" ? "Manage in Profile settings" : "Protected"}
      </span>
    );
  }

  const handleResend = () => {
    resendInvitation.mutate(target.id, {
      onSuccess: () => notify(`Invitation resent to ${target.email}.`, { type: "success" }),
      onError: (error: any) =>
        notify(error?.response?.data?.error || "Failed to resend invitation", { type: "error" }),
    });
  };

  const handleSendReset = () => {
    sendPasswordReset.mutate(target.id, {
      onSuccess: () => notify(`Password reset email sent to ${target.email}.`, { type: "success" }),
      onError: (error: any) =>
        notify(error?.response?.data?.error || "Failed to send password reset", { type: "error" }),
    });
  };

  const handleReactivate = () => {
    updateUser(
      { id: target.id, isActive: true },
      {
        onSuccess: () => notify(`${target.name}'s account has been reactivated.`, { type: "success" }),
        onError: (error: any) =>
          notify(error?.response?.data?.error || "Failed to reactivate account", { type: "error" }),
      },
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="icon-sm" aria-label={`Actions for ${target.name}`}>
          <MoreHorizontal size={16} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {actions.edit && (
          <DropdownMenuItem onSelect={() => onEdit(target)}>
            <Pencil /> {t("users.actions.edit", "Edit User")}
          </DropdownMenuItem>
        )}

        {actions.resendInvitation && (
          <DropdownMenuItem onSelect={handleResend} disabled={resendInvitation.isPending}>
            <Send /> {t("users.actions.resendInvitation", "Resend Invitation")}
          </DropdownMenuItem>
        )}

        {actions.sendPasswordReset && (
          <DropdownMenuItem onSelect={handleSendReset} disabled={sendPasswordReset.isPending}>
            <KeyRound /> {t("users.actions.sendPasswordReset", "Send Password Reset")}
          </DropdownMenuItem>
        )}

        {actions.reactivate && (
          <DropdownMenuItem onSelect={handleReactivate} disabled={isReactivating}>
            <RotateCcw /> {t("users.actions.reactivate", "Reactivate Account")}
          </DropdownMenuItem>
        )}

        {actions.disable && (
          <DropdownMenuItem variant="destructive" onSelect={() => onDisable(target)}>
            <ShieldOff /> {t("users.actions.disable", "Disable Account")}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
