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
    paddingTop: 0,
    paddingBottom: 0,
    borderRadius: 4,
    borderColor: state.isFocused ? "#B1A2EF" : "#EDEBF5",
    boxShadow: "none",
    cursor: "pointer",
    ":hover": {
      borderColor: state.isFocused ? "#B1A2EF" : "#EDEBF5",
    },
    fontSize: 12,
  }),
  singleValue: (provided: any) => ({
    ...provided,
    fontSize: 14,
  }),
  input: (provided: any) => ({
    ...provided,
    fontSize: 14,
  }),
  valueContainer: (provided: any) => ({
    ...provided,
    fontSize: 14,
  }),
  placeholder: (provided: any) => ({
    ...provided,
    fontSize: 14,
    color: "#AAAAAA",
  }),
  option: (provided: any, state: any) => ({
    ...provided,
    fontSize: 14,
    backgroundColor: state.isSelected
      ? "#7A69C0"
      : state.isFocused
        ? "#F3F0FF"
        : "white",
    color: state.isSelected ? "white" : "#2D2D2D",
    cursor: "pointer",
    ":hover": state.isSelected
      ? {}
      : {
          backgroundColor: "#F3F0FF",
        },
  }),
};

export const FormLabel: React.FC<FormLabelProps> = ({
  children,
  isOptional,
  className,
  ...props
}) => (
  <label className={clsx("", className)} {...props}>
    {children}
    {isOptional && <span className="ml-2 text-gray-500">(Optional)</span>}
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
            "absolute left-3 top-1/2 -translate-y-1/2 text-dental-neutral-N6",
            "group-focus-within:text-dental-primary-P3 group-hover:text-dental-primary-P3",
          )}
        >
          {icon}
        </div>
      )}

      <input
        ref={ref}
        className={clsx(
          "w-full rounded-lg border-[1px] border-dental-primary-P5 bg-dental-neutral-N10 p-4 text-sm text-dental-neutral-N1 placeholder:text-dental-neutral-N6",
          "focus:border-dental-primary-P3 focus:outline-none",
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
