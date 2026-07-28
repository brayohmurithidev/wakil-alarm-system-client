import { ListFilter } from "lucide-react";

import type { AlarmStatus, GuardStatus } from "@/api/types";
import { AlarmStatusBadge } from "@/components/AlarmStatusBadge";
import { Button } from "@/components/ui";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu/dropdown-menu";
import {
  type AssignmentFilter,
  countActiveFilters,
  FILTERABLE_ALARM_STATUSES,
  FILTERABLE_GUARD_STATUSES,
  getDefaultMapFilters,
  type MapFilterState,
} from "@/lib/mapFilters";

const ASSIGNMENT_OPTIONS: { value: AssignmentFilter; label: string }[] = [
  { value: "all", label: "All alarms" },
  { value: "assigned", label: "Assigned only" },
  { value: "unassigned", label: "Unassigned only" },
];

// Operational labels, not connectivity - "busy"/"offline" are the API's
// enum values, but this filters guards by operational status (available/
// assigned/off duty), matching the Guards panel and map marker language.
const GUARD_STATUS_LABEL: Record<GuardStatus, string> = {
  available: "Available",
  busy: "Assigned",
  offline: "Off Duty",
};

type MapFiltersProps = {
  filters: MapFilterState;
  onChange: (filters: MapFilterState) => void;
};

export function MapFilters({ filters, onChange }: MapFiltersProps) {
  const activeCount = countActiveFilters(filters);

  const toggleAlarmStatus = (status: AlarmStatus) => {
    const next = new Set(filters.alarmStatuses);
    if (next.has(status)) next.delete(status);
    else next.add(status);
    onChange({ ...filters, alarmStatuses: next });
  };

  const toggleGuardStatus = (status: GuardStatus) => {
    const next = new Set(filters.guardStatuses);
    if (next.has(status)) next.delete(status);
    else next.add(status);
    onChange({ ...filters, guardStatuses: next });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <ListFilter size={14} />
          Filters
          {activeCount > 0 && (
            <span className="ml-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {activeCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Alarm status</DropdownMenuLabel>
        {FILTERABLE_ALARM_STATUSES.map((status) => (
          <DropdownMenuCheckboxItem
            key={status}
            checked={filters.alarmStatuses.has(status)}
            onSelect={(e) => e.preventDefault()}
            onCheckedChange={() => toggleAlarmStatus(status)}
          >
            <AlarmStatusBadge status={status} className="text-[10px]" />
          </DropdownMenuCheckboxItem>
        ))}

        <DropdownMenuSeparator />
        <DropdownMenuLabel>Assignment</DropdownMenuLabel>
        {ASSIGNMENT_OPTIONS.map((option) => (
          <DropdownMenuCheckboxItem
            key={option.value}
            checked={filters.assignment === option.value}
            onSelect={(e) => e.preventDefault()}
            onCheckedChange={() =>
              onChange({ ...filters, assignment: option.value })
            }
          >
            {option.label}
          </DropdownMenuCheckboxItem>
        ))}

        <DropdownMenuSeparator />
        <DropdownMenuLabel>Guard status</DropdownMenuLabel>
        {FILTERABLE_GUARD_STATUSES.map((status) => (
          <DropdownMenuCheckboxItem
            key={status}
            checked={filters.guardStatuses.has(status)}
            onSelect={(e) => e.preventDefault()}
            onCheckedChange={() => toggleGuardStatus(status)}
          >
            {GUARD_STATUS_LABEL[status]}
          </DropdownMenuCheckboxItem>
        ))}

        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => onChange(getDefaultMapFilters())}>
          Reset filters
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
