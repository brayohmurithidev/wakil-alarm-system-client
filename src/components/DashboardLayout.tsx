import { Menu } from "lucide-react";
import { useState } from "react";

import wakilGoldLogo from "@/assets/wakil-gold.png";
import { Button } from "@/components/ui";

import { Sidebar } from "./Sidebar";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-border p-4 lg:hidden">
          <img src={wakilGoldLogo} alt="Wakil" className="h-8 w-auto" />
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <div>{children}</div>
        </main>
      </div>
    </div>
  );
}
