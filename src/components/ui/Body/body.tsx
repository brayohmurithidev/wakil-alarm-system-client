import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

export const bodyVariants = cva("font-normal text-foreground tracking-normal", {
  variants: {
    size: {
      sm: "text-xs leading-[20px]",
      md: "text-sm leading-[20px]",
      lg: "text-lg leading-[20px]",
    },
  },
  defaultVariants: { size: "md" },
});

type BodyElement = "p" | "span" | "div";

interface BodyProps extends VariantProps<typeof bodyVariants> {
  as?: BodyElement;
  asChild?: boolean;
  className?: string;
  children: React.ReactNode;
  testId?: string;
}

const Body = React.forwardRef<
  HTMLElement,
  BodyProps & React.HTMLAttributes<HTMLElement>
>(
  (
    {
      className,
      size,
      as = "p",
      asChild = false,
      children,
      testId = "mybBody",
      ...props
    },
    ref
  ) => {
    const Component = asChild ? Slot : as;
    return (
      <Component
        ref={ref as any}
        data-testid={testId}
        className={cn(bodyVariants({ size, className }))}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Body.displayName = "Body";
export { Body };
export default Body;
