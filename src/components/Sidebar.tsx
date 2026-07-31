import { ChevronLeft, ChevronRight, History, LogOut, ShieldUser, User, Users, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";

import { useGetAlarms } from "@/api/hooks/useGetAlarms";
import wakilGoldLogo from "@/assets/wakil-gold.png";
import { Body, Button } from "@/components/ui";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/Tooltip/tooltip";
import { useAuth } from "@/contexts/AuthContext";

import { AlarmIcon } from "./icons/AlarmIcon";
import { DashboardIcon } from "./icons/DashboardIcon";

const NEEDS_ATTENTION_STATUSES = new Set(["pending", "open"]);

const SIDEBAR_COLLAPSED_KEY = "sidebar:collapsed";

type SidebarProps = {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
};

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const { adminUser, logout } = useAuth();
  // Cached under the same query key the Dashboard/Alarms pages use, so this
  // doesn't add a second independent poll — React Query dedupes it.
  const { data: alarms } = useGetAlarms();

  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true",
  );

  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed));
  }, [collapsed]);

  const alarmsNeedingAttention =
    alarms?.filter((a) => NEEDS_ATTENTION_STATUSES.has(a.status)).length ?? 0;

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
      badge: alarmsNeedingAttention > 0 ? alarmsNeedingAttention : undefined,
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

      <TooltipProvider delayDuration={0} skipDelayDuration={0}>
        <div
          className={`fixed inset-y-0 left-0 z-50 flex h-screen flex-col bg-card border-r border-border transition-[width,transform] duration-200 lg:static lg:translate-x-0 ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          } ${collapsed ? "w-20" : "w-64"}`}
        >
          <div className="flex items-center justify-between p-6 border-b border-border">
            {!collapsed && (
              <img
                src={wakilGoldLogo}
                alt="Wakil Security"
                className="h-10 w-auto"
              />
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              className="lg:hidden"
              onClick={onMobileClose}
              aria-label={t("sidebar.closeMenu", "Close menu")}
            >
              <X className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className={`hidden lg:flex ${collapsed ? "mx-auto" : ""}`}
              onClick={() => setCollapsed((prev) => !prev)}
              aria-label={
                collapsed
                  ? t("sidebar.expand", "Expand sidebar")
                  : t("sidebar.collapse", "Collapse sidebar")
              }
            >
              {collapsed ? (
                <ChevronRight className="h-5 w-5" />
              ) : (
                <ChevronLeft className="h-5 w-5" />
              )}
            </Button>
          </div>

          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            {filteredNavItems.map((item) => {
              const link = (
                <Link
                  to={item.path}
                  onClick={onMobileClose}
                  aria-label={item.label}
                  className={`flex items-center gap-3 rounded-lg transition-colors ${
                    collapsed ? "justify-center px-0 py-3" : "px-4 py-3"
                  } ${
                    isActive(item.path)
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted text-foreground"
                  }`}
                >
                  <span className="relative text-xl">
                    {item.icon}
                    {!!item.badge && (
                      <span
                        className={`absolute -right-1.5 -top-1.5 flex items-center justify-center rounded-full bg-alarm text-[10px] font-semibold text-white ${
                          collapsed
                            ? "h-2.5 w-2.5"
                            : item.badge > 9
                              ? "h-4 min-w-4 px-1"
                              : "h-3.5 w-3.5"
                        }`}
                        aria-hidden="true"
                      >
                        {!collapsed && (item.badge > 9 ? "9+" : item.badge)}
                      </span>
                    )}
                  </span>
                  {!collapsed && (
                    <Body
                      className={`font-medium ${
                        isActive(item.path) ? "text-primary-foreground" : ""
                      }`}
                    >
                      {item.label}
                    </Body>
                  )}
                  {!collapsed && !!item.badge && (
                    <span className="sr-only">
                      {item.badge} alarms need attention
                    </span>
                  )}
                </Link>
              );

              return (
                <Tooltip key={item.path}>
                  <TooltipTrigger asChild>{link}</TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8}>
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </nav>

          <div className="p-4 border-t border-border space-y-3">
            {!collapsed && (
              <div className="px-4 py-2">
                <Body size="sm" className="text-muted-foreground">
                  {t("sidebar.signedInAs", "Signed in as")}
                </Body>
                <Body className="font-medium truncate">{adminUser?.name}</Body>
                <Body size="sm" className="text-muted-foreground truncate">
                  {adminUser?.email}
                </Body>
              </div>
            )}

            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    className="w-full"
                    onClick={logout}
                    aria-label={t("sidebar.logout", "Logout")}
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {t("sidebar.logout", "Logout")}
                </TooltipContent>
              </Tooltip>
            ) : (
              <Button variant="outline" className="w-full" onClick={logout}>
                {t("sidebar.logout", "Logout")}
              </Button>
            )}
          </div>
        </div>
      </TooltipProvider>
    </>
  );
}
