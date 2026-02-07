import { Heading } from "@/components/ui";
import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  icon?: ReactNode;
};

export function PageHeader({ title, icon }: PageHeaderProps) {
  return (
    <header className="flex items-center gap-2 p-8 text-white">
      {icon}
      <Heading size="xxl" className="text-3xl">
        {title}
      </Heading>
    </header>
  );
}
