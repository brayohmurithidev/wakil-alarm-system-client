import { useTranslation } from "react-i18next";

import { useUpdateUser } from "@/api/hooks/useUpdateUser";
import type { AdminUser } from "@/api/types";
import { notify } from "@/components/Alert/notify";
import { Button } from "@/components/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog/dialog";
import { disableConfirmationCopy } from "@/lib/adminUserManagementPermissions";

// Disable only - reactivation is not destructive (see the User Management
// UI Redesign report's "Disable/reactivate flow" section) and is triggered
// directly from the row action menu with a success toast, no confirmation
// dialog of its own.
export function DisableUserDialog({
  user,
  onOpenChange,
}: {
  user: AdminUser | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const { mutate: updateUser, isPending } = useUpdateUser();

  const close = () => onOpenChange(false);

  const confirm = () => {
    if (!user) return;
    updateUser(
      { id: user.id, isActive: false },
      {
        onSuccess: () => {
          notify(`${user.name}'s account has been disabled.`, { type: "success" });
          close();
        },
        onError: (error: any) => {
          notify(
            error?.response?.data?.error || t("users.disable.error", "Failed to disable account"),
            { type: "error" },
          );
        },
      },
    );
  };

  const copy = user ? disableConfirmationCopy(user) : null;

  return (
    <Dialog open={!!user} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{copy?.title}</DialogTitle>
          <DialogDescription>{copy?.description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="px-0 pb-0">
          <Button type="button" variant="outline" onClick={close} disabled={isPending}>
            {t("common.cancel", "Cancel")}
          </Button>
          <Button type="button" variant="destructive" onClick={confirm} disabled={isPending}>
            {isPending ? t("users.disable.disabling", "Disabling…") : t("users.disable.confirm", "Disable Account")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
