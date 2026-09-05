import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useCreateUser } from "@/api/hooks/useCreateUser";
import type { AdminRole } from "@/api/types";
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

type CreateUserDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const EMPTY_FORM = { email: "", name: "", phone: "", role: "DISPATCHER" as AdminRole };

export function CreateUserDialog({
  open,
  onOpenChange,
}: CreateUserDialogProps) {
  const { t } = useTranslation();
  const { adminUser } = useAuth();
  const { mutate: createUser, isPending, error } = useCreateUser();

  const [formData, setFormData] = useState(EMPTY_FORM);

  // Phase A's hierarchy, mirrored client-side: an ordinary Admin never sees
  // "Admin" as an option in the first place, rather than seeing it and
  // hitting a 403 - the backend remains the authoritative gate regardless
  // (see adminUserManagementPermissions.ts's header comment).
  const roleOptions = adminUser ? assignableRoles(adminUser) : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createUser(formData, {
      onSuccess: () => {
        notify(`Invitation sent to ${formData.email}.`, { type: "success" });
        onOpenChange(false);
        setFormData(EMPTY_FORM);
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
      setFormData(EMPTY_FORM);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {t("users.createUser", "Add User")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormGroup>
            <FormLabel htmlFor="name">{t("users.form.name", "Full Name")}</FormLabel>
            <FormInput
              id="name"
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
            <FormLabel htmlFor="email">
              {t("users.form.email", "Email")}
            </FormLabel>
            <FormInput
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
              disabled={isPending}
            />
          </FormGroup>

          <FormGroup>
            <FormLabel htmlFor="phone">
              {t("users.form.phone", "Phone")}
            </FormLabel>
            <FormInput
              id="phone"
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
            <FormLabel htmlFor="role">{t("users.form.role", "Role")}</FormLabel>
            <Select
              value={formData.role}
              onValueChange={(value) =>
                setFormData({ ...formData, role: value as AdminRole })
              }
              disabled={isPending}
            >
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
              {ROLE_DESCRIPTIONS[formData.role]}
            </Body>
          </FormGroup>

          <p className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
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
