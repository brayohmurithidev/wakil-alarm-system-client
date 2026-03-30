import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { z } from "zod";

import { useForgotPassword } from "@/api/hooks/useForgotPassword";
import { notify } from "@/components/Alert/notify";
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

const formSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .refine((val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
      message: "Invalid email address",
    }),
});

type FormData = z.infer<typeof formSchema>;

export function ForgotPassword() {
  const { t } = useTranslation();
  const [submitted, setSubmitted] = useState(false);
  const { mutate: forgotPassword, isPending } = useForgotPassword();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "" },
    mode: "onSubmit",
    reValidateMode: "onSubmit",
  });

  const handleSubmit = (data: FormData) => {
    forgotPassword(data, {
      onSuccess: () => {
        setSubmitted(true);
        notify(t("forgotPassword.notifySuccess", "Reset link sent! Check your inbox."), { type: "success" });
      },
      onError: () => {
        notify(t("forgotPassword.notifyError", "Something went wrong. Please try again."), { type: "error" });
      },
    });
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
              {t("forgotPassword.title", "Forgot Password")}
            </Heading>
            <Body className="text-muted-foreground text-center mb-6">
              {t(
                "forgotPassword.subtitle",
                "Enter your email to receive a reset link",
              )}
            </Body>

            {submitted ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                  <Body size="sm" className="text-green-800">
                    {t(
                      "forgotPassword.success",
                      "If an account with that email exists, a password reset link has been sent. Check your inbox.",
                    )}
                  </Body>
                </div>
                <Link to="/login">
                  <Button variant="outline" className="w-full">
                    {t("forgotPassword.backToLogin", "Back to Login")}
                  </Button>
                </Link>
              </div>
            ) : (
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-4"
              >
                <Field>
                  <FieldLabel htmlFor="email">
                    {t("forgotPassword.email", "Email")}
                  </FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    {...form.register("email")}
                    placeholder={t(
                      "forgotPassword.emailPlaceholder",
                      "admin@example.com",
                    )}
                    disabled={isPending}
                  />
                  <FieldError errors={[form.formState.errors.email]} />
                </Field>

                <Button className="w-full" disabled={isPending}>
                  {isPending
                    ? t("forgotPassword.sending", "Sending...")
                    : t("forgotPassword.send", "Send Reset Link")}
                </Button>

                <Link to="/login" className="block text-center">
                  <Body
                    size="sm"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {t("forgotPassword.backToLogin", "Back to Login")}
                  </Body>
                </Link>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
