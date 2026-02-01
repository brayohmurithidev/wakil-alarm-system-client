import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

import type { Alarm } from "@/api/types";

// Fix for default marker icon in React-Leaflet
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

type AlarmMapProps = {
  alarms: Alarm[];
};

export function AlarmMap({ alarms }: AlarmMapProps) {
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
