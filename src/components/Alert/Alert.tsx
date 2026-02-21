import clsx from "clsx";
import { CheckCircle, Info, OctagonAlert, TriangleAlert } from "lucide-react";
import type React from "react";
import { forwardRef } from "react";

type AlertType = "error" | "neutral" | "success" | "warning";

type Size = "md" | "sm";

type AlertProps = React.HTMLAttributes<HTMLDivElement> & {
  type?: AlertType;
  size?: Size;
  contentClassname?: string;
  "data-testid"?: string;
};

const Alert = forwardRef(
  (
    {
      children,
      type = "neutral",
      size = "md",
      className,
      contentClassname,
      "data-testid": dataTestId,
    }: AlertProps,
    ref: React.Ref<HTMLDivElement>,
  ) => {
    const Icon = {
      success: CheckCircle,
      error: OctagonAlert,
      warning: TriangleAlert,
      neutral: Info,
    }[type];

    const backgroundColor =
      type === "success" ? "bg-success-light" : " bg-error-light";

    return (
      <div
        ref={ref}
        className={clsx("flex", backgroundColor, className, {
          "gap-1 text-sm": size === "sm",
          "gap-2": size === "md",
        })}
        data-testid={dataTestId}
        role="alert"
      >
        <div className="pt-0.5">
          <Icon
            className={clsx({
              "text-alert-success": type === "success",
              "text-alert-warning": type === "warning",
              "text-alert-error": type === "error",
              "h-5 w-5": size === "md",
              "h-4 w-4": size === "sm",
            })}
          />
        </div>
        <span className={contentClassname}>{children}</span>
      </div>
    );
  },
);

export { Alert };
export type { AlertProps, AlertType };
