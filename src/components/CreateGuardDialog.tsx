import { Loader2 } from "lucide-react";
import { useState } from "react";
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

export function CreateGuardDialog({
  open,
  onOpenChange,
}: CreateGuardDialogProps) {
  const { t } = useTranslation();
  const { mutate: createGuard, isPending, error } = useCreateGuard();

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createGuard(formData, {
      onSuccess: (data) => {
        notify(data.message, { type: "success" });
        onOpenChange(false);
        setFormData({ name: "", phone: "", email: "" });
      },
      onError: (error: any) => {
        notify(
          error?.response?.data?.error ||
            t("guards.form.error", "Failed to create guard"),
          { type: "error" },
        );
      },
    });
  };

  const handleClose = () => {
    if (!isPending) {
      onOpenChange(false);
      setFormData({ name: "", phone: "", email: "" });
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormGroup>
            <FormLabel htmlFor="guard-name">
              {t("guards.form.name", "Name")}
            </FormLabel>
            <FormInput
              id="guard-name"
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
              disabled={isPending}
            />
          </FormGroup>

          <FormGroup>
            <FormLabel htmlFor="guard-phone">
              {t("guards.form.phone", "Phone")}
            </FormLabel>
            <FormInput
              id="guard-phone"
              type="tel"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              required
              disabled={isPending}
            />
          </FormGroup>

          <FormGroup>
            <FormLabel htmlFor="guard-email">
              {t("guards.form.email", "Email")}
            </FormLabel>
            <FormInput
              id="guard-email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
              disabled={isPending}
            />
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
