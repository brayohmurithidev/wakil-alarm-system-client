import { ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import type { Alarm } from "@/api/types";
import { Body } from "@/components/ui";

type AlarmItemProps = {
  alarm: Alarm;
  onClick?: () => void;
};

export function AlarmItem({ alarm, onClick }: AlarmItemProps) {
  const { t } = useTranslation();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-orange-100 text-orange-800 border-yellow-300";
      case "open":
        return "bg-green-100 text-green-800 border-green-300";
      case "closed":
        return "bg-gray-100 text-gray-800 border-gray-300";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  return (
    <li
      className="p-3 border rounded-md bg-muted cursor-pointer hover:bg-muted/80 transition-colors"
      onClick={onClick}
    >
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
        <span
          className={`px-2 py-1 rounded-sm text-sm font-semibold border ${getStatusColor(alarm.status)}`}
        >
          {alarm.status.charAt(0).toUpperCase() + alarm.status.slice(1)}
        </span>
      </div>
      <div className="flex justify-end mt-2">
        <Link
          to={`/alarms/${alarm.id}`}
          onClick={(e) => e.stopPropagation()}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-primary hover:bg-secondary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <ChevronRight size={24} />
        </Link>
      </div>
    </li>
  );
}
