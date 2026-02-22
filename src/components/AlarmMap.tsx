import "leaflet/dist/leaflet.css";

import L from "leaflet";
// Fix for default marker icon in React-Leaflet
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";

import type { Alarm } from "@/api/types";

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

type AlarmMapProps = {
  alarms: Alarm[];
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

export function AlarmMap({ alarms, focusedAlarmId }: AlarmMapProps) {
  // Default center (Nairobi, Kenya)
  const defaultCenter: [number, number] = [-1.2921, 36.8219];

  // If we have alarms, center on the first one
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
        <Marker key={alarm.id} position={[alarm.latitude, alarm.longitude]}>
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
    </MapContainer>
  );
}
