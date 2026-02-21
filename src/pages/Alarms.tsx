import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { useGetAlarms } from "@/api/hooks/useGetAlarms";
import { useGetGuards } from "@/api/hooks/useGetGuards";
import { useUpdateAlarm } from "@/api/hooks/useUpdateAlarm";
import type { AlarmStatus } from "@/api/types";
import { FormSelect } from "@/components/FormGroup/FormGroup";
import { AlarmIcon } from "@/components/icons/AlarmIcon";
import { Loading } from "@/components/Loading";
import { PageHeader } from "@/components/PageHeader";
import { Body } from "@/components/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { ChevronDown, Loader2, UserPlus } from "lucide-react";

export function Alarms() {
  const { t } = useTranslation();
  const {
    data: alarms,
    isLoading: isGetAlarmsLoading,
    error: iseGetAlarmsError,
  } = useGetAlarms();
  const { data: guards } = useGetGuards();
  const [updatingAlarmId, setUpdatingAlarmId] = useState<string | null>(null);

  const { mutate: updateAlarm } = useUpdateAlarm({
    onSuccess: () => {
      setUpdatingAlarmId(null);
    },
    onError: () => {
      setUpdatingAlarmId(null);
    },
  });

  const handleStatusChange = (alarmId: string, status: string) => {
    setUpdatingAlarmId(alarmId);
    updateAlarm({ id: alarmId, status: status as AlarmStatus });
  };

  const handleGuardAssign = (alarmId: string, guardId: string) => {
    setUpdatingAlarmId(alarmId);
    updateAlarm({ id: alarmId, guardId });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "open":
        return "bg-green-100 text-green-800 border-green-300";
      case "closed":
        return "bg-gray-100 text-gray-800 border-gray-300";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  if (isGetAlarmsLoading) return <Loading />;
  if (iseGetAlarmsError) return null;

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
                    {t("alarms.table.assignedGuard", "Assigned Guard")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {alarms.map((alarm) => (
                  <tr key={alarm.id} className="hover:bg-muted/50">
                    <td className="px-6 py-4">
                      <Link to={`/alarms/${alarm.id}`}>
                        <Body className="font-medium text-foreground hover:underline cursor-pointer">
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
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          className={`px-2 flex items-center gap-1 py-1 rounded-sm text-sm font-semibold border cursor-pointer ${getStatusColor(alarm.status)}`}
                        >
                          {alarm.status.charAt(0).toUpperCase() +
                            alarm.status.slice(1)}
                          <ChevronDown />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuRadioGroup
                            value={alarm.status}
                            onValueChange={(newStatus) =>
                              handleStatusChange(alarm.id, newStatus)
                            }
                          >
                            <DropdownMenuRadioItem value="pending">
                              Pending
                            </DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="open">
                              Open
                            </DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="closed">
                              Closed
                            </DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="cancelled">
                              Cancelled
                            </DropdownMenuRadioItem>
                          </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                    <td className="px-6 py-4">
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
                                // Handle clear - remove guard assignment
                                setUpdatingAlarmId(alarm.id);
                                updateAlarm({ id: alarm.id, guardId: null as any });
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
