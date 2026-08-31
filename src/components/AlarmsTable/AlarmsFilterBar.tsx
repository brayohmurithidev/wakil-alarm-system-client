import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";

import type { AlarmStatus, Guard } from "@/api/types";
import { STATUS_LABEL } from "@/components/AlarmStatusBadge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import type { AlarmsListFilters, DatePreset } from "@/lib/alarmsListState";

const ALL = "__all__";
const UNASSIGNED_GUARD = "unassigned";

const DATE_OPTIONS: { value: DatePreset; label: string }[] = [
  { value: "all", label: "All time" },
  { value: "today", label: "Today" },
  { value: "last7", label: "Last 7 days" },
  { value: "last30", label: "Last 30 days" },
  { value: "custom", label: "Custom range" },
];

export function AlarmsFilterBar({
  filters,
  onChange,
  onReset,
  statusOptions,
  guards,
  isDefault,
}: {
  filters: AlarmsListFilters;
  onChange: (patch: Partial<AlarmsListFilters>) => void;
  onReset: () => void;
  statusOptions: readonly AlarmStatus[];
  guards: Guard[] | undefined;
  isDefault: boolean;
}) {
  // Local, debounced search text - the URL (and thus the API request) only
  // updates once typing pauses, so keystrokes don't each trigger a fetch.
  const [searchInput, setSearchInput] = useState(filters.search);

  // When filters.search changes from OUTSIDE this box (Reset, browser back/
  // forward, a copied URL) the input must pick it up too - otherwise a
  // stale debounce timer would silently re-apply the old text a moment
  // later. This is React's documented "adjust state when a prop changes"
  // pattern (conditional setState during render, not in an effect) rather
  // than a useEffect mirroring filters.search into local state, which would
  // cost an extra render on every keystroke-driven update for no reason.
  const [lastExternalSearch, setLastExternalSearch] = useState(filters.search);
  if (filters.search !== lastExternalSearch) {
    setLastExternalSearch(filters.search);
    setSearchInput(filters.search);
  }

  const debouncedSearch = useDebouncedValue(searchInput, 350);

  useEffect(() => {
    if (debouncedSearch !== filters.search) onChange({ search: debouncedSearch });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only fire on the debounced value settling, not on every `filters`/`onChange` identity change.
  }, [debouncedSearch]);

  return (
    <div className="mb-4 flex flex-col gap-3 rounded-lg border border-border bg-card p-3 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative min-w-[220px] flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search name, phone, or alarm ID..."
          className="pl-9"
        />
      </div>

      <Select
        value={filters.status || ALL}
        onValueChange={(value) => onChange({ status: value === ALL ? "" : (value as AlarmStatus) })}
      >
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All statuses</SelectItem>
          {statusOptions.map((status) => (
            <SelectItem key={status} value={status}>
              {STATUS_LABEL[status] ?? status}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.guardId || ALL}
        onValueChange={(value) => onChange({ guardId: value === ALL ? "" : value })}
      >
        <SelectTrigger className="w-full sm:w-[190px]">
          <SelectValue placeholder="Guard" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All guards</SelectItem>
          <SelectItem value={UNASSIGNED_GUARD}>Unassigned</SelectItem>
          {(guards ?? []).map((guard) => (
            <SelectItem key={guard.id} value={guard.id}>
              {guard.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.date}
        onValueChange={(value) => onChange({ date: value as DatePreset, from: "", to: "" })}
      >
        <SelectTrigger className="w-full sm:w-[160px]">
          <SelectValue placeholder="Date" />
        </SelectTrigger>
        <SelectContent>
          {DATE_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {filters.date === "custom" && (
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={filters.from}
            onChange={(e) => onChange({ from: e.target.value })}
            className="w-[150px]"
          />
          <span className="text-muted-foreground">to</span>
          <Input
            type="date"
            value={filters.to}
            onChange={(e) => onChange({ to: e.target.value })}
            className="w-[150px]"
          />
        </div>
      )}

      {!isDefault && (
        <Button variant="ghost" size="sm" onClick={onReset} className="gap-1.5">
          <X className="h-4 w-4" />
          Reset
        </Button>
      )}
    </div>
  );
}
