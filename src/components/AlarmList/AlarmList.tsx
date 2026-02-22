import type { Alarm, AlarmStatus } from "@/api/types";

import { AlarmItem } from "./AlarmItem";

type AlarmListProps = {
  alarms: Alarm[];
  onAlarmClick?: (alarmId: string) => void;
  onStatusChange?: (alarmId: string, newStatus: AlarmStatus) => void;
};

export function AlarmList({
  alarms,
  onAlarmClick,
  onStatusChange,
}: AlarmListProps) {
  return (
    <ul className="space-y-2">
      {alarms.map((alarm) => (
        <AlarmItem
          key={alarm.id}
          alarm={alarm}
          onClick={() => onAlarmClick?.(alarm.id)}
          onStatusChange={onStatusChange}
        />
      ))}
    </ul>
  );
}
