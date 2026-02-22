import clsx from "clsx";
import { forwardRef } from "react";
import Select, { type Props as SelectProps } from "react-select";

import { Alert, type AlertProps } from "../Alert/Alert";

type FormLabelProps = React.HTMLProps<HTMLLabelElement> & {
  isOptional?: boolean;
  className?: string;
};

const formSelectStyles = {
  control: (provided: any, state: any) => ({
    ...provided,
    backgroundColor: "#1f2937",
    paddingTop: 0,
    paddingBottom: 0,
    borderRadius: 4,
    borderColor: state.isFocused ? "#ffffff" : "#ffffff",
    boxShadow: "none",
    cursor: "pointer",
    ":hover": {
      borderColor: state.isFocused ? "#D1CCE6" : "#D1CCE6",
    },
    fontSize: 12,
  }),
  menu: (provided: any) => ({
    ...provided,
    backgroundColor: "#1f2937",
    border: "1px solid #374151",
  }),
  menuList: (provided: any) => ({
    ...provided,
    backgroundColor: "#1f2937",
    padding: 0,
  }),
  singleValue: (provided: any) => ({
    ...provided,
    fontSize: 14,
    color: "#ffffff",
    fontWeight: 500,
  }),
  input: (provided: any) => ({
    ...provided,
    fontSize: 14,
    color: "#ffffff",
  }),
  valueContainer: (provided: any) => ({
    ...provided,
    fontSize: 14,
  }),
  placeholder: (provided: any) => ({
    ...provided,
    fontSize: 14,
    color: "#ffffff",
  }),
  option: (provided: any, state: any) => ({
    ...provided,
    fontSize: 14,
    backgroundColor: state.isSelected
      ? "#111827"
      : state.isFocused
        ? "#1f2937"
        : "#1f2937",
    color: state.isSelected ? "#ffffff" : "#ffffff",
    fontWeight: state.isSelected ? 600 : 400,
    cursor: "pointer",
    ":hover": state.isSelected
      ? {
          backgroundColor: "#111827",
        }
      : {
          backgroundColor: "#111827",
        },
  }),
};

export const FormLabel: React.FC<FormLabelProps> = ({
  children,
  isOptional,
  className,
  ...props
}) => (
  <label className={clsx("text-gray-300 pb-4", className)} {...props}>
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
          "w-full rounded-lg border-[1px] border-gray-600 bg-card p-4 text-sm text-white placeholder:text-gray-500",
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
      "w-full rounded-lg border-[1px] border-dental-primary-P5 bg-dental-neutral-N10 p-4 text-dental-neutral-N1",
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

export const FormSelect = <Option, IsMulti extends boolean = false>(
  props: SelectProps<Option, IsMulti>,
) => {
  return (
    <Select
      classNamePrefix="form-select"
      styles={formSelectStyles}
      {...props}
    />
  );
};

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
