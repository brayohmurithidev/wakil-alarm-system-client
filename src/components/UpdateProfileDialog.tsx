import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { useGetMe } from "@/api/hooks/useGetMe";
import { useUpdateProfile } from "@/api/hooks/useUpdateProfile";
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
import { useAuth } from "@/contexts/AuthContext";

type UpdateProfileDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type UpdateProfileFormData = {
  email: string;
  password: string;
  name: string;
  phone: string;
};

export function UpdateProfileDialog({
  open,
  onOpenChange,
}: UpdateProfileDialogProps) {
  const { t } = useTranslation();
  const { data: adminUser } = useGetMe();
  const { setAdminUser } = useAuth();
  const { mutate: updateProfile, isPending, error } = useUpdateProfile();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateProfileFormData>({
    defaultValues: {
      email: "",
      password: "",
      name: "",
      phone: "",
    },
  });

  useEffect(() => {
    if (adminUser && open) {
      reset({
        email: adminUser.email,
        password: "",
        name: adminUser.name,
        phone: adminUser.phone,
      });
    }
  }, [adminUser, open, reset]);

  const onSubmit = (data: UpdateProfileFormData) => {
    const updateData: {
      email: string;
      name: string;
      phone: string;
      password?: string;
    } = {
      email: data.email,
      name: data.name,
      phone: data.phone,
    };

    if (data.password) {
      updateData.password = data.password;
    }

    updateProfile(updateData, {
      onSuccess: (responseData) => {
        if (responseData.adminUser) {
          setAdminUser(responseData.adminUser);
        }
        notify(
          t("profile.form.updateSuccess", "Profile updated successfully!"),
          { type: "success" },
        );
        onOpenChange(false);
        reset({
          email: data.email,
          name: data.name,
          phone: data.phone,
          password: "",
        });
      },
      onError: (err: any) => {
        notify(
          err?.response?.data?.error ||
            t("profile.form.updateError", "Failed to update profile"),
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="">
        <DialogHeader>
          <DialogTitle className="text-xl text-gray-200">
            {t("profile.updateProfile", "Update Profile")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormGroup>
            <FormLabel htmlFor="name">
              {t("profile.form.name", "Name")}
            </FormLabel>
            <FormInput
              id="name"
              type="text"
              {...register("name", {
                required: t("profile.form.nameRequired", "Name is required"),
              })}
              disabled={isPending}
            />
            {errors.name && <FormError>{errors.name.message}</FormError>}
          </FormGroup>

          <FormGroup>
            <FormLabel htmlFor="email">
              {t("profile.form.email", "Email")}
            </FormLabel>
            <FormInput
              id="email"
              type="email"
              {...register("email", {
                required: t("profile.form.emailRequired", "Email is required"),
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: t(
                    "profile.form.emailInvalid",
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
              {t("profile.form.phone", "Phone")}
            </FormLabel>
            <FormInput
              id="phone"
              type="tel"
              {...register("phone", {
                required: t("profile.form.phoneRequired", "Phone is required"),
              })}
              disabled={isPending}
            />
            {errors.phone && <FormError>{errors.phone.message}</FormError>}
          </FormGroup>

          <FormGroup>
            <FormLabel htmlFor="password">
              {t("profile.form.password", "Password")}{" "}
              {t("profile.form.optional", "(Optional)")}
            </FormLabel>
            <FormInput
              id="password"
              type="password"
              {...register("password", {
                minLength: {
                  value: 6,
                  message: t(
                    "profile.form.passwordMinLength",
                    "Password must be at least 6 characters",
                  ),
                },
              })}
              disabled={isPending}
              placeholder={t(
                "profile.form.passwordPlaceholder",
                "Leave blank to keep current",
              )}
            />
            {errors.password && (
              <FormError>{errors.password.message}</FormError>
            )}
          </FormGroup>

          {error && (
            <FormError>
              {(error as any)?.response?.data?.error ||
                t("profile.form.updateError", "Failed to update profile")}
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
              {t("profile.form.update", "Update Profile")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
