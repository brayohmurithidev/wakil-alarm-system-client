import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { useCreateGuard } from "@/api/hooks/useCreateGuard";
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

type CreateGuardDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type CreateGuardFormData = {
  name: string;
  phone: string;
  email: string;
};

export function CreateGuardDialog({
  open,
  onOpenChange,
}: CreateGuardDialogProps) {
  const { t } = useTranslation();
  const { mutate: createGuard, isPending, error } = useCreateGuard();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateGuardFormData>({
    defaultValues: { name: "", phone: "", email: "" },
  });

  const onSubmit = (data: CreateGuardFormData) => {
    createGuard(data, {
      onSuccess: (response) => {
        notify(response.message, { type: "success" });
        onOpenChange(false);
        reset();
      },
      onError: (err: any) => {
        notify(
          err?.response?.data?.error ||
            t("guards.form.error", "Failed to create guard"),
          { type: "error" },
        );
      },
    });
  };

  const handleClose = () => {
    if (!isPending) {
      onOpenChange(false);
      reset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-xl text-gray-200">
            {t("guards.createGuard", "Create New Guard")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormGroup>
            <FormLabel htmlFor="guard-name">
              {t("guards.form.name", "Name")}
            </FormLabel>
            <FormInput
              id="guard-name"
              type="text"
              {...register("name", {
                required: t("guards.form.nameRequired", "Name is required"),
              })}
              disabled={isPending}
            />
            {errors.name && <FormError>{errors.name.message}</FormError>}
          </FormGroup>

          <FormGroup>
            <FormLabel htmlFor="guard-phone">
              {t("guards.form.phone", "Phone")}
            </FormLabel>
            <FormInput
              id="guard-phone"
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
            <FormLabel htmlFor="guard-email">
              {t("guards.form.email", "Email")}
            </FormLabel>
            <FormInput
              id="guard-email"
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
            <p className="text-xs text-muted-foreground mt-1">
              {t(
                "guards.form.emailHint",
                "The guard's login code is sent to this address.",
              )}
            </p>
          </FormGroup>

          {error && (
            <FormError>
              {(error as any)?.response?.data?.error ||
                t("guards.form.error", "Failed to create guard")}
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
              {t("guards.form.create", "Create Guard")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
