import "leaflet/dist/leaflet.css";

import L from "leaflet";
// Fix for default marker icon in React-Leaflet
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";

import type { TrackerLocation } from "@/api/hooks/useGetTrackerLocation";
import type { Alarm, AlarmStatus, Guard, GuardStatus } from "@/api/types";

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

const getMarkerIcon = (status: AlarmStatus) => {
  const colors: Record<AlarmStatus, string> = {
    pending: "#f97316",
    open: "#3b82f6",
    acknowledged: "#a855f7",
    closed: "#6b7280",
    cancelled: "#9ca3af",
    unknown: "#9ca3af",
  };

  const color = colors[status] || colors.unknown;

  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        position: relative;
        width: 32px;
        height: 32px;
      ">
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="${color}"
          stroke="white"
          stroke-width="1.5"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

const getTrackerIcon = () => {
  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        position: relative;
        width: 36px;
        height: 36px;
      ">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="#10b981" stroke="white" stroke-width="1.5" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10"/>
          <path d="M8 12l2-4h4l2 4-2 4h-4l-2-4z" fill="white" stroke="none"/>
        </svg>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
};

const GUARD_STATUS_COLOR: Record<GuardStatus, string> = {
  available: "#22c55e",
  busy: "#fbd63d",
  offline: "#6b7280",
};

const getGuardIcon = (status: GuardStatus, selected = false) => {
  const color = GUARD_STATUS_COLOR[status];
  const size = selected ? 46 : 34;
  const anchor = size / 2;

  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        position: relative;
        width: ${size}px;
        height: ${size}px;
      ">
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          ${selected ? `<circle cx="12" cy="12" r="11.25" fill="none" stroke="#fbd63d" stroke-width="1.5"/>` : ""}
          <circle cx="12" cy="12" r="10" fill="${color}" stroke="white" stroke-width="1.5"/>
          <path d="M12 11a3 3 0 100-6 3 3 0 000 6zm-5 6a5 5 0 0110 0H7z" fill="white"/>
        </svg>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [anchor, anchor],
    popupAnchor: [0, -anchor],
  });
};

type AlarmMapProps = {
  alarms: Alarm[];
  trackers?: TrackerLocation[];
  guards?: Guard[];
  selectedGuardId?: string | null;
  focusedAlarmId?: string | null;
};

// Component to handle map focus/zoom
function MapFocusHandler({
  alarms,
  guards,
  selectedGuardId,
  focusedAlarmId,
}: {
  alarms: Alarm[];
  guards?: Guard[];
  selectedGuardId?: string | null;
  focusedAlarmId?: string | null;
}) {
  const map = useMap();

  useEffect(() => {
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
      const bounds = L.latLngBounds(
        [alarm.latitude, alarm.longitude],
        [selectedGuard.currentLatitude as number, selectedGuard.currentLongitude as number],
      );
      map.flyToBounds(bounds, { padding: [60, 60], maxZoom: 16, duration: 1.5 });
    } else {
      map.flyTo([alarm.latitude, alarm.longitude], 16, {
        duration: 1.5,
      });
    }
  }, [focusedAlarmId, alarms, guards, selectedGuardId, map]);

  return null;
}

export function AlarmMap({ alarms, trackers, guards, selectedGuardId, focusedAlarmId }: AlarmMapProps) {
  const defaultCenter: [number, number] = [-1.2921, 36.8219];

  const center: [number, number] =
    alarms.length > 0
      ? [alarms[0].latitude, alarms[0].longitude]
      : defaultCenter;

  const locatingGuards = guards?.filter(
    (guard) =>
      guard.status !== "offline" &&
      (guard.currentLatitude == null || guard.currentLongitude == null),
  );

  return (
    <div className="relative h-full w-full">
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
      <MapContainer
        center={center}
        zoom={12}
        className="h-full w-full rounded-lg"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapFocusHandler
          alarms={alarms}
          guards={guards}
          selectedGuardId={selectedGuardId}
          focusedAlarmId={focusedAlarmId}
        />
        {alarms.map((alarm) => (
          <Marker
            key={alarm.id}
            position={[alarm.latitude, alarm.longitude]}
            icon={getMarkerIcon(alarm.status)}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-bold text-lg">{alarm.userName}</h3>
                <p className="text-sm text-gray-600">{alarm.userPhone}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Status:
                  <span className="font-semibold text-red-600">
                    {alarm.status}
                  </span>
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(alarm.createdAt).toLocaleString()}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
        {trackers?.map((tracker) => (
          <Marker
            key={tracker.imei}
            position={[tracker.latitude, tracker.longitude]}
            icon={getTrackerIcon()}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-bold text-lg">Motorcycle</h3>
                <p className="text-sm text-gray-600">IMEI: {tracker.imei}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Speed: {tracker.speed} km/h
                </p>
                <p className="text-xs text-gray-500">
                  Battery: {tracker.battery}%
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {tracker.gpsTime}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
        {guards
          ?.filter(
            (guard): guard is Guard & { currentLatitude: number; currentLongitude: number } =>
              guard.currentLatitude != null && guard.currentLongitude != null,
          )
          .map((guard) => {
            const isSelected = guard.id === selectedGuardId;
            return (
              <Marker
                key={guard.id}
                position={[guard.currentLatitude, guard.currentLongitude]}
                icon={getGuardIcon(guard.status, isSelected)}
                zIndexOffset={isSelected ? 1000 : 0}
              >
                <Popup>
                  <div className="p-2">
                    {isSelected && (
                      <p className="text-xs font-bold mb-1" style={{ color: "#fbd63d" }}>
                        ASSIGNED GUARD
                      </p>
                    )}
                    <h3 className="font-bold text-lg">{guard.name}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Status:
                      <span className="font-semibold" style={{ color: GUARD_STATUS_COLOR[guard.status] }}>
                        {" "}{guard.status}
                      </span>
                    </p>
                    {guard.locationUpdatedAt && (
                      <p className="text-xs text-gray-400 mt-1">
                        Updated {new Date(guard.locationUpdatedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
      </MapContainer>
    </div>
  );
}
