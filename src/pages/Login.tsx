import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Navigate } from "react-router-dom";
import { z } from "zod";

import { useLogin } from "@/api/hooks/useLogin";
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
import { useAuth } from "@/contexts/AuthContext";

const formSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .refine((val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
      message: "Invalid email address",
    }),
  password: z.string().min(1, "Password is required"),
});

type FormData = z.infer<typeof formSchema>;

export function Login() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { mutate: login, isPending, error } = useLogin();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onSubmit",
    reValidateMode: "onSubmit",
  });

  const handleSubmit = (data: FormData) => {
    login(data, {
      onError: () => {
        // Keep form values on error
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
              {t("login.title", "Admin Login")}
            </Heading>
            <Body className="text-muted-foreground text-center mb-6">
              {t("login.subtitle", "Sign in to access the dashboard")}
            </Body>

            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4"
            >
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive rounded-md">
                  <Body size="sm" className="text-destructive">
                    {(error as any)?.response?.data?.error ||
                      "Login failed. Please try again."}
                  </Body>
                </div>
              )}

              <Field>
                <FieldLabel htmlFor="email">
                  {t("login.email", "Email")}
                </FieldLabel>
                <Input
                  id="email"
                  type="email"
                  {...form.register("email")}
                  placeholder={t("login.emailPlaceholder", "admin@example.com")}
                  disabled={isPending}
                />
                <FieldError errors={[form.formState.errors.email]} />
              </Field>

              <Field>
                <FieldLabel htmlFor="password">
                  {t("login.password", "Password")}
                </FieldLabel>
                <Input
                  id="password"
                  type="password"
                  {...form.register("password")}
                  placeholder={t("login.passwordPlaceholder", "••••••••")}
                  disabled={isPending}
                />
                <FieldError errors={[form.formState.errors.password]} />
              </Field>

              <Button className="w-full" disabled={isPending}>
                {isPending
                  ? t("login.signingIn", "Signing in...")
                  : t("login.signIn", "Sign In")}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
