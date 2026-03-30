import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";

import { useResetPassword } from "@/api/hooks/useResetPassword";
import wakilGoldLogo from "@/assets/wakil-gold.png";
import {
  Body,
  Button,
  Field,
  FieldError,
  FieldLabel,
  Heading,
  Input,
} from "@/components/ui";

const formSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof formSchema>;

export function ResetPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { mutate: resetPassword, isPending, error } = useResetPassword();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { password: "", confirmPassword: "" },
    mode: "onSubmit",
    reValidateMode: "onSubmit",
  });

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const handleSubmit = (data: FormData) => {
    resetPassword(
      { token, password: data.password },
      {
        onSuccess: () => {
          navigate("/login", {
            state: { message: "Password reset successfully. Please sign in." },
          });
        },
      },
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="p-6">
        <img src={wakilGoldLogo} alt="Wakil" className="size-40" />
      </div>
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-card rounded-lg shadow-lg p-8">
            <Heading size="xl" className="mb-2 text-center">
              {t("resetPassword.title", "Set New Password")}
            </Heading>
            <Body className="text-muted-foreground text-center mb-6">
              {t(
                "resetPassword.subtitle",
                "Enter your new password below",
              )}
            </Body>

            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4"
            >
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive rounded-md">
                  <Body size="sm" className="text-destructive">
                    {(error as any)?.response?.data?.message ||
                      "Failed to reset password. The link may have expired."}
                  </Body>
                  <Link to="/forgot-password">
                    <Body
                      size="sm"
                      className="text-destructive underline mt-1"
                    >
                      {t("resetPassword.requestNew", "Request a new link")}
                    </Body>
                  </Link>
                </div>
              )}

              <Field>
                <FieldLabel htmlFor="password">
                  {t("resetPassword.newPassword", "New Password")}
                </FieldLabel>
                <Input
                  id="password"
                  type="password"
                  {...form.register("password")}
                  placeholder="••••••••"
                  disabled={isPending}
                />
                <FieldError errors={[form.formState.errors.password]} />
              </Field>

              <Field>
                <FieldLabel htmlFor="confirmPassword">
                  {t("resetPassword.confirmPassword", "Confirm Password")}
                </FieldLabel>
                <Input
                  id="confirmPassword"
                  type="password"
                  {...form.register("confirmPassword")}
                  placeholder="••••••••"
                  disabled={isPending}
                />
                <FieldError errors={[form.formState.errors.confirmPassword]} />
              </Field>

              <Button className="w-full" disabled={isPending}>
                {isPending
                  ? t("resetPassword.resetting", "Resetting...")
                  : t("resetPassword.reset", "Reset Password")}
              </Button>

              <Link to="/login" className="block text-center">
                <Body
                  size="sm"
                  className="text-muted-foreground hover:text-foreground"
                >
                  {t("resetPassword.backToLogin", "Back to Login")}
                </Body>
              </Link>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
