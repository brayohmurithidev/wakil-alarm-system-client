import type { ReactNode } from "react";

import { Heading } from "@/components/ui";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export function PageHeader({ title, icon, actions, className }: PageHeaderProps) {
  return (
    <header className={cn("py-4 sm:py-8", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-white">
          {icon}
          <Heading size="xxl" className="text-2xl sm:text-3xl">
            {title}
          </Heading>
        </div>
        {actions}
      </div>
    </header>
  );
}
