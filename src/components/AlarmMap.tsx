import {
  InfoWindow,
  Map,
  Marker,
  useMap,
  useMarkerRef,
} from "@vis.gl/react-google-maps";
import { ChevronRight, Maximize2, Minus, Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import type { TrackerLocation } from "@/api/hooks/useGetTrackerLocation";
import type { Alarm, AlarmStatus, Guard, GuardStatus } from "@/api/types";
import { LoaderIcon } from "@/components/icons";
import { Avatar } from "@/components/ui/Avatar";

function timeAgo(iso: string): string {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

const DEFAULT_CENTER = { lat: -1.2921, lng: 36.8219 };

function svgIcon(
  svg: string,
  size: number,
  anchor: number,
): google.maps.Icon {
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(size, size),
    anchor: new google.maps.Point(anchor, anchor),
  };
}

const getMarkerIcon = (status: AlarmStatus): google.maps.Icon => {
  const colors: Record<AlarmStatus, string> = {
    pending: "#f97316",
    open: "#3b82f6",
    acknowledged: "#a855f7",
    assigned: "#6366f1",
    guard_acknowledged: "#14b8a6",
    report_submitted: "#84cc16",
    closed: "#6b7280",
    cancelled: "#9ca3af",
    unknown: "#9ca3af",
  };

  const color = colors[status] || colors.unknown;

  const svg = `
    <svg width="44" height="44" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="s" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" flood-color="#000" flood-opacity="0.5"/>
        </filter>
      </defs>
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
        fill="white" stroke="white" stroke-width="3.5" stroke-linejoin="round" filter="url(#s)"/>
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
        fill="${color}" stroke="white" stroke-width="1.5"/>
      <circle cx="12" cy="9" r="2.5" fill="white"/>
    </svg>
  `;

  return svgIcon(svg, 44, 44);
};

const getTrackerIcon = (): google.maps.Icon => {
  const svg = `
    <svg width="42" height="42" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="s" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" flood-color="#000" flood-opacity="0.5"/>
        </filter>
      </defs>
      <circle cx="12" cy="12" r="10" fill="white" filter="url(#s)"/>
      <circle cx="12" cy="12" r="10" fill="#10b981" stroke="white" stroke-width="2"/>
      <path d="M8 12l2-4h4l2 4-2 4h-4l-2-4z" fill="white" stroke="none"/>
    </svg>
  `;

  return svgIcon(svg, 42, 21);
};

const GUARD_STATUS_COLOR: Record<GuardStatus, string> = {
  available: "#22c55e",
  busy: "#fbd63d",
  offline: "#6b7280",
};

// Same teardrop family as alarm markers (getMarkerIcon) so the two read as
// related map objects, distinguished by colour and inner glyph (person vs
// bell) rather than shape alone.
function getGuardMarkerIcon(
  status: GuardStatus,
  isSelected: boolean,
  isStale: boolean,
): google.maps.Icon {
  const color = GUARD_STATUS_COLOR[status];
  const size = isSelected ? 50 : 42;
  const opacity = status === "offline" ? 0.55 : isStale ? 0.75 : 1;
  const ring = isSelected
    ? `<path d="M12 1.3C7.8 1.3 4.3 4.7 4.3 9c0 5.6 7.7 13.6 7.7 13.6s7.7-8 7.7-13.6c0-4.3-3.5-7.7-7.7-7.7z" fill="none" stroke="#fbd63d" stroke-width="1.5"/>`
    : "";

  const svg = `
    <svg width="44" height="44" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="s" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" flood-color="#000" flood-opacity="0.5"/>
        </filter>
      </defs>
      <g opacity="${opacity}">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
          fill="white" stroke="white" stroke-width="3.5" stroke-linejoin="round" filter="url(#s)"/>
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
          fill="${color}" stroke="white" stroke-width="1.5"/>
        <circle cx="12" cy="8.6" r="1.6" fill="white"/>
        <path d="M8.6 12.2c0-1.6 1.5-2.5 3.4-2.5s3.4 0.9 3.4 2.5v0.6H8.6v-0.6z" fill="white"/>
        ${ring}
      </g>
    </svg>
  `;

  return svgIcon(svg, size, size / 2);
}


type AlarmMapProps = {
  alarms: Alarm[];
  trackers?: TrackerLocation[];
  guards?: Guard[];
  selectedGuardId?: string | null;
  focusedAlarmId?: string | null;
  focusedGuard?: Guard | null;
  // A Google Maps JS style array (see src/lib/mapTheme.ts) — undefined
  // means Google's standard default roadmap style.
  mapStyle?: google.maps.MapTypeStyle[];
  // Fired when a marker itself is clicked, separate from focusedAlarmId /
  // focusedGuard (which pan the camera). Lets a caller sync panel-row
  // highlighting to a map click without moving the map — selecting a
  // marker must not reset its position.
  onAlarmMarkerClick?: (alarmId: string) => void;
  onGuardMarkerClick?: (guard: Guard) => void;
};

// Handles smooth pan+zoom to a focused alarm or guard location.
function MapFocusHandler({
  alarms,
  guards,
  selectedGuardId,
  focusedAlarmId,
  focusedGuard,
}: {
  alarms: Alarm[];
  guards?: Guard[];
  selectedGuardId?: string | null;
  focusedAlarmId?: string | null;
  focusedGuard?: Guard | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    // Guard focused from the panel
    if (focusedGuard && focusedGuard.currentLatitude != null && focusedGuard.currentLongitude != null) {
      map.panTo({ lat: focusedGuard.currentLatitude, lng: focusedGuard.currentLongitude });
      map.setZoom(16);
      return;
    }

    if (!focusedAlarmId) return;
    const alarm = alarms.find((a) => a.id === focusedAlarmId);
    if (!alarm) return;

    const selectedGuard = guards?.find(
      (g) =>
        g.id === selectedGuardId &&
        g.currentLatitude != null &&
        g.currentLongitude != null,
    );

    if (selectedGuard) {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend({ lat: alarm.latitude, lng: alarm.longitude });
      bounds.extend({
        lat: selectedGuard.currentLatitude as number,
        lng: selectedGuard.currentLongitude as number,
      });
      map.fitBounds(bounds, 80);
    } else {
      map.panTo({ lat: alarm.latitude, lng: alarm.longitude });
      map.setZoom(16);
    }
  }, [focusedAlarmId, focusedGuard, alarms, guards, selectedGuardId, map]);

  return null;
}

// Custom zoom + fit controls — replaces Google's default controls.
function MapControls({
  alarms,
  guards,
  trackers,
}: {
  alarms: Alarm[];
  guards?: Guard[];
  trackers?: TrackerLocation[];
}) {
  const map = useMap();

  const zoomIn = useCallback(() => {
    if (!map) return;
    map.setZoom((map.getZoom() ?? 12) + 1);
  }, [map]);

  const zoomOut = useCallback(() => {
    if (!map) return;
    map.setZoom((map.getZoom() ?? 12) - 1);
  }, [map]);

  const fitAll = useCallback(() => {
    if (!map) return;

    const points: { lat: number; lng: number }[] = [
      ...alarms.map((a) => ({ lat: a.latitude, lng: a.longitude })),
      ...(guards ?? [])
        .filter((g) => g.currentLatitude != null && g.currentLongitude != null)
        .map((g) => ({ lat: g.currentLatitude as number, lng: g.currentLongitude as number })),
      ...(trackers ?? []).map((t) => ({ lat: t.latitude, lng: t.longitude })),
    ];

    if (points.length === 0) {
      map.panTo(DEFAULT_CENTER);
      map.setZoom(12);
      return;
    }

    if (points.length === 1) {
      map.panTo(points[0]);
      map.setZoom(14);
      return;
    }

    const bounds = new google.maps.LatLngBounds();
    points.forEach((p) => bounds.extend(p));
    map.fitBounds(bounds, 60);
  }, [map, alarms, guards, trackers]);

  return (
    <div className="absolute bottom-6 right-4 z-[500] flex flex-col gap-1">
      <button
        onClick={fitAll}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card shadow-md text-foreground hover:bg-muted transition-colors"
        aria-label="Fit all markers"
        title="Fit all"
      >
        <Maximize2 size={15} />
      </button>
      <button
        onClick={zoomIn}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card shadow-md text-foreground hover:bg-muted transition-colors"
        aria-label="Zoom in"
      >
        <Plus size={16} />
      </button>
      <button
        onClick={zoomOut}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card shadow-md text-foreground hover:bg-muted transition-colors"
        aria-label="Zoom out"
      >
        <Minus size={16} />
      </button>
    </div>
  );
}

// Google's map sits on a plain grey background until tiles have actually
// painted - fires the callback once tiles for the current view are in, so
// the caller can hide a loading overlay instead of flashing that grey.
function TilesLoadedHandler({ onLoaded }: { onLoaded: () => void }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    const listener = map.addListener("tilesloaded", () => {
      onLoaded();
      listener.remove();
    });
    return () => listener.remove();
  }, [map, onLoaded]);

  return null;
}

function AlarmMarker({
  alarm,
  onMarkerClick,
}: {
  alarm: Alarm;
  onMarkerClick?: (alarmId: string) => void;
}) {
  const [markerRef, marker] = useMarkerRef();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <Marker
        ref={markerRef}
        position={{ lat: alarm.latitude, lng: alarm.longitude }}
        icon={getMarkerIcon(alarm.status)}
        onClick={() => {
          setIsOpen(true);
          onMarkerClick?.(alarm.id);
        }}
      />
      {isOpen && marker && (
        <InfoWindow anchor={marker} onCloseClick={() => setIsOpen(false)}>
          <div className="p-2 min-w-[180px]">
            <div className="flex items-center gap-2 mb-1">
              <Avatar
                name={alarm.userName}
                imageUrl={alarm.userImage}
                variant="alarm"
                size="sm"
              />
              <h3 className="font-bold text-lg" style={{ color: "#111827" }}>{alarm.userName}</h3>
            </div>
            <p className="text-sm text-gray-600">{alarm.userPhone}</p>
            <p className="text-xs text-gray-500 mt-1">
              Status:
              <span className="font-semibold text-red-600">
                {" "}{alarm.status}
              </span>
            </p>
            {alarm.guard && (
              <p className="text-xs text-gray-500">
                Assigned: <span className="font-semibold">{alarm.guard.name}</span>
              </p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              {timeAgo(alarm.createdAt)}
            </p>
            <button
              onClick={() => navigate(`/alarms/${alarm.id}`)}
              className="mt-2 flex items-center gap-1 text-xs font-semibold"
              style={{ color: "#b45309" }}
            >
              View details <ChevronRight size={12} />
            </button>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

function TrackerMarker({ tracker }: { tracker: TrackerLocation }) {
  const [markerRef, marker] = useMarkerRef();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Marker
        ref={markerRef}
        position={{ lat: tracker.latitude, lng: tracker.longitude }}
        icon={getTrackerIcon()}
        onClick={() => setIsOpen(true)}
      />
      {isOpen && marker && (
        <InfoWindow anchor={marker} onCloseClick={() => setIsOpen(false)}>
          <div className="p-2">
            <h3 className="font-bold text-lg" style={{ color: "#111827" }}>Motorcycle</h3>
            <p className="text-sm text-gray-600">IMEI: {tracker.imei}</p>
            <p className="text-xs text-gray-500 mt-1">
              Speed: {tracker.speed} km/h
            </p>
            <p className="text-xs text-gray-500">
              Battery: {tracker.battery}%
            </p>
            <p className="text-xs text-gray-400 mt-1">{tracker.gpsTime}</p>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

function GuardMarker({
  guard,
  isSelected,
  onMarkerClick,
}: {
  guard: Guard & { currentLatitude: number; currentLongitude: number };
  isSelected: boolean;
  onMarkerClick?: (guard: Guard) => void;
}) {
  const [markerRef, marker] = useMarkerRef();
  const [isOpen, setIsOpen] = useState(false);

  const isStale = guard.status !== "offline" && !guard.locationUpdatedAt;

  return (
    <>
      <Marker
        ref={markerRef}
        position={{ lat: guard.currentLatitude, lng: guard.currentLongitude }}
        icon={getGuardMarkerIcon(guard.status, isSelected, isStale)}
        zIndex={isSelected ? 1000 : undefined}
        onClick={() => {
          setIsOpen(true);
          onMarkerClick?.(guard);
        }}
      />
      {isOpen && marker && (
        <InfoWindow anchor={marker} onCloseClick={() => setIsOpen(false)}>
          <div className="p-2">
            {isSelected && (
              <p className="text-xs font-bold mb-1" style={{ color: "#fbd63d" }}>
                ASSIGNED GUARD
              </p>
            )}
            <div className="flex items-center gap-2 mb-1">
              <Avatar
                name={guard.name}
                imageUrl={guard.avatarUrl}
                variant="guard"
                size="sm"
                guardStatus={guard.status}
              />
              <h3 className="font-bold text-lg" style={{ color: "#111827" }}>{guard.name}</h3>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Status:
              <span
                className="font-semibold"
                style={{ color: GUARD_STATUS_COLOR[guard.status] }}
              >
                {" "}{guard.status}
              </span>
            </p>
            <p className="text-xs text-gray-500">
              {guard.status === "offline"
                ? "Off duty"
                : guard.status === "busy"
                  ? "Engaged"
                  : "Available"}
            </p>
            {guard.locationUpdatedAt ? (
              <p className="text-xs text-gray-400 mt-1">
                Updated {timeAgo(guard.locationUpdatedAt)}
              </p>
            ) : guard.lastActiveAt ? (
              <p className="text-xs text-gray-400 mt-1">
                Last seen {timeAgo(guard.lastActiveAt)}
              </p>
            ) : null}
          </div>
        </InfoWindow>
      )}
    </>
  );
}

export function AlarmMap({
  alarms,
  trackers,
  guards,
  selectedGuardId,
  focusedAlarmId,
  focusedGuard,
  mapStyle,
  onAlarmMarkerClick,
  onGuardMarkerClick,
}: AlarmMapProps) {
  const center =
    alarms.length > 0
      ? { lat: alarms[0].latitude, lng: alarms[0].longitude }
      : DEFAULT_CENTER;

  const locatingGuards = guards?.filter(
    (guard) =>
      guard.status !== "offline" &&
      (guard.currentLatitude == null || guard.currentLongitude == null),
  );

  const [tilesLoaded, setTilesLoaded] = useState(false);

  return (
    <div className="relative flex h-full w-full min-h-0 flex-1 flex-col">
      {!tilesLoaded && (
        <div className="absolute inset-0 z-[1000] flex items-center justify-center rounded-lg bg-card">
          <LoaderIcon className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}
      {locatingGuards && locatingGuards.length > 0 && (
        <div className="absolute top-3 right-3 z-[1000] max-w-56 rounded-lg border border-border bg-card/95 p-2 shadow-md">
          <p className="mb-1 text-xs font-semibold text-muted-foreground">
            Locating guard{locatingGuards.length > 1 ? "s" : ""}&hellip;
          </p>
          <ul className="space-y-1">
            {locatingGuards.map((guard) => (
              <li
                key={guard.id}
                className="flex items-center gap-2 text-xs text-foreground"
              >
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="absolute h-full w-full animate-ping rounded-full bg-warning opacity-75" />
                  <span className="relative h-2 w-2 rounded-full bg-warning" />
                </span>
                {guard.name}
              </li>
            ))}
          </ul>
        </div>
      )}
      <Map
        defaultCenter={center}
        defaultZoom={12}
        styles={mapStyle}
        className="h-full w-full min-h-0 flex-1 rounded-lg"
        disableDefaultUI
        gestureHandling="greedy"
      >
        <TilesLoadedHandler onLoaded={() => setTilesLoaded(true)} />
        <MapFocusHandler
          alarms={alarms}
          guards={guards}
          selectedGuardId={selectedGuardId}
          focusedAlarmId={focusedAlarmId}
          focusedGuard={focusedGuard}
        />
        <MapControls alarms={alarms} guards={guards} trackers={trackers} />
        {alarms.map((alarm) => (
          <AlarmMarker
            key={alarm.id}
            alarm={alarm}
            onMarkerClick={onAlarmMarkerClick}
          />
        ))}
        {trackers?.map((tracker) => (
          <TrackerMarker key={tracker.imei} tracker={tracker} />
        ))}
        {guards
          ?.filter(
            (guard): guard is Guard & { currentLatitude: number; currentLongitude: number } =>
              guard.currentLatitude != null && guard.currentLongitude != null,
          )
          .map((guard) => (
            <GuardMarker
              key={guard.id}
              guard={guard}
              isSelected={guard.id === selectedGuardId}
              onMarkerClick={onGuardMarkerClick}
            />
          ))}
      </Map>
    </div>
  );
}
