import { useCallback, useEffect, useRef, useState } from "react";

import type { TrackerLocation } from "@/api/hooks/useGetTrackerLocation";
import type { Alarm, Guard } from "@/api/types";
import { AlarmMap } from "@/components/AlarmMap";
import {
  applyAlarmFilters,
  applyGuardFilters,
  getDefaultMapFilters,
  type MapFilterState,
} from "@/lib/mapFilters";
import {
  getStoredMapTheme,
  resolveMapId,
  storeMapTheme,
} from "@/lib/mapTheme";

import { LiveMapToolbar, type MapVisibility } from "./LiveMapToolbar";

type LiveMapProps = {
  alarms: Alarm[];
  trackers?: TrackerLocation[];
  guards?: Guard[];
  focusedAlarmId?: string | null;
  focusedGuard?: Guard | null;
  onAlarmMarkerClick?: (alarmId: string) => void;
  onGuardMarkerClick?: (guard: Guard) => void;
};

export function LiveMap({
  alarms,
  trackers,
  guards,
  focusedAlarmId,
  focusedGuard,
  onAlarmMarkerClick,
  onGuardMarkerClick,
}: LiveMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [visibility, setVisibility] = useState<MapVisibility>("both");
  const [mapTheme, setMapTheme] = useState(getStoredMapTheme);
  const [filters, setFilters] = useState<MapFilterState>(getDefaultMapFilters);

  useEffect(() => {
    const handleChange = () =>
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    document.addEventListener("fullscreenchange", handleChange);
    return () => document.removeEventListener("fullscreenchange", handleChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void containerRef.current?.requestFullscreen();
    }
  }, []);

  const toggleMapTheme = useCallback(() => {
    setMapTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      storeMapTheme(next);
      return next;
    });
  }, []);

  const filteredAlarms =
    visibility === "guards" ? [] : applyAlarmFilters(alarms, filters);
  const filteredGuards =
    visibility === "alarms" ? [] : applyGuardFilters(guards ?? [], filters);

  return (
    <div
      ref={containerRef}
      className="flex min-h-0 min-w-0 flex-1 flex-col rounded-lg border border-border bg-card"
    >
      <LiveMapToolbar
        visibility={visibility}
        onVisibilityChange={setVisibility}
        filters={filters}
        onFiltersChange={setFilters}
        mapTheme={mapTheme}
        onToggleMapTheme={toggleMapTheme}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
      />
      <div className="flex min-h-0 flex-1 flex-col p-2">
        <AlarmMap
          alarms={filteredAlarms}
          trackers={visibility === "guards" ? undefined : trackers}
          guards={filteredGuards}
          focusedAlarmId={focusedAlarmId}
          focusedGuard={focusedGuard}
          mapId={resolveMapId(mapTheme)}
          onAlarmMarkerClick={onAlarmMarkerClick}
          onGuardMarkerClick={onGuardMarkerClick}
        />
      </div>
    </div>
  );
}
