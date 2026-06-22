import { Loader2, UserPlus } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { useGetAlarms } from "@/api/hooks/useGetAlarms";
import { useGetGuards } from "@/api/hooks/useGetGuards";
import { useUpdateAlarm } from "@/api/hooks/useUpdateAlarm";
import { notify } from "@/components/Alert/notify";
import { AlarmStatusBadge } from "@/components/AlarmStatusBadge";
import { FormSelect } from "@/components/FormGroup/FormGroup";
import { AlarmIcon } from "@/components/icons/AlarmIcon";
import { Loading } from "@/components/Loading";
import { PageHeader } from "@/components/PageHeader";
import { Body } from "@/components/ui";

export function Alarms() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    data: alarms,
    isLoading: isGetAlarmsLoading,
    error: iseGetAlarmsError,
  } = useGetAlarms();
  const { data: guards } = useGetGuards();
  const [updatingAlarmId, setUpdatingAlarmId] = useState<string | null>(null);

  const { mutate: updateAlarm } = useUpdateAlarm({
    onSuccess: (response) => {
      setUpdatingAlarmId(null);
      notify(response.message, { type: "success" });
    },
    onError: (error: Error) => {
      setUpdatingAlarmId(null);
      const errorMessage =
        (error as any).response?.data?.message || error.message;
      notify(errorMessage, { type: "error" });
    },
  });

  const handleGuardAssign = (alarmId: string, guardId: string) => {
    setUpdatingAlarmId(alarmId);
    updateAlarm({ id: alarmId, guardId });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (isGetAlarmsLoading) return <Loading />;
  if (iseGetAlarmsError) return null;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 pb-8 sm:px-8">
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
                    {t("alarms.table.assignedUser", "Assigned User")}
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-foreground">
                    {t("alarms.table.assignedGuard", "Assigned Guard")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {alarms.map((alarm) => (
                  <tr
                    key={alarm.id}
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={() => navigate(`/alarms/${alarm.id}`)}
                  >
                    <td className="px-6 py-4">
                      <Body className="font-medium text-foreground">
                        {alarm.userName}
                      </Body>
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
                      <AlarmStatusBadge status={alarm.status} />
                    </td>
                    <td className="px-6 py-4">
                      <Body size="sm">
                        {alarm.acknowledgedBy ? alarm.acknowledgedBy.name : "-"}
                      </Body>
                    </td>
                    <td
                      className="px-6 py-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <FormSelect
                            value={
                              alarm.guardId && guards
                                ? guards
                                    .filter((g) => g.id === alarm.guardId)
                                    .map((g) => ({
                                      value: g.id,
                                      label: g.name,
                                    }))[0] || null
                                : null
                            }
                            onChange={(option) => {
                              if (option && "value" in option) {
                                handleGuardAssign(alarm.id, option.value);
                              } else if (option === null) {
                                setUpdatingAlarmId(alarm.id);
                                updateAlarm({
                                  id: alarm.id,
                                  guardId: null as any,
                                });
                              }
                            }}
                            options={
                              guards?.map((guard) => ({
                                value: guard.id,
                                label: guard.name,
                              })) || []
                            }
                            placeholder={
                              <div className="flex items-center gap-2">
                                <UserPlus className="h-4 w-4" />
                                {t("alarms.assignGuard", "Assign Guard")}
                              </div>
                            }
                            isDisabled={updatingAlarmId === alarm.id}
                            isClearable
                          />
                        </div>
                        {updatingAlarmId === alarm.id && (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
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
