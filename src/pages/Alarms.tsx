import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { useGetAlarms } from "@/api/hooks/useGetAlarms";
import { useUpdateAlarmStatus } from "@/api/hooks/useUpdateAlarmStatus";
import { AlarmIcon } from "@/components/icons/AlarmIcon";
import { PageHeader } from "@/components/PageHeader";
import { Body, Button } from "@/components/ui";

export function Alarms() {
  const { t } = useTranslation();
  const { data: alarms } = useGetAlarms();
  const { mutate: updateStatus } = useUpdateAlarmStatus();

  const handleStatusChange = (alarmId: string, status: string) => {
    updateStatus({ id: alarmId, status });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="min-w-7xl">
      <PageHeader title={t("alarms.title")} icon={<AlarmIcon size={30} />} />
      {alarms && alarms.length > 0 && (
        <div className="bg-card rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-foreground">
                    {t("alarms.table.user", "User")}
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-foreground">
                    {t("alarms.table.phone", "Phone")}
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-foreground">
                    {t("alarms.table.location", "Location")}
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-foreground">
                    {t("alarms.table.time", "Time")}
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-foreground">
                    {t("alarms.table.status", "Status")}
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-foreground">
                    {t("alarms.table.actions", "Actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {alarms.map((alarm) => (
                  <tr key={alarm.id} className="hover:bg-muted/50">
                    <td className="px-6 py-4">
                      <Link to={`/alarms/${alarm.id}`}>
                        <Body className="font-medium text-primary hover:underline cursor-pointer">
                          {alarm.userName}
                        </Body>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <Body>{alarm.userPhone}</Body>
                    </td>
                    <td className="px-6 py-4">
                      <Body size="sm">
                        {alarm.latitude.toFixed(6)},{" "}
                        {alarm.longitude.toFixed(6)}
                      </Body>
                    </td>
                    <td className="px-6 py-4">
                      <Body size="sm">{formatDate(alarm.createdAt)}</Body>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          alarm.status === "pending"
                            ? "bg-warning/30 text-warning"
                            : alarm.status === "open"
                              ? "bg-destructive/10 text-destructive"
                              : alarm.status === "closed"
                                ? "bg-green-500/10 text-green-600"
                                : alarm.status === "cancelled"
                                  ? "bg-gray-500/10 text-gray-600"
                                  : "bg-yellow-500/10 text-yellow-600"
                        }`}
                      >
                        {alarm.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {alarm.status === "pending" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(alarm.id, "open")}
                          >
                            {t("alarms.escalate", "Escalate")}
                          </Button>
                        )}
                        {(alarm.status === "pending" ||
                          alarm.status === "open") && (
                          <>
                            <Button
                              size="sm"
                              onClick={() =>
                                handleStatusChange(alarm.id, "closed")
                              }
                            >
                              {t("alarms.close", "Close")}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleStatusChange(alarm.id, "cancelled")
                              }
                            >
                              {t("alarms.cancel", "Cancel")}
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
