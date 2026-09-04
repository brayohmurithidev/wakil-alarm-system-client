import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";

import { useActivateAccount } from "@/api/hooks/useActivateAccount";
import wakilGoldLogo from "@/assets/wakil-wordmark-white.png";
import { notify } from "@/components/Alert/notify";
import {
  Body,
  Button,
  Field,
  FieldError,
  FieldLabel,
  Heading,
  Input,
} from "@/components/ui";

// Deliberately the smallest functional screen for Phase C - this exists
// only to make the activation lifecycle testable end to end, not as the
// broader User Management UI work. See the Phase C report's "Frontend
// compatibility changes" section.
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

export function ActivateAccount() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { mutate: activateAccount, isPending, error } = useActivateAccount();

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
    activateAccount(
      { token, password: data.password },
      {
        onSuccess: () => {
          notify(
            t("activateAccount.notifySuccess", "Account activated! You can now log in."),
            { type: "success" },
          );
          navigate("/login");
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
              {t("activateAccount.title", "Activate Your Account")}
            </Heading>
            <Body className="text-muted-foreground text-center mb-6">
              {t(
                "activateAccount.subtitle",
                "Choose a password to finish setting up your Control Center account",
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
                      "Failed to activate your account. The link may have expired."}
                  </Body>
                  <Body size="sm" className="text-destructive mt-1">
                    {t(
                      "activateAccount.requestNew",
                      "Ask an administrator to resend your invitation.",
                    )}
                  </Body>
                </div>
              )}

              <Field>
                <FieldLabel htmlFor="password">
                  {t("activateAccount.password", "Password")}
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
                  {t("activateAccount.confirmPassword", "Confirm Password")}
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
                  ? t("activateAccount.activating", "Activating...")
                  : t("activateAccount.activate", "Activate Account")}
              </Button>

              <Link to="/login" className="block text-center">
                <Body
                  size="sm"
                  className="text-muted-foreground hover:text-foreground"
                >
                  {t("activateAccount.backToLogin", "Back to Login")}
                </Body>
              </Link>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
