import { History, ShieldUser, User, Users, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";

import wakilGoldLogo from "@/assets/wakil-gold.png";
import { Body, Button } from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";

import { AlarmIcon } from "./icons/AlarmIcon";
import { DashboardIcon } from "./icons/DashboardIcon";

type SidebarProps = {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
};

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const { adminUser, logout } = useAuth();

  const navItems = [
    {
      label: t("sidebar.dashboard", "Dashboard"),
      path: "/dashboard",
      icon: <DashboardIcon />,
    },
    {
      label: t("sidebar.alarms", "Alarms"),
      path: "/alarms",
      icon: <AlarmIcon />,
    },
    {
      label: t("sidebar.history", "History"),
      path: "/history",
      icon: <History />,
    },
    {
      label: t("sidebar.guards", "Guards"),
      path: "/guards",
      icon: <ShieldUser />,
    },
    {
      label: t("sidebar.users", "Users"),
      path: "/users",
      icon: <Users />,
      requiredRole: "ADMIN" as const,
    },
    {
      label: t("sidebar.profile", "Profile"),
      path: "/profile",
      icon: <User />,
    },
  ];

  const filteredNavItems = navItems.filter((item) => {
    if (!item.requiredRole) return true;
    return adminUser?.role === item.requiredRole;
  });

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 flex h-screen w-64 flex-col bg-card border-r border-border transition-transform duration-200 lg:static lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-6 border-b border-border">
          <img src={wakilGoldLogo} alt="Wakil" className="h-16 w-auto" />
          <Button
            variant="ghost"
            size="icon-sm"
            className="lg:hidden"
            onClick={onMobileClose}
            aria-label={t("sidebar.closeMenu", "Close menu")}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredNavItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={onMobileClose}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive(item.path)
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted text-foreground"
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <Body className="font-medium">{item.label}</Body>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-border space-y-3">
          <div className="px-4 py-2">
            <Body size="sm" className="text-muted-foreground">
              {t("sidebar.signedInAs", "Signed in as")}
            </Body>
            <Body className="font-medium truncate">{adminUser?.name}</Body>
            <Body size="sm" className="text-muted-foreground truncate">
              {adminUser?.email}
            </Body>
          </div>
          <Button variant="outline" className="w-full" onClick={logout}>
            {t("sidebar.logout", "Logout")}
          </Button>
        </div>
      </div>
    </>
  );
}
