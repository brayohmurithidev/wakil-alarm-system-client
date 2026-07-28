import { MapPin, Maximize2, Minimize2, Moon, ShieldUser, Sun } from "lucide-react";

import { Button } from "@/components/ui";
import type { MapFilterState } from "@/lib/mapFilters";
import type { MapTheme } from "@/lib/mapTheme";
import { cn } from "@/lib/utils";

import { MapFilters } from "./MapFilters";

export type MapVisibility = "alarms" | "guards" | "both";

type LiveMapToolbarProps = {
  visibility: MapVisibility;
  onVisibilityChange: (visibility: MapVisibility) => void;
  filters: MapFilterState;
  onFiltersChange: (filters: MapFilterState) => void;
  mapTheme: MapTheme;
  onToggleMapTheme: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
};

const VISIBILITY_OPTIONS: {
  value: MapVisibility;
  label: string;
  icon: React.ReactNode;
  activeClass: string;
}[] = [
  {
    value: "alarms",
    label: "Alarms",
    icon: <span className="h-2 w-2 rounded-full bg-alarm" />,
    activeClass: "bg-alarm/15 text-alarm",
  },
  {
    value: "guards",
    label: "Guards",
    icon: <span className="h-2 w-2 rounded-full bg-guard" />,
    activeClass: "bg-guard/15 text-guard",
  },
  {
    value: "both",
    label: "Both",
    icon: <MapPin size={12} />,
    activeClass: "bg-primary/15 text-primary",
  },
];

export function LiveMapToolbar({
  visibility,
  onVisibilityChange,
  filters,
  onFiltersChange,
  mapTheme,
  onToggleMapTheme,
  isFullscreen,
  onToggleFullscreen,
}: LiveMapToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-3 py-2.5 sm:px-4">
      <div className="flex items-center gap-2">
        <ShieldUser size={16} className="text-primary" aria-hidden="true" />
        <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
          Live Map
        </h2>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div
          className="flex items-center gap-0.5 rounded-lg bg-muted p-0.5"
          role="group"
          aria-label="Map marker visibility"
        >
          {VISIBILITY_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => onVisibilityChange(option.value)}
              aria-pressed={visibility === option.value}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors",
                visibility === option.value
                  ? option.activeClass
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {option.icon}
              {option.label}
            </button>
          ))}
        </div>

        <MapFilters filters={filters} onChange={onFiltersChange} />

        <Button
          variant="outline"
          size="icon-sm"
          onClick={onToggleMapTheme}
          aria-label={
            mapTheme === "dark" ? "Switch to light map" : "Switch to dark map"
          }
          title={mapTheme === "dark" ? "Light map" : "Dark map"}
        >
          {mapTheme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
        </Button>

        <Button
          variant="outline"
          size="icon-sm"
          onClick={onToggleFullscreen}
          aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
        </Button>
      </div>
    </div>
  );
}
