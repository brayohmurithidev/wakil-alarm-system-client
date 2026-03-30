import { Plus, ShieldUser, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useDeleteGuard } from "@/api/hooks/useDeleteGuard";
import { useGetGuards } from "@/api/hooks/useGetGuards";
import { notify } from "@/components/Alert/notify";
import { CreateGuardDialog } from "@/components/CreateGuardDialog";
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

  const { data: guards, isLoading } = useGetGuards();

  const { mutate: deleteGuard, isPending: isDeleting } = useDeleteGuard();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getActiveAlarmsCount = (guard: any) => {
    return guard.alarms?.length || 0;
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteGuard(deleteTarget.id, {
      onSuccess: () => {
        notify(t("guards.deleteSuccess", "Guard deleted successfully"), {
          type: "success",
        });
        setDeleteTarget(null);
      },
      onError: (error: any) => {
        notify(
          error?.response?.data?.error ||
            t("guards.deleteError", "Failed to deactivate guard"),
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
                      <Body className="font-medium">
                        {getActiveAlarmsCount(guard)}
                      </Body>
                    </td>
                    <td className="px-6 py-4">
                      <Body size="sm">{formatDate(guard.createdAt)}</Body>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteTarget({ id: guard.id, name: guard.name })}
                        className="border-transparent text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
              {t("guards.deleteTitle", "Delete Guard")}
            </DialogTitle>
          </DialogHeader>
          <Body>
            {t(
              "guards.deleteConfirm",
              `Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`,
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
                ? t("guards.deleting", "Deleting...")
                : t("guards.delete", "Delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
