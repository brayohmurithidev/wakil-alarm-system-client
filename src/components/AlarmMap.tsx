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
import type { Alarm, AlarmStatus, Guard } from "@/api/types";
import { LoaderIcon } from "@/components/icons";
import { Avatar } from "@/components/ui/Avatar";
import {
  getConnectivityStatus,
  getLocationFreshness,
  getOperationalStatus,
  type LocationFreshness,
  type OperationalStatus,
} from "@/lib/guardState";

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

// Brand-guide reserved colours only — alarm red, guard blue, Wakil gold for
// selection. Status/urgency is conveyed through opacity and a small badge,
// not by swapping in unrelated hues.
const ALARM_RED = "#ef4444";
const ALARM_CLOSED_GREY = "#6b7280";
const GUARD_BLUE = "#3b82f6";
const WAKIL_GOLD = "#fbd63d";

const UNACKNOWLEDGED_ALARM_STATUSES = new Set<AlarmStatus>([
  "pending",
  "open",
  "unknown",
]);
const CLOSED_ALARM_STATUSES = new Set<AlarmStatus>(["closed", "cancelled"]);

// A pulsing gold halo behind the marker shape — shared by alarms and guards
// so "selected" reads identically across both. SMIL animation embedded in
// the SVG animates even though the icon is served as a static image URL, and
// stays crisp at any zoom/DPR since it's vector, not a raster sprite.
function selectionHalo(cx: number, cy: number): string {
  return `
    <circle cx="${cx}" cy="${cy}" r="10" fill="none" stroke="${WAKIL_GOLD}" stroke-width="2" opacity="0.9">
      <animate attributeName="r" values="9;13;9" dur="1.6s" repeatCount="indefinite" />
      <animate attributeName="opacity" values="0.9;0.25;0.9" dur="1.6s" repeatCount="indefinite" />
    </circle>
  `;
}

// Alarm markers keep the teardrop-pin silhouette; a shield badge (see
// getGuardMarkerIcon) is used for guards so the two are distinguishable by
// shape alone, not just colour. A 32x32 viewBox (rather than 24x24) leaves
// room for the selection halo to breathe without clipping.
const getMarkerIcon = (
  status: AlarmStatus,
  isSelected = false,
): google.maps.Icon => {
  const isActive = UNACKNOWLEDGED_ALARM_STATUSES.has(status);
  const isClosed = CLOSED_ALARM_STATUSES.has(status);
  const fill = isClosed ? ALARM_CLOSED_GREY : ALARM_RED;
  const opacity = isClosed ? 0.55 : 1;
  const size = isSelected ? 50 : 44;

  // Acknowledged (someone's responding) gets a small white check badge so
  // the two states this task calls for — active vs acknowledged — read
  // apart without relying on colour alone.
  const acknowledgedBadge =
    !isActive && !isClosed
      ? `<circle cx="22" cy="9" r="4.5" fill="white" stroke="${ALARM_RED}" stroke-width="1"/>
         <path d="M20 9l1.3 1.3L24 7.6" fill="none" stroke="${ALARM_RED}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>`
      : "";

  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="s" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" flood-color="#000" flood-opacity="0.5"/>
        </filter>
      </defs>
      ${isSelected ? selectionHalo(16, 13) : ""}
      <g filter="url(#s)">
        <path d="M16 6C12.13 6 9 9.13 9 13c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
          fill="white" stroke="white" stroke-width="3.5" stroke-linejoin="round"/>
      </g>
      <path d="M16 6C12.13 6 9 9.13 9 13c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
        fill="${fill}" stroke="white" stroke-width="1.5" opacity="${opacity}"/>
      <g transform="translate(16,13)" opacity="${opacity}">
        <path d="M0-4.2c-2 0-3.4 1.6-3.4 3.7v2.5L-4.5 3.6c-.3.4 0 .9.5.9h8c.5 0 .8-.5.5-.9L3.4 2V-0.5C3.4-2.6 2-4.2 0-4.2z" fill="white"/>
        <circle cx="0" cy="4.3" r="1" fill="white"/>
      </g>
      ${acknowledgedBadge}
    </svg>
  `;

  return svgIcon(svg, size, Math.round(size * 0.41));
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

// Secondary operational-state dot colour — deliberately distinct from the
// guard-identity blue of the shield itself, and from the alarm-red/Wakil-gold
// pair reserved for incidents/selection. Matches the same green/amber/grey
// used for the panel's operational badge (GuardsPanel.tsx).
const OPERATIONAL_DOT_COLOR: Record<OperationalStatus, string> = {
  available: "#22c55e",
  assigned: "#f59e0b",
  offDuty: "#6b7280",
};

// A shield/security-badge silhouette — deliberately a different shape from
// the alarm teardrop pin (not just a different colour) so the two are
// distinguishable at a glance, per the guard-vs-alarm marker requirement.
// The shield itself always stays guard blue (identity); operational state,
// connectivity and location freshness are layered on as secondary
// indicators rather than replacing it, per the guard-marker requirement.
// Same 32x32-viewBox-with-padding approach as getMarkerIcon, for the same
// reason (room for the selection halo).
function getGuardMarkerIcon(
  operational: OperationalStatus,
  isConnected: boolean,
  freshness: LocationFreshness,
  isSelected: boolean,
): google.maps.Icon {
  const size = isSelected ? 50 : 44;
  // Reduced emphasis for off-duty or disconnected guards - opacity on the
  // same guard blue, never a different hue, per the marker-states
  // requirement. Off-duty (the guard's own choice) is muted further than a
  // merely dropped connection.
  const opacity = operational === "offDuty" ? 0.45 : !isConnected ? 0.65 : 1;

  const staleRing =
    freshness === "stale" && !isSelected
      ? `<circle cx="16" cy="15" r="12" fill="none" stroke="#9ca3af" stroke-width="1.5" stroke-dasharray="2.5 2.5" opacity="0.8"/>`
      : "";

  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="s" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" flood-color="#000" flood-opacity="0.5"/>
        </filter>
      </defs>
      ${isSelected ? selectionHalo(16, 15) : ""}
      ${staleRing}
      <g filter="url(#s)">
        <path d="M16 5L23.5 8V14C23.5 20 20 24.7 16 26.5C12 24.7 8.5 20 8.5 14V8Z"
          fill="white" stroke="white" stroke-width="3.5" stroke-linejoin="round"/>
      </g>
      <path d="M16 5L23.5 8V14C23.5 20 20 24.7 16 26.5C12 24.7 8.5 20 8.5 14V8Z"
        fill="${GUARD_BLUE}" stroke="white" stroke-width="1.5" opacity="${opacity}"/>
      <path d="M12 15.2l2.6 2.6 5.4-5.6" fill="none" stroke="white" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}"/>
      <circle cx="24" cy="6" r="4.2" fill="${OPERATIONAL_DOT_COLOR[operational]}" stroke="white" stroke-width="1.3"/>
    </svg>
  `;

  return svgIcon(svg, size, Math.round(size * 0.47));
}


type AlarmMapProps = {
  alarms: Alarm[];
  trackers?: TrackerLocation[];
  guards?: Guard[];
  selectedGuardId?: string | null;
  // The alarm currently highlighted (from a panel row or a marker click) —
  // shows the gold selection halo. Separate from focusedAlarmId, which
  // drives the camera pan and is unrelated to which marker is visually
  // selected.
  selectedAlarmId?: string | null;
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
  isSelected,
  onMarkerClick,
}: {
  alarm: Alarm;
  isSelected: boolean;
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
        icon={getMarkerIcon(alarm.status, isSelected)}
        zIndex={isSelected ? 1000 : undefined}
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

  const operational = getOperationalStatus(guard);
  const connectivity = getConnectivityStatus(guard);
  const freshness = getLocationFreshness(guard);

  const OPERATIONAL_LABEL: Record<OperationalStatus, string> = {
    available: "Available",
    assigned: "Assigned",
    offDuty: "Off Duty",
  };
  const LOCATION_LABEL: Record<LocationFreshness, string> = {
    live: "Live location",
    recent: "Last location",
    stale: "Location may be outdated",
    none: "No location received yet",
  };

  return (
    <>
      <Marker
        ref={markerRef}
        position={{ lat: guard.currentLatitude, lng: guard.currentLongitude }}
        icon={getGuardMarkerIcon(operational, guard.isConnected, freshness, isSelected)}
        zIndex={isSelected ? 1000 : undefined}
        onClick={() => {
          setIsOpen(true);
          onMarkerClick?.(guard);
        }}
      />
      {isOpen && marker && (
        <InfoWindow anchor={marker} onCloseClick={() => setIsOpen(false)}>
          <div className="p-2 min-w-[170px]">
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
            <p className="text-xs mt-1">
              <span
                className="font-semibold"
                style={{ color: OPERATIONAL_DOT_COLOR[operational] }}
              >
                {OPERATIONAL_LABEL[operational]}
              </span>
            </p>
            <p className="text-xs text-gray-500">
              {connectivity === "connected" ? "Connected" : "Phone disconnected"}
              {guard.lastActiveAt && ` · Last seen ${timeAgo(guard.lastActiveAt)}`}
            </p>
            <p
              className="text-xs mt-1"
              style={{ color: freshness === "stale" ? "#b45309" : "#6b7280" }}
            >
              {LOCATION_LABEL[freshness]}
              {guard.locationUpdatedAt && ` · ${timeAgo(guard.locationUpdatedAt)}`}
            </p>
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
  selectedAlarmId,
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

  const [tilesLoaded, setTilesLoaded] = useState(false);

  return (
    <div className="relative flex h-full w-full min-h-0 flex-1 flex-col">
      {!tilesLoaded && (
        <div className="absolute inset-0 z-[1000] flex items-center justify-center rounded-lg bg-card">
          <LoaderIcon className="h-8 w-8 animate-spin text-muted-foreground" />
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
            isSelected={alarm.id === selectedAlarmId}
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
