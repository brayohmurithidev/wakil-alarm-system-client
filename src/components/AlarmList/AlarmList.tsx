import type { Alarm } from "@/api/types";

import { AlarmItem } from "./AlarmItem";

type AlarmListProps = {
  alarms: Alarm[];
  onAlarmClick?: (alarmId: string) => void;
};

export function AlarmList({
  alarms,
  onAlarmClick,
}: AlarmListProps) {
  return (
    <ul className="space-y-2">
      {alarms.map((alarm) => (
        <AlarmItem
          key={alarm.id}
          alarm={alarm}
          onClick={() => onAlarmClick?.(alarm.id)}
        />
      ))}
    </ul>
  );
}
