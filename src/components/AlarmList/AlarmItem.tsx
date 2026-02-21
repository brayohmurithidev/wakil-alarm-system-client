import { useTranslation } from "react-i18next";

import type { Alarm, AlarmStatus } from "@/api/types";
import { Body } from "@/components/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { ChevronDown } from "lucide-react";

type AlarmItemProps = {
  alarm: Alarm;
  onClick?: () => void;
  onStatusChange?: (alarmId: string, newStatus: AlarmStatus) => void;
};

export function AlarmItem({ alarm, onClick, onStatusChange }: AlarmItemProps) {
  const { t } = useTranslation();

  const handleStatusChange = (newStatus: string) => {
    onStatusChange?.(alarm.id, newStatus as AlarmStatus);
  };

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
        <DropdownMenu>
          <DropdownMenuTrigger
            onClick={(e) => e.stopPropagation()}
            className={`px-2 flex items-center gap-1 py-1 rounded-sm text-sm font-semibold border cursor-pointer ${getStatusColor(alarm.status)}`}
          >
            {alarm.status.charAt(0).toUpperCase() + alarm.status.slice(1)}
            <ChevronDown />
          </DropdownMenuTrigger>
          <DropdownMenuContent onClick={(e) => e.stopPropagation()}>
            <DropdownMenuRadioGroup
              value={alarm.status}
              onValueChange={handleStatusChange}
            >
              <DropdownMenuRadioItem value="pending">
                Pending
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="open">Open</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="closed">
                Closed
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="cancelled">
                Cancelled
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </li>
  );
}
