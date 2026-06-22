import { KeyRound, Plus, Search, ShieldUser, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { useDeleteGuard } from "@/api/hooks/useDeleteGuard";
import { useGetGuards } from "@/api/hooks/useGetGuards";
import { useResendGuardOtp } from "@/api/hooks/useResendGuardOtp";
import type { Guard } from "@/api/types";
import { notify } from "@/components/Alert/notify";
import { CreateGuardDialog } from "@/components/CreateGuardDialog";
import { GuardStatusBadge } from "@/components/GuardStatusBadge";
import { PageHeader } from "@/components/PageHeader";
import { Body, Button, Input } from "@/components/ui";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const GUARD_TABLE_COLUMNS = 7;

export function Guards() {
  const { t } = useTranslation();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [resendOtpTarget, setResendOtpTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const { data: guards, isLoading } = useGetGuards();

  const filteredGuards = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return guards;
    return guards?.filter((guard) =>
      [guard.name, guard.phone, guard.email]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(query)),
    );
  }, [guards, search]);

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

      <div className="relative mb-4 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t(
            "guards.searchPlaceholder",
            "Search by name, phone, or email",
          )}
          className="pl-9"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={t("common.clear", "Clear")}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="bg-card rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted hover:bg-muted">
                <TableHead className="px-6 py-3">
                  {t("guards.table.name", "Name")}
                </TableHead>
                <TableHead className="px-6 py-3">
                  {t("guards.table.phone", "Phone")}
                </TableHead>
                <TableHead className="px-6 py-3">
                  {t("guards.table.email", "Email")}
                </TableHead>
                <TableHead className="px-6 py-3">
                  {t("guards.table.status", "Status")}
                </TableHead>
                <TableHead className="px-6 py-3">
                  {t("guards.table.activeAlarms", "Active Alarms")}
                </TableHead>
                <TableHead className="px-6 py-3">
                  {t("guards.table.joined", "Joined")}
                </TableHead>
                <TableHead className="px-6 py-3 text-right">
                  {t("guards.table.actions", "Actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: GUARD_TABLE_COLUMNS }).map(
                      (_, col) => (
                        <TableCell key={col} className="px-6 py-4">
                          <Skeleton className="h-4 w-full max-w-32" />
                        </TableCell>
                      ),
                    )}
                  </TableRow>
                ))
              ) : filteredGuards && filteredGuards.length > 0 ? (
                filteredGuards.map((guard) => (
                  <TableRow key={guard.id}>
                    <TableCell className="px-6 py-4">
                      <Body className="font-medium">{guard.name}</Body>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <Body>{guard.phone}</Body>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <Body size="sm">{guard.email || "-"}</Body>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <GuardStatusBadge
                        isActive={guard.isActive}
                        mustChangePassword={guard.mustChangePassword}
                      />
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <Body className="font-medium">
                        {getActiveAlarmsCount(guard)}
                      </Body>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <Body size="sm">{formatDate(guard.createdAt)}</Body>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right">
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
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={GUARD_TABLE_COLUMNS}
                    className="px-6 py-8 text-center"
                  >
                    <Body className="text-muted-foreground">
                      {search
                        ? t(
                            "guards.noSearchResults",
                            "No guards match your search",
                          )
                        : t("guards.noGuards", "No guards found")}
                    </Body>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

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
