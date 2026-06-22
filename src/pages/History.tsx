import { History as HistoryIcon, Loader2, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { useGetAlarms } from "@/api/hooks/useGetAlarms";
import { useGetGuards } from "@/api/hooks/useGetGuards";
import { useUpdateAlarm } from "@/api/hooks/useUpdateAlarm";
import type { AlarmStatus } from "@/api/types";
import { AlarmStatusBadge } from "@/components/AlarmStatusBadge";
import { notify } from "@/components/Alert/notify";
import { FormInput } from "@/components/FormGroup/FormGroup";
import { Loading } from "@/components/Loading";
import { PageHeader } from "@/components/PageHeader";
import { Body } from "@/components/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";

// Radix Select rejects an empty-string item value, so unassigning a guard
// needs an explicit sentinel item rather than a clearable empty state.
const UNASSIGNED_GUARD = "__unassigned__";

type SearchFormData = {
  search: string;
};

export function History() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    data: alarms,
    isLoading: isGetAlarmsLoading,
    error: iseGetAlarmsError,
  } = useGetAlarms();
  const { data: guards } = useGetGuards();
  const [updatingAlarmId, setUpdatingAlarmId] = useState<string | null>(null);

  const { register, watch } = useForm<SearchFormData>({
    defaultValues: {
      search: "",
    },
  });

  const searchQuery = watch("search");

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

  const closedAlarms = useMemo(() => {
    const closed = alarms?.filter((alarm) => alarm.status === "closed") || [];

    if (!searchQuery.trim()) {
      return closed;
    }

    const query = searchQuery.toLowerCase();
    return closed.filter(
      (alarm) =>
        alarm.userName.toLowerCase().includes(query) ||
        alarm.userPhone.toLowerCase().includes(query),
    );
  }, [alarms, searchQuery]);

  if (isGetAlarmsLoading) return <Loading />;
  if (iseGetAlarmsError) return null;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 pb-8 sm:px-8">
      <PageHeader
        title={t("history.title", "History")}
        icon={<HistoryIcon size={30} />}
        actions={
          <FormInput
            type="text"
            placeholder={t("history.search", "Search by name or phone...")}
            icon={<Search className="h-5 w-5" />}
            {...register("search")}
          />
        }
      />

      {closedAlarms && closedAlarms.length > 0 ? (
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
                {closedAlarms.map((alarm) => (
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
                          <Select
                            value={alarm.guardId ?? UNASSIGNED_GUARD}
                            onValueChange={(value) => {
                              if (value === UNASSIGNED_GUARD) {
                                setUpdatingAlarmId(alarm.id);
                                updateAlarm({
                                  id: alarm.id,
                                  guardId: null as any,
                                });
                              } else {
                                handleGuardAssign(alarm.id, value);
                              }
                            }}
                            disabled={updatingAlarmId === alarm.id}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={UNASSIGNED_GUARD}>
                                {t("alarmDetail.unassigned", "Unassigned")}
                              </SelectItem>
                              {guards?.map((guard) => (
                                <SelectItem key={guard.id} value={guard.id}>
                                  {guard.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
      ) : (
        <div className="bg-card rounded-lg shadow-md p-8 text-center">
          <Body className="text-muted-foreground">
            {searchQuery.trim()
              ? t("history.noResults", "No results found for your search")
              : t("history.noClosedAlarms", "No closed alarms found")}
          </Body>
        </div>
      )}
    </div>
  );
}
