import { KeyRound, Plus, ShieldUser, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useDeleteGuard } from "@/api/hooks/useDeleteGuard";
import { useGetGuards } from "@/api/hooks/useGetGuards";
import { useResendGuardOtp } from "@/api/hooks/useResendGuardOtp";
import type { Guard } from "@/api/types";
import { notify } from "@/components/Alert/notify";
import { CreateGuardDialog } from "@/components/CreateGuardDialog";
import { GuardStatusBadge } from "@/components/GuardStatusBadge";
import { PageHeader } from "@/components/PageHeader";
import { Body, Button } from "@/components/ui";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog/dialog";

export function Guards() {
  const { t } = useTranslation();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [resendOtpTarget, setResendOtpTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const { data: guards, isLoading } = useGetGuards();

  const { mutate: deleteGuard, isPending: isDeleting } = useDeleteGuard();
  const { mutate: resendGuardOtp, isPending: isResending } =
    useResendGuardOtp();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getActiveAlarmsCount = (guard: Guard) => {
    return guard.alarms?.length || 0;
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteGuard(deleteTarget.id, {
      onSuccess: () => {
        notify(t("guards.deactivateSuccess", "Guard deactivated successfully"), {
          type: "success",
        });
        setDeleteTarget(null);
      },
      onError: (error: any) => {
        notify(
          error?.response?.data?.error ||
            t("guards.deactivateError", "Failed to deactivate guard"),
          { type: "error" },
        );
      },
    });
  };

  const handleResendOtp = () => {
    if (!resendOtpTarget) return;
    resendGuardOtp(resendOtpTarget.id, {
      onSuccess: (data) => {
        notify(data.message, { type: "success" });
        setResendOtpTarget(null);
      },
      onError: (error: any) => {
        notify(
          error?.response?.data?.error ||
            t("guards.resendOtpError", "Failed to resend login code"),
          { type: "error" },
        );
      },
    });
  };

  return (
    <div className="min-w-7xl">
      <PageHeader
        title={t("guards.title", "Guards")}
        icon={<ShieldUser size={30} />}
        actions={
          <div>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t("guards.createGuard", "Create Guard")}
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <div className="text-center py-8">
          <Body>{t("common.loading", "Loading...")}</Body>
        </div>
      ) : guards && guards.length > 0 ? (
        <div className="bg-card rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-foreground">
                    {t("guards.table.name", "Name")}
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-foreground">
                    {t("guards.table.phone", "Phone")}
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-foreground">
                    {t("guards.table.email", "Email")}
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-foreground">
                    {t("guards.table.status", "Status")}
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-foreground">
                    {t("guards.table.activeAlarms", "Active Alarms")}
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-foreground">
                    {t("guards.table.joined", "Joined")}
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-medium text-foreground">
                    {t("guards.table.actions", "Actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {guards.map((guard) => (
                  <tr key={guard.id} className="hover:bg-muted/50">
                    <td className="px-6 py-4">
                      <Body className="font-medium">{guard.name}</Body>
                    </td>
                    <td className="px-6 py-4">
                      <Body>{guard.phone}</Body>
                    </td>
                    <td className="px-6 py-4">
                      <Body size="sm">{guard.email || "-"}</Body>
                    </td>
                    <td className="px-6 py-4">
                      <GuardStatusBadge
                        isActive={guard.isActive}
                        mustChangePassword={guard.mustChangePassword}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <Body className="font-medium">
                        {getActiveAlarmsCount(guard)}
                      </Body>
                    </td>
                    <td className="px-6 py-4">
                      <Body size="sm">{formatDate(guard.createdAt)}</Body>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {guard.isActive && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setResendOtpTarget({ id: guard.id, name: guard.name })
                          }
                          className="border-transparent text-muted-foreground hover:text-foreground hover:bg-muted mr-2"
                          title={t("guards.resendOtp", "Resend login code")}
                        >
                          <KeyRound className="h-4 w-4" />
                        </Button>
                      )}
                      {guard.isActive && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteTarget({ id: guard.id, name: guard.name })}
                          className="border-transparent text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/20"
                          title={t("guards.deactivate", "Deactivate guard")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 bg-card rounded-lg">
          <Body className="text-muted-foreground">
            {t("guards.noGuards", "No guards found")}
          </Body>
        </div>
      )}

      <CreateGuardDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      <Dialog open={!!deleteTarget} onOpenChange={() => !isDeleting && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl text-gray-200">
              {t("guards.deactivateTitle", "Deactivate Guard")}
            </DialogTitle>
          </DialogHeader>
          <Body>
            {t(
              "guards.deactivateConfirm",
              `Deactivate "${deleteTarget?.name}"? They'll no longer be able to log in or be assigned to new dispatches.`,
            )}
          </Body>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
            >
              {t("common.cancel", "Cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting
                ? t("guards.deactivating", "Deactivating...")
                : t("guards.deactivate", "Deactivate")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!resendOtpTarget}
        onOpenChange={() => !isResending && setResendOtpTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl text-gray-200">
              {t("guards.resendOtpTitle", "Resend Login Code")}
            </DialogTitle>
          </DialogHeader>
          <Body>
            {t(
              "guards.resendOtpConfirm",
              `Send "${resendOtpTarget?.name}" a new login code? Their current password will stop working until they log in with the new code and set a new one.`,
            )}
          </Body>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setResendOtpTarget(null)}
              disabled={isResending}
            >
              {t("common.cancel", "Cancel")}
            </Button>
            <Button onClick={handleResendOtp} disabled={isResending}>
              {isResending
                ? t("guards.resendingOtp", "Sending...")
                : t("guards.resendOtp", "Resend Code")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
