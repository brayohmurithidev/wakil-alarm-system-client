import { useTranslation } from "react-i18next";

import type { Alarm } from "@/api/types";
import { Body } from "@/components/ui";
import { Badge } from "../ui/Badge";

type AlarmItemProps = {
  alarm: Alarm;
};

export function AlarmItem({ alarm }: AlarmItemProps) {
  const { t } = useTranslation();

  return (
    <li className="p-3 border rounded-md bg-muted">
      <div className="flex justify-between items-start">
        <div>
          <Body>{alarm.userName}</Body>
          <Body size="sm" className="text-muted-foreground">
            {alarm.userPhone}
          </Body>
          <Body className="text-muted-foreground mt-1">
            {t("alarms.location")}: {alarm.latitude.toFixed(4)},{" "}
            {alarm.longitude.toFixed(4)}
          </Body>
        </div>
        <Badge
          variant={
            alarm.status === "pending"
              ? "warning"
              : alarm.status === "closed"
                ? "destructive"
                : alarm.status === "open"
                  ? "success"
                  : "success"
          }
        >
          {alarm.status}
        </Badge>
      </div>
    </li>
  );
}
