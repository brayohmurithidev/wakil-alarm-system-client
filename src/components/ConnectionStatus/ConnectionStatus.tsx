import { useTranslation } from "react-i18next";

import { Body } from "@/components/ui";

type ConnectionStatusProps = {
  connected: boolean;
};

export function ConnectionStatus({ connected }: ConnectionStatusProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-3 h-3 rounded-full ${
          connected ? "bg-accent" : "bg-destructive"
        }`}
      />
      <Body size="sm" className="text-muted-foreground">
        {connected ? t("dashboard.connected") : t("dashboard.disconnected")}
      </Body>
    </div>
  );
}
