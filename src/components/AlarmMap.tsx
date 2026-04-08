import "leaflet/dist/leaflet.css";

import L from "leaflet";
// Fix for default marker icon in React-Leaflet
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";

import type { TrackerLocation } from "@/api/hooks/useGetTrackerLocation";
import type { Alarm, AlarmStatus } from "@/api/types";

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

type AlarmMapProps = {
  alarms: Alarm[];
  trackers?: TrackerLocation[];
  focusedAlarmId?: string | null;
};

// Component to handle map focus/zoom
function MapFocusHandler({
  alarms,
  focusedAlarmId,
}: {
  alarms: Alarm[];
  focusedAlarmId?: string | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (focusedAlarmId) {
      const alarm = alarms.find((a) => a.id === focusedAlarmId);
      if (alarm) {
        map.flyTo([alarm.latitude, alarm.longitude], 16, {
          duration: 1.5,
        });
      }
    }
  }, [focusedAlarmId, alarms, map]);

  return null;
}

export function AlarmMap({ alarms, trackers, focusedAlarmId }: AlarmMapProps) {
  const defaultCenter: [number, number] = [-1.2921, 36.8219];

  const center: [number, number] =
    alarms.length > 0
      ? [alarms[0].latitude, alarms[0].longitude]
      : defaultCenter;

  return (
    <MapContainer
      center={center}
      zoom={12}
      className="h-full w-full rounded-lg"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapFocusHandler alarms={alarms} focusedAlarmId={focusedAlarmId} />
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
    </MapContainer>
  );
}
