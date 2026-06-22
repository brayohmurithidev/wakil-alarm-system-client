import clsx from "clsx";
import { forwardRef } from "react";

import { Alert, type AlertProps } from "../Alert/Alert";

type FormLabelProps = React.HTMLProps<HTMLLabelElement> & {
  isOptional?: boolean;
  className?: string;
};

export const FormLabel: React.FC<FormLabelProps> = ({
  children,
  isOptional,
  className,
  ...props
}) => (
  <label
    className={clsx("block text-white text-sm font-semibold pb-4", className)}
    {...props}
  >
    {children}
    {isOptional && <span className="ml-2 text-gray-300">(Optional)</span>}
  </label>
);
export const FormInput = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & {
    className?: string;
    icon?: React.ReactNode;
  }
>(({ className, icon, ...props }, ref) => {
  const hasIcon = !!icon;

  return (
    <div className="relative">
      {hasIcon && (
        <div
          className={clsx(
            "pointer-events-none",
            "absolute left-3 top-1/2 -translate-y-1/2 text-white",
            "group-focus-within:text-dental-primary-P3 group-hover:text-dental-primary-P3",
          )}
        >
          {icon}
        </div>
      )}

      <input
        ref={ref}
        className={clsx(
          "w-full rounded-lg border border-gray-600 bg-card p-4 text-sm text-white placeholder:text-gray-500",
          "focus:border-gray-400 focus:outline-none",
          hasIcon && "pl-10",
          className,
        )}
        {...props}
      />
    </div>
  );
});

export const FormTextarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { className?: string }
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={clsx(
      "w-full rounded-lg border border-white p-4 text-white placeholder:text-gray-400",
      className,
    )}
    {...props}
  />
));

export const FormError = (props: AlertProps) =>
  props.children ? (
    <Alert
      type="error"
      size="sm"
      contentClassname="text-alert-error"
      data-testid="form-error"
      {...props}
    />
  ) : null;

type FormGroupProps = React.HTMLAttributes<HTMLDivElement> & {
  className?: string;
};
export const FormGroup: React.FC<FormGroupProps> = ({
  children,
  className,
  ...props
}) => (
  <div className={clsx("space-y-2", className)} {...props}>
    {children}
  </div>
);
