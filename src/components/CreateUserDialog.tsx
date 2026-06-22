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
import { Button } from "@/components/ui";
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

type CreateUserDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateUserDialog({
  open,
  onOpenChange,
}: CreateUserDialogProps) {
  const { t } = useTranslation();
  const { mutate: createUser, isPending, error } = useCreateUser();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    phone: "",
    role: "DISPATCHER" as AdminRole,
  });

  const roleOptions = [
    { value: "DISPATCHER", label: "Dispatcher" },
    { value: "SUPERVISOR", label: "Supervisor" },
    { value: "ADMIN", label: "Admin" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createUser(formData, {
      onSuccess: () => {
        notify(t("users.form.success", "User created successfully!"), {
          type: "success",
        });
        onOpenChange(false);
        setFormData({
          email: "",
          password: "",
          name: "",
          phone: "",
          role: "DISPATCHER",
        });
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
      setFormData({
        email: "",
        password: "",
        name: "",
        phone: "",
        role: "DISPATCHER",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="">
        <DialogHeader>
          <DialogTitle className="text-xl text-gray-200">
            {t("users.createUser", "Create New User")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormGroup>
            <FormLabel htmlFor="name">{t("users.form.name", "Name")}</FormLabel>
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
            <FormLabel htmlFor="password">
              {t("users.form.password", "Password")}
            </FormLabel>
            <FormInput
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
              disabled={isPending}
              minLength={6}
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
                {roleOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormGroup>

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
              {t("users.form.create", "Create User")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
