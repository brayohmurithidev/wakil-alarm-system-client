import type { Alarm } from "@/api/types";
import { AlarmItem } from "./AlarmItem";

type AlarmListProps = {
  alarms: Alarm[];
};

export function AlarmList({ alarms }: AlarmListProps) {
  return (
    <ul className="space-y-2">
      {alarms.map((alarm) => (
        <AlarmItem key={alarm.id} alarm={alarm} />
      ))}
    </ul>
  );
}
