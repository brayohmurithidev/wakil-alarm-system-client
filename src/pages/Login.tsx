import { zodResolver } from "@hookform/resolvers/zod";
import {
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  LogIn,
  Mail,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link, Navigate } from "react-router-dom";
import { z } from "zod";

import { useLogin } from "@/api/hooks/useLogin";
import loginSecurityNetwork from "@/assets/login-security-network.svg";
import wakilGoldLogo from "@/assets/wakil-wordmark-gold.png";
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
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onSubmit",
    reValidateMode: "onSubmit",
  });

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = (data: FormData) => {
    login(data, {
      onError: () => {
        // Keep form values on error
      },
    });
  };

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background text-foreground lg:h-screen lg:overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-background via-background to-card/45"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-80"
        style={{ backgroundImage: `url(${loginSecurityNetwork})` }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,var(--color-background)_100%)] opacity-70"
      />

      <div className="relative mx-auto grid min-h-screen w-full max-w-[1240px] grid-cols-1 items-center gap-8 px-5 py-7 sm:px-8 md:py-10 lg:h-full lg:grid-cols-2 lg:gap-16 lg:px-12 lg:py-8 xl:gap-20 xl:px-16">
        <section className="flex w-full max-w-[470px] min-w-0 flex-col items-start justify-center justify-self-center text-left">
          <img
            src={wakilGoldLogo}
            alt="Wakil"
            className="h-auto w-28 object-contain sm:w-32 lg:w-36 xl:w-40"
          />
          <div className="-mt-2 hidden w-full max-w-[470px] sm:block lg:-mt-3">
            <h1 className="text-foreground text-balance text-[clamp(2rem,3.15vw,3.35rem)] leading-[1.12] font-bold tracking-[-0.035em]">
              Security that stays {" "}
              <span className="text-primary">connected.</span>
            </h1>
            <p className="text-muted-foreground mt-5 max-w-[470px] text-balance text-base leading-7 xl:text-xl xl:leading-8">
              Monitor incidents, coordinate response teams, and manage
              operations from one secure dashboard.
            </p>
          </div>
        </section>

        <section className="flex w-full items-center justify-center">
          <div className="border-border bg-card/70 w-full max-w-[470px] rounded-[22px] border px-6 py-7 shadow-2xl backdrop-blur-md sm:px-10 sm:py-9 lg:px-11 lg:py-10">
            <Heading
              size="xl"
              className="text-foreground mb-2 text-center text-[28px] leading-9 tracking-[-0.02em] sm:text-[30px]"
            >
              {t("login.title", "Admin Login")}
            </Heading>
            <Body className="text-muted-foreground mb-8 text-center text-base sm:mb-9">
              {t("login.subtitle", "Sign in to access the dashboard")}
            </Body>

            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-5"
              noValidate
            >
              {error && (
                <div
                  role="alert"
                  className="rounded-lg border border-destructive/70 bg-destructive/10 p-3"
                >
                  <Body size="sm" className="text-destructive">
                    {(error as any)?.response?.data?.error ||
                      "Login failed. Please try again."}
                  </Body>
                </div>
              )}

              <Field className="gap-2.5">
                <FieldLabel
                  htmlFor="email"
                  className="text-foreground text-[15px]"
                >
                  {t("login.email", "Email")}
                </FieldLabel>
                <div className="relative">
                  <Mail
                    aria-hidden="true"
                    className="text-muted-foreground pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2"
                  />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    aria-invalid={!!form.formState.errors.email}
                    aria-describedby={
                      form.formState.errors.email ? "email-error" : undefined
                    }
                    {...form.register("email")}
                    placeholder={t(
                      "login.emailPlaceholder",
                      "admin@example.com",
                    )}
                    className="border-input bg-input/30 text-foreground placeholder:text-muted-foreground hover:border-border h-14 rounded-lg pr-4 pl-12 text-base shadow-none focus-visible:border-primary focus-visible:ring-primary/25"
                    disabled={isPending}
                  />
                </div>
                <FieldError
                  id="email-error"
                  errors={[form.formState.errors.email]}
                  className="text-destructive"
                />
              </Field>

              <Field className="gap-2.5">
                <FieldLabel
                  htmlFor="password"
                  className="text-foreground text-[15px]"
                >
                  {t("login.password", "Password")}
                </FieldLabel>
                <div className="relative">
                  <LockKeyhole
                    aria-hidden="true"
                    className="text-muted-foreground pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2"
                  />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    aria-invalid={!!form.formState.errors.password}
                    aria-describedby={
                      form.formState.errors.password
                        ? "password-error"
                        : undefined
                    }
                    {...form.register("password")}
                    placeholder={t("login.passwordPlaceholder", "••••••••")}
                    className="border-input bg-input/30 text-foreground placeholder:text-muted-foreground hover:border-border h-14 rounded-lg pr-12 pl-12 text-base shadow-none focus-visible:border-primary focus-visible:ring-primary/25"
                    disabled={isPending}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="text-muted-foreground hover:text-foreground absolute inset-y-0 right-1 flex w-11 items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset disabled:pointer-events-none disabled:opacity-50"
                    aria-label={
                      showPassword
                        ? t("login.hidePassword", "Hide password")
                        : t("login.showPassword", "Show password")
                    }
                    aria-pressed={showPassword}
                    disabled={isPending}
                  >
                    {showPassword ? (
                      <EyeOff className="size-5" aria-hidden="true" />
                    ) : (
                      <Eye className="size-5" aria-hidden="true" />
                    )}
                  </button>
                </div>
                <FieldError
                  id="password-error"
                  errors={[form.formState.errors.password]}
                  className="text-destructive"
                />
              </Field>

              <Button
                type="submit"
                className="bg-primary text-primary-foreground hover:bg-primary/90 mt-7 h-14 w-full rounded-lg text-base font-bold shadow-lg focus-visible:ring-primary/50 active:translate-y-px disabled:cursor-wait"
                disabled={isPending}
              >
                {isPending ? (
                  <LoaderCircle
                    className="size-5 animate-spin motion-reduce:animate-none"
                    aria-hidden="true"
                  />
                ) : (
                  <LogIn className="size-5" aria-hidden="true" />
                )}
                {isPending
                  ? t("login.signingIn", "Signing in...")
                  : t("login.signIn", "Sign In")}
              </Button>

              <Link
                to="/forgot-password"
                className="text-muted-foreground mx-auto block w-fit rounded-sm px-2 py-1 text-center text-sm transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {t("login.forgotPassword", "Forgot your password?")}
              </Link>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
