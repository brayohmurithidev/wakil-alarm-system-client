import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { useUpdateUser } from "@/api/hooks/useUpdateUser";
import type { AdminRole, AdminUser } from "@/api/types";
import { notify } from "@/components/Alert/notify";
import {
  FormError,
  FormGroup,
  FormInput,
  FormLabel,
} from "@/components/FormGroup/FormGroup";
import { Body, Button } from "@/components/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { UserAccountStatusBadge } from "@/components/UserAccountStatusBadge";
import { useAuth } from "@/contexts/AuthContext";
import {
  assignableRoles,
  canManageAdminUser,
  ROLE_DESCRIPTIONS,
  ROLE_LABEL,
} from "@/lib/adminUserManagementPermissions";
import { deriveAccountStatus } from "@/lib/userAccountStatus";

type UpdateUserDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AdminUser | null;
  /** Opens the dedicated, confirmed Disable-Account flow - see the User
   * Management UI Redesign report's "Edit-user flow" section for why
   * account-state changes aren't a field in this form. */
  onRequestDisable: (user: AdminUser) => void;
};

// Profile / Access / Account - deliberately not "Create User with the
// password box removed". Security-sensitive state (role, active/disabled)
// gets its own section and, for disable/reactivate, its own separately
// confirmed action - see this file's onRequestDisable prop and
// handleReactivate below.
type UpdateUserFormData = {
  email: string;
  name: string;
  phone: string;
  role: AdminRole;
};

export function UpdateUserDialog({
  open,
  onOpenChange,
  user,
  onRequestDisable,
}: UpdateUserDialogProps) {
  const { t } = useTranslation();
  const { adminUser } = useAuth();
  const { mutate: updateUser, isPending, error } = useUpdateUser();
  const reactivate = useUpdateUser();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<UpdateUserFormData>({
    defaultValues: { email: "", name: "", phone: "", role: "DISPATCHER" },
  });

  useEffect(() => {
    if (user && open) {
      reset({ email: user.email, name: user.name, phone: user.phone, role: user.role });
    }
  }, [user, open, reset]);

  const handleClose = () => {
    if (!isPending) onOpenChange(false);
  };

  if (!user) return null;

  const manageable = adminUser ? canManageAdminUser(adminUser, user) : false;
  const roleOptions = adminUser ? assignableRoles(adminUser) : [];
  const status = deriveAccountStatus(user);
  const isSelf = adminUser?.id === user.id;

  const onSubmit = (data: UpdateUserFormData) => {
    updateUser(
      { id: user.id, email: data.email, name: data.name, phone: data.phone, role: data.role },
      {
        onSuccess: () => {
          notify(t("users.form.updateSuccess", "User updated successfully!"), { type: "success" });
          onOpenChange(false);
        },
        onError: (error: any) => {
          notify(
            error?.response?.data?.error || t("users.form.updateError", "Failed to update user"),
            { type: "error" },
          );
        },
      },
    );
  };

  const handleReactivate = () => {
    reactivate.mutate(
      { id: user.id, isActive: true },
      {
        onSuccess: () => notify(`${user.name}'s account has been reactivated.`, { type: "success" }),
        onError: (error: any) =>
          notify(error?.response?.data?.error || "Failed to reactivate account", { type: "error" }),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="">
        <DialogHeader>
          <DialogTitle className="text-xl">{t("users.updateUser", "Edit User")}</DialogTitle>
          <DialogDescription>{user.name} &middot; {user.email}</DialogDescription>
        </DialogHeader>

        {!manageable ? (
          <p className="text-sm text-muted-foreground">
            {isSelf
              ? "Manage your own account from Profile settings."
              : "This account is protected and can't be managed here."}
          </p>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <section className="space-y-4">
              <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t("users.form.sectionProfile", "Profile")}
              </h3>

              <FormGroup>
                <FormLabel htmlFor="name">{t("users.form.name", "Name")}</FormLabel>
                <FormInput
                  id="name"
                  type="text"
                  {...register("name", { required: t("users.form.nameRequired", "Name is required") })}
                  disabled={isPending}
                />
                {errors.name && <FormError>{errors.name.message}</FormError>}
              </FormGroup>

              <FormGroup>
                <FormLabel htmlFor="email">{t("users.form.email", "Email")}</FormLabel>
                <FormInput
                  id="email"
                  type="email"
                  {...register("email", {
                    required: t("users.form.emailRequired", "Email is required"),
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: t("users.form.emailInvalid", "Invalid email address"),
                    },
                  })}
                  disabled={isPending}
                />
                {errors.email && <FormError>{errors.email.message}</FormError>}
              </FormGroup>

              <FormGroup>
                <FormLabel htmlFor="phone">{t("users.form.phone", "Phone")}</FormLabel>
                <FormInput
                  id="phone"
                  type="tel"
                  {...register("phone", { required: t("users.form.phoneRequired", "Phone is required") })}
                  disabled={isPending}
                />
                {errors.phone && <FormError>{errors.phone.message}</FormError>}
              </FormGroup>
            </section>

            <section className="space-y-4 border-t border-border pt-5">
              <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t("users.form.sectionAccess", "Access")}
              </h3>
              <FormGroup>
                <FormLabel htmlFor="role">{t("users.form.role", "Role")}</FormLabel>
                <Controller
                  name="role"
                  control={control}
                  rules={{ required: t("users.form.roleRequired", "Role is required") }}
                  render={({ field }) => (
                    <>
                      <Select value={field.value} onValueChange={field.onChange} disabled={isPending}>
                        <SelectTrigger id="role">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {roleOptions.map((role) => (
                            <SelectItem key={role} value={role}>
                              {ROLE_LABEL[role]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Body size="sm" className="mt-2 text-muted-foreground">
                        {ROLE_DESCRIPTIONS[field.value]}
                      </Body>
                    </>
                  )}
                />
                {errors.role && <FormError>{errors.role.message}</FormError>}
              </FormGroup>
            </section>

            <section className="space-y-3 border-t border-border pt-5">
              <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t("users.form.sectionAccount", "Account")}
              </h3>
              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-4 py-3">
                <UserAccountStatusBadge user={user} />
                {status === "disabled" ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleReactivate}
                    disabled={reactivate.isPending}
                  >
                    {reactivate.isPending ? "Reactivating…" : "Reactivate Account"}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => onRequestDisable(user)}
                  >
                    Disable Account
                  </Button>
                )}
              </div>
            </section>

            {error && (
              <FormError>
                {(error as any)?.response?.data?.error || t("users.form.updateError", "Failed to update user")}
              </FormError>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose} disabled={isPending}>
                {t("common.cancel", "Cancel")}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("users.form.update", "Save Changes")}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
