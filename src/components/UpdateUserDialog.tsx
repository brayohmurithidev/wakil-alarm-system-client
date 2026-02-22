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
  FormSelect,
} from "@/components/FormGroup/FormGroup";
import { Button } from "@/components/ui";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog/dialog";

type UpdateUserDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AdminUser | null;
};

type UpdateUserFormData = {
  email: string;
  password: string;
  name: string;
  phone: string;
  role: AdminRole;
  isActive: boolean;
};

export function UpdateUserDialog({
  open,
  onOpenChange,
  user,
}: UpdateUserDialogProps) {
  const { t } = useTranslation();
  const { mutate: updateUser, isPending, error } = useUpdateUser();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<UpdateUserFormData>({
    defaultValues: {
      email: "",
      password: "",
      name: "",
      phone: "",
      role: "DISPATCHER",
      isActive: true,
    },
  });

  const roleOptions = [
    { value: "DISPATCHER", label: "Dispatcher" },
    { value: "SUPERVISOR", label: "Supervisor" },
    { value: "ADMIN", label: "Admin" },
  ];

  useEffect(() => {
    if (user && open) {
      reset({
        email: user.email,
        password: "",
        name: user.name,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
      });
    }
  }, [user, open, reset]);

  const onSubmit = (data: UpdateUserFormData) => {
    if (!user) return;

    const updateData: {
      id: string;
      email: string;
      name: string;
      phone: string;
      role: AdminRole;
      isActive: boolean;
      password?: string;
    } = {
      id: user.id,
      email: data.email,
      name: data.name,
      phone: data.phone,
      role: data.role,
      isActive: data.isActive,
    };

    if (data.password) {
      updateData.password = data.password;
    }

    updateUser(updateData, {
      onSuccess: () => {
        notify(t("users.form.updateSuccess", "User updated successfully!"), {
          type: "success",
        });
        onOpenChange(false);
        reset({
          email: data.email,
          name: data.name,
          phone: data.phone,
          role: data.role,
          isActive: data.isActive,
          password: "",
        });
      },
      onError: (error: any) => {
        notify(
          error?.response?.data?.error ||
            t("users.form.updateError", "Failed to update user"),
          { type: "error" },
        );
      },
    });
  };

  const handleClose = () => {
    if (!isPending) {
      onOpenChange(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="">
        <DialogHeader>
          <DialogTitle className="text-xl text-gray-200">
            {t("users.updateUser", "Update User")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormGroup>
            <FormLabel htmlFor="name">{t("users.form.name", "Name")}</FormLabel>
            <FormInput
              id="name"
              type="text"
              {...register("name", {
                required: t("users.form.nameRequired", "Name is required"),
              })}
              disabled={isPending}
            />
            {errors.name && <FormError>{errors.name.message}</FormError>}
          </FormGroup>

          <FormGroup>
            <FormLabel htmlFor="email">
              {t("users.form.email", "Email")}
            </FormLabel>
            <FormInput
              id="email"
              type="email"
              {...register("email", {
                required: t("users.form.emailRequired", "Email is required"),
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: t(
                    "users.form.emailInvalid",
                    "Invalid email address",
                  ),
                },
              })}
              disabled={isPending}
            />
            {errors.email && <FormError>{errors.email.message}</FormError>}
          </FormGroup>

          <FormGroup>
            <FormLabel htmlFor="phone">
              {t("users.form.phone", "Phone")}
            </FormLabel>
            <FormInput
              id="phone"
              type="tel"
              {...register("phone", {
                required: t("users.form.phoneRequired", "Phone is required"),
              })}
              disabled={isPending}
            />
            {errors.phone && <FormError>{errors.phone.message}</FormError>}
          </FormGroup>

          <FormGroup>
            <FormLabel htmlFor="password">
              {t("users.form.password", "Password")}{" "}
              {t("users.form.optional", "(Optional)")}
            </FormLabel>
            <FormInput
              id="password"
              type="password"
              {...register("password", {
                minLength: {
                  value: 6,
                  message: t(
                    "users.form.passwordMinLength",
                    "Password must be at least 6 characters",
                  ),
                },
              })}
              disabled={isPending}
              placeholder={t(
                "users.form.passwordPlaceholder",
                "Leave blank to keep current",
              )}
            />
            {errors.password && (
              <FormError>{errors.password.message}</FormError>
            )}
          </FormGroup>

          <FormGroup>
            <FormLabel htmlFor="role">{t("users.form.role", "Role")}</FormLabel>
            <Controller
              name="role"
              control={control}
              rules={{
                required: t("users.form.roleRequired", "Role is required"),
              }}
              render={({ field }) => (
                <FormSelect
                  id="role"
                  value={roleOptions.find((opt) => opt.value === field.value)}
                  onChange={(option) => {
                    if (option && "value" in option) {
                      field.onChange(option.value);
                    }
                  }}
                  options={roleOptions}
                  isDisabled={isPending}
                />
              )}
            />
            {errors.role && <FormError>{errors.role.message}</FormError>}
          </FormGroup>

          <FormGroup>
            <FormLabel htmlFor="isActive">
              {t("users.form.status", "Status")}
            </FormLabel>
            <Controller
              name="isActive"
              control={control}
              rules={{
                required: t("users.form.statusRequired", "Status is required"),
              }}
              render={({ field }) => (
                <FormSelect
                  id="isActive"
                  value={
                    field.value
                      ? { value: true, label: "Active" }
                      : { value: false, label: "Inactive" }
                  }
                  onChange={(option) => {
                    if (option && "value" in option) {
                      field.onChange(option.value);
                    }
                  }}
                  options={[
                    { value: true, label: "Active" },
                    { value: false, label: "Inactive" },
                  ]}
                  isDisabled={isPending}
                />
              )}
            />
            {errors.isActive && (
              <FormError>{errors.isActive.message}</FormError>
            )}
          </FormGroup>

          {error && (
            <FormError>
              {(error as any)?.response?.data?.error ||
                t("users.form.updateError", "Failed to update user")}
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
              {t("users.form.update", "Update User")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
