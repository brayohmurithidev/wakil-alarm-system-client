import type { ReactNode } from "react";

import { Heading } from "@/components/ui";

type PageHeaderProps = {
  title: string;
  icon?: ReactNode;
  actions?: ReactNode;
};

export function PageHeader({ title, icon, actions }: PageHeaderProps) {
  return (
    <header className="p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2  text-white">
          {icon}
          <Heading size="xxl" className="text-3xl">
            {title}
          </Heading>
        </div>
        {actions}
      </div>
    </header>
  );
}
