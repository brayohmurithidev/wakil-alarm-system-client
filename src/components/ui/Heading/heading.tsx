import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

export const headingVariants = cva("font-bold text-foreground ", {
  variants: {
    size: {
      xxl: "text-[24px] leading-[28px]",
      xl: "text-[20px] leading-[24px]",
      lg: "text-[16px] leading-[20px]",
      md: "text-[14px] leading-[20px]",
      sm: "text-[10px] leading-[20px]",
    },
  },
  defaultVariants: { size: "xxl" },
});

type HeadingElement = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

interface HeadingProps extends VariantProps<typeof headingVariants> {
  as?: HeadingElement;
  asChild?: boolean;
  className?: string;
  children: React.ReactNode;
  testId?: string;
}

const getDefaultHeadingElement = (size?: string | null): HeadingElement => {
  switch (size) {
    case "xxl":
      return "h1";
    case "xl":
      return "h1";
    case "lg":
      return "h2";
    case "md":
      return "h3";
    case "sm":
      return "h4";
    default:
      return "h2";
  }
};

const Heading = React.forwardRef<
  HTMLHeadingElement,
  HeadingProps & React.HTMLAttributes<HTMLHeadingElement>
>(
  (
    {
      className,
      size,
      as,
      asChild = false,
      children,
      testId = "mybHeading",
      ...props
    },
    ref
  ) => {
    const Component = asChild ? Slot : as || getDefaultHeadingElement(size);
    return (
      <Component
        ref={ref}
        data-testid={testId}
        className={cn(headingVariants({ size, className }))}
        {...props}
      >
        {children}
      </Component>
    );
  }
);
Heading.displayName = "Heading";
export { Heading };
export default Heading;
