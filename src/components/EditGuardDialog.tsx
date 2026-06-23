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

type EditGuardDialogProps = {
  guard: Guard | null;
  onOpenChange: (open: boolean) => void;
};

type EditGuardFormData = {
  name: string;
  phone: string;
  email: string;
  rank: string;
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
  } = useForm<EditGuardFormData>({
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

  const onSubmit = (data: EditGuardFormData) => {
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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormGroup>
            <FormLabel htmlFor="edit-guard-name">
              {t("guards.form.name", "Name")}
            </FormLabel>
            <FormInput
              id="edit-guard-name"
              type="text"
              {...register("name", {
                required: t("guards.form.nameRequired", "Name is required"),
              })}
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
              type="tel"
              {...register("phone", {
                required: t("guards.form.phoneRequired", "Phone is required"),
                pattern: {
                  value: /^\+?[0-9\s-]{7,15}$/,
                  message: t(
                    "guards.form.phoneInvalid",
                    "Invalid phone number",
                  ),
                },
              })}
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
              {...register("email", {
                required: t("guards.form.emailRequired", "Email is required"),
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: t(
                    "guards.form.emailInvalid",
                    "Invalid email address",
                  ),
                },
              })}
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
