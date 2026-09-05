import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { useCreateUser } from "@/api/hooks/useCreateUser";
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
import { useAuth } from "@/contexts/AuthContext";
import {
  assignableRoles,
  ROLE_DESCRIPTIONS,
  ROLE_LABEL,
} from "@/lib/adminUserManagementPermissions";
import {
  adminUserFormSchema,
  type AdminUserFormValues,
} from "@/lib/validation/adminUserForms";
import { PHONE_INPUT_PROPS } from "@/lib/validation/phone";

type CreateUserDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const EMPTY_FORM: AdminUserFormValues = { name: "", email: "", phone: "", role: "DISPATCHER" };

export function CreateUserDialog({
  open,
  onOpenChange,
}: CreateUserDialogProps) {
  const { t } = useTranslation();
  const { adminUser } = useAuth();
  const { mutate: createUser, isPending, error } = useCreateUser();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<AdminUserFormValues>({
    resolver: zodResolver(adminUserFormSchema),
    defaultValues: EMPTY_FORM,
  });

  // Phase A's hierarchy, mirrored client-side: an ordinary Admin never sees
  // "Admin" as an option in the first place, rather than seeing it and
  // hitting a 403 - the backend remains the authoritative gate regardless
  // (see adminUserManagementPermissions.ts's header comment).
  const roleOptions = adminUser ? assignableRoles(adminUser) : [];

  const onSubmit = (data: AdminUserFormValues) => {
    // data.phone is already normalized to canonical E.164 by
    // phoneFieldSchema's transform - this is what's actually submitted.
    createUser(data, {
      onSuccess: () => {
        notify(`Invitation sent to ${data.email}.`, { type: "success" });
        onOpenChange(false);
        reset(EMPTY_FORM);
      },
      onError: (error: any) => {
        notify(
          error?.response?.data?.error ||
            t("users.form.error", "Failed to create user"),
          { type: "error" },
        );
      },
    });
  };

  const handleClose = () => {
    if (!isPending) {
      onOpenChange(false);
      reset(EMPTY_FORM);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {t("users.createUser", "Add User")}
          </DialogTitle>
          <DialogDescription>
            {t(
              "users.createUserDescription",
              "Create a Control Center account for a new team member.",
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <FormGroup>
            <FormLabel htmlFor="name">{t("users.form.name", "Full Name")}</FormLabel>
            <FormInput id="name" type="text" {...register("name")} disabled={isPending} />
            {errors.name && <FormError>{errors.name.message}</FormError>}
          </FormGroup>

          <FormGroup>
            <FormLabel htmlFor="email">
              {t("users.form.email", "Email")}
            </FormLabel>
            <FormInput id="email" type="email" autoComplete="email" {...register("email")} disabled={isPending} />
            {errors.email && <FormError>{errors.email.message}</FormError>}
          </FormGroup>

          <FormGroup>
            <FormLabel htmlFor="phone">
              {t("users.form.phone", "Phone")}
            </FormLabel>
            <FormInput id="phone" {...PHONE_INPUT_PROPS} {...register("phone")} disabled={isPending} />
            {errors.phone && <FormError>{errors.phone.message}</FormError>}
          </FormGroup>

          <FormGroup>
            <FormLabel htmlFor="role">{t("users.form.role", "Role")}</FormLabel>
            <Controller
              name="role"
              control={control}
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
                  <Body size="sm" className="mt-2 leading-relaxed text-muted-foreground">
                    {ROLE_DESCRIPTIONS[field.value]}
                  </Body>
                </>
              )}
            />
            {errors.role && <FormError>{errors.role.message}</FormError>}
          </FormGroup>

          <p className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            {t(
              "users.form.activationNotice",
              "The user will receive an invitation to create their password and activate their account.",
            )}
          </p>

          {error && (
            <FormError>
              {(error as any)?.response?.data?.error ||
                t("users.form.error", "Failed to create user")}
            </FormError>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isPending}
            >
              {t("common.cancel", "Cancel")}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("users.form.create", "Send Invitation")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
