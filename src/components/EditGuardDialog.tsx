import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { useUpdateGuard } from "@/api/hooks/useUpdateGuard";
import type { Guard } from "@/api/types";
import { notify } from "@/components/Alert/notify";
import {
  FormError,
  FormGroup,
  FormInput,
  FormLabel,
} from "@/components/FormGroup/FormGroup";
import { Button } from "@/components/ui";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog/dialog";
import {
  guardEditFormSchema,
  type GuardEditFormValues,
} from "@/lib/validation/guardForms";
import { PHONE_INPUT_PROPS } from "@/lib/validation/phone";

type EditGuardDialogProps = {
  guard: Guard | null;
  onOpenChange: (open: boolean) => void;
};

export function EditGuardDialog({ guard, onOpenChange }: EditGuardDialogProps) {
  const { t } = useTranslation();
  const { mutate: updateGuard, isPending, error, reset: resetMutation } =
    useUpdateGuard();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GuardEditFormValues>({
    resolver: zodResolver(guardEditFormSchema),
    defaultValues: { name: "", phone: "", email: "", rank: "" },
  });

  // Re-seed the form whenever a different guard is opened for editing.
  useEffect(() => {
    if (guard) {
      reset({
        name: guard.name,
        phone: guard.phone,
        email: guard.email ?? "",
        rank: guard.rank ?? "",
      });
      resetMutation();
    }
  }, [guard, reset, resetMutation]);

  const onSubmit = (data: GuardEditFormValues) => {
    if (!guard) return;
    updateGuard(
      {
        id: guard.id,
        name: data.name,
        phone: data.phone,
        email: data.email,
        rank: data.rank || undefined,
      },
      {
        onSuccess: (response) => {
          notify(response.message, { type: "success" });
          // Guard Account Phase 4 - a separate, distinctly-typed toast so
          // this reads as "one more thing to do", not part of the plain
          // success confirmation the admin might glance past.
          if (response.emailChangeNotice) {
            notify(response.emailChangeNotice, { type: "warning" });
          }
          onOpenChange(false);
        },
        onError: (err: any) => {
          notify(
            err?.response?.data?.error ||
              t("guards.form.updateError", "Failed to update guard"),
            { type: "error" },
          );
        },
      },
    );
  };

  const handleClose = () => {
    if (!isPending) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={!!guard} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-xl text-gray-200">
            {t("guards.editGuard", "Edit Guard")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FormGroup>
            <FormLabel htmlFor="edit-guard-name">
              {t("guards.form.name", "Name")}
            </FormLabel>
            <FormInput
              id="edit-guard-name"
              type="text"
              {...register("name")}
              disabled={isPending}
            />
            {errors.name && <FormError>{errors.name.message}</FormError>}
          </FormGroup>

          <FormGroup>
            <FormLabel htmlFor="edit-guard-phone">
              {t("guards.form.phone", "Phone")}
            </FormLabel>
            <FormInput
              id="edit-guard-phone"
              {...PHONE_INPUT_PROPS}
              {...register("phone")}
              disabled={isPending}
            />
            {errors.phone && <FormError>{errors.phone.message}</FormError>}
          </FormGroup>

          <FormGroup>
            <FormLabel htmlFor="edit-guard-email">
              {t("guards.form.email", "Email")}
            </FormLabel>
            <FormInput
              id="edit-guard-email"
              type="email"
              autoComplete="email"
              {...register("email")}
              disabled={isPending}
            />
            {errors.email && <FormError>{errors.email.message}</FormError>}
          </FormGroup>

          <FormGroup>
            <FormLabel htmlFor="edit-guard-rank">
              {t("guards.form.rank", "Rank")}
            </FormLabel>
            <FormInput
              id="edit-guard-rank"
              type="text"
              {...register("rank")}
              disabled={isPending}
            />
          </FormGroup>

          {/* Guard Account Phase 4 - read-only diagnostic, not an
              editable field. hasPushToken means the guard's device has an
              active push registration on file - it says nothing about
              whether they're online right now (that's guard.isConnected,
              shown elsewhere), so this is deliberately worded around
              "registered", never "online"/"active". */}
          {guard && (
            <p className="text-xs text-muted-foreground -mt-2">
              {t("guards.form.pushTokenLabel", "Guard App notifications")}:{" "}
              {guard.hasPushToken
                ? t("guards.form.pushTokenRegistered", "Registered")
                : t("guards.form.pushTokenNotRegistered", "Not registered")}
            </p>
          )}

          {error && (
            <FormError>
              {(error as any)?.response?.data?.error ||
                t("guards.form.updateError", "Failed to update guard")}
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
              {t("guards.form.saveChanges", "Save Changes")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
