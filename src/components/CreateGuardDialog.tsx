import { zodResolver } from "@hookform/resolvers/zod";
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
import {
  guardCreateFormSchema,
  type GuardCreateFormValues,
} from "@/lib/validation/guardForms";
import { PHONE_INPUT_PROPS } from "@/lib/validation/phone";

type CreateGuardDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const EMPTY_FORM: GuardCreateFormValues = { name: "", phone: "", email: "" };

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
  } = useForm<GuardCreateFormValues>({
    resolver: zodResolver(guardCreateFormSchema),
    defaultValues: EMPTY_FORM,
  });

  const onSubmit = (data: GuardCreateFormValues) => {
    // data.phone is already normalized E.164 (phoneFieldSchema's
    // transform) and data.email already trimmed+lowercased
    // (guardEmailSchema) - what's submitted is exactly what the backend
    // would itself normalize to (lib/guardIdentity.ts, API repo).
    createGuard(data, {
      onSuccess: (response) => {
        notify(response.message, { type: "success" });
        onOpenChange(false);
        reset(EMPTY_FORM);
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
      reset(EMPTY_FORM);
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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FormGroup>
            <FormLabel htmlFor="guard-name">
              {t("guards.form.name", "Name")}
            </FormLabel>
            <FormInput
              id="guard-name"
              type="text"
              {...register("name")}
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
              {...PHONE_INPUT_PROPS}
              {...register("phone")}
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
              autoComplete="email"
              {...register("email")}
              disabled={isPending}
            />
            {errors.email && <FormError>{errors.email.message}</FormError>}
            <p className="text-xs text-muted-foreground mt-1">
              {t(
                "guards.form.emailHint",
                "The guard's temporary login code is delivered by email to this address and by SMS to the phone number above.",
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
