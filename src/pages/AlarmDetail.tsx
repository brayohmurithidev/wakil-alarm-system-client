import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useTranslation } from "react-i18next";
import { MapContainer, Marker, Polyline, TileLayer } from "react-leaflet";
import { useParams, useNavigate } from "react-router-dom";

import { useGetAlarm } from "@/api/hooks/useGetAlarm";
import { useUpdateAlarmStatus } from "@/api/hooks/useUpdateAlarmStatus";
import { AlarmIcon } from "@/components/icons/AlarmIcon";
import { Loading } from "@/components/Loading";
import { PageHeader } from "@/components/PageHeader";
import { Body, Button, Heading } from "@/components/ui";

import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

export function AlarmDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: alarm, isLoading, error } = useGetAlarm(id || "");
  const { mutate: updateStatus } = useUpdateAlarmStatus();

  const handleStatusChange = (status: string) => {
    if (id) {
      updateStatus({ id, status });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-warning/30 text-warning";
      case "open":
        return "bg-destructive/10 text-destructive";
      case "closed":
        return "bg-green-500/10 text-green-600";
      case "cancelled":
        return "bg-gray-500/10 text-gray-600";
      default:
        return "bg-yellow-500/10 text-yellow-600";
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-background flex flex-col w-full">
        <PageHeader
          title={t("alarmDetail.title", "Alarm Details")}
          icon={<AlarmIcon size={30} />}
        />
        <div className="flex-1 flex items-center justify-center">
          <Loading text={t("alarmDetail.loading", "Loading alarm...")} />
        </div>
      </div>
    );
  }

  if (error || !alarm) {
    return (
      <div className="h-screen bg-background flex flex-col w-full">
        <PageHeader
          title={t("alarmDetail.title", "Alarm Details")}
          icon={<AlarmIcon size={30} />}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Body className="text-destructive mb-4">
              {t("alarmDetail.error", "Failed to load alarm")}
            </Body>
            <Button onClick={() => navigate("/alarms")}>
              {t("alarmDetail.backToAlarms", "Back to Alarms")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const locationTrail: [number, number][] = alarm.locations.map((loc) => [
    loc.latitude,
    loc.longitude,
  ]);

  const center: [number, number] = [alarm.latitude, alarm.longitude];

  return (
    <div className="h-screen bg-background flex flex-col w-full">
      <PageHeader
        title={t("alarmDetail.title", "Alarm Details")}
        icon={<AlarmIcon size={30} />}
      />

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto">
          <Button
            variant="outline"
            className="mb-4"
            onClick={() => navigate("/alarms")}
          >
            ← {t("alarmDetail.backToAlarms", "Back to Alarms")}
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Alarm Info Card */}
            <div className="bg-card rounded-lg shadow-md p-6">
              <Heading size="lg" className="mb-4">
                {t("alarmDetail.info", "Alarm Information")}
              </Heading>

              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <Body size="sm" className="text-muted-foreground">
                      {t("alarmDetail.user", "User")}
                    </Body>
                    <Body className="font-medium text-lg">{alarm.userName}</Body>
                  </div>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(alarm.status)}`}
                  >
                    {alarm.status}
                  </span>
                </div>

                <div>
                  <Body size="sm" className="text-muted-foreground">
                    {t("alarmDetail.phone", "Phone")}
                  </Body>
                  <Body className="font-medium">{alarm.userPhone}</Body>
                </div>

                <div>
                  <Body size="sm" className="text-muted-foreground">
                    {t("alarmDetail.location", "Location")}
                  </Body>
                  <Body className="font-medium">
                    {alarm.latitude.toFixed(6)}, {alarm.longitude.toFixed(6)}
                  </Body>
                </div>

                <div>
                  <Body size="sm" className="text-muted-foreground">
                    {t("alarmDetail.created", "Created")}
                  </Body>
                  <Body className="font-medium">
                    {formatDate(alarm.createdAt)}
                  </Body>
                </div>

                {alarm.status !== "closed" && alarm.status !== "cancelled" && (
                  <div className="pt-4 border-t border-border">
                    <Body size="sm" className="text-muted-foreground mb-2">
                      {t("alarmDetail.actions", "Actions")}
                    </Body>
                    <div className="flex gap-2 flex-wrap">
                      {alarm.status === "pending" && (
                        <Button
                          variant="outline"
                          onClick={() => handleStatusChange("open")}
                        >
                          {t("alarms.escalate", "Escalate")}
                        </Button>
                      )}
                      <Button onClick={() => handleStatusChange("closed")}>
                        {t("alarms.close", "Close")}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleStatusChange("cancelled")}
                      >
                        {t("alarms.cancel", "Cancel")}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Location History Card */}
            <div className="bg-card rounded-lg shadow-md p-6">
              <Heading size="lg" className="mb-4">
                {t("alarmDetail.locationHistory", "Location History")}
              </Heading>

              {alarm.locations.length === 0 ? (
                <Body className="text-muted-foreground">
                  {t("alarmDetail.noLocations", "No location updates yet")}
                </Body>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {alarm.locations.map((loc, index) => (
                    <div
                      key={loc.id}
                      className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <Body size="sm" className="font-medium">
                          {loc.latitude.toFixed(6)}, {loc.longitude.toFixed(6)}
                        </Body>
                        <Body size="sm" className="text-muted-foreground">
                          {formatDate(loc.timestamp)}
                        </Body>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Map */}
          <div className="mt-6 bg-card rounded-lg shadow-md p-6">
            <Heading size="lg" className="mb-4">
              {t("alarmDetail.map", "Map")}
            </Heading>
            <div className="h-96 rounded-lg overflow-hidden">
              <MapContainer center={center} zoom={15} className="h-full w-full">
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={center} />
                {locationTrail.length > 1 && (
                  <Polyline
                    positions={locationTrail}
                    pathOptions={{ color: "blue", weight: 3 }}
                  />
                )}
              </MapContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
