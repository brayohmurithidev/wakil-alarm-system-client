import { useTranslation } from "react-i18next";

import { useHealth } from "@/api/hooks/useHealth";
import { DashboardIcon } from "@/components/icons/DashboardIcon";
import { useAlarmNotification } from "@/contexts/AlarmNotificationContext";

import { RealtimeStatusIndicator } from "./RealtimeStatusIndicator";
import { SystemHealthBadge } from "./SystemHealthBadge";

export function DashboardHeader() {
  const { t } = useTranslation();
  const { health } = useHealth();
  const { connectionStatus } = useAlarmNotification();

  return (
    <header className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-6">
      <div className="flex items-center gap-3">
        <DashboardIcon size={28} />
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            {t("dashboard.title")}
          </h1>
          <p className="text-sm font-normal text-muted-foreground">
            {t(
              "dashboard.subtitle",
              "Real-time overview of alarms, guards and system activity",
            )}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <RealtimeStatusIndicator status={connectionStatus} />
        <SystemHealthBadge health={health} />
      </div>
    </header>
  );
}
