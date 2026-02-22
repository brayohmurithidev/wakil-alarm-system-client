import clsx from "clsx";
import { ChevronDown, Loader2, UserPlus } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";

import { useGetAlarm } from "@/api/hooks/useGetAlarm";
import { useGetGuards } from "@/api/hooks/useGetGuards";
import { useUpdateAlarm } from "@/api/hooks/useUpdateAlarm";
import type { AlarmStatus } from "@/api/types";
import { AlarmMap } from "@/components/AlarmMap";
import { notify } from "@/components/Alert/notify";
import { FormSelect } from "@/components/FormGroup/FormGroup";
import { AlarmIcon } from "@/components/icons/AlarmIcon";
import { Loading } from "@/components/Loading";
import { PageHeader } from "@/components/PageHeader";
import { Body, Button, Heading } from "@/components/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";

export function AlarmDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: alarm, isLoading, error } = useGetAlarm(id || "");
  const { data: guards } = useGetGuards();
  const [isUpdatingGuard, setIsUpdatingGuard] = useState(false);
  const { mutate: updateAlarm } = useUpdateAlarm({
    onSuccess: (response) => {
      setIsUpdatingGuard(false);
      notify(
        response.message || t("alarmDetail.updateSuccess", "Alarm updated successfully"),
        { type: "success" }
      );
    },
    onError: (error: any) => {
      setIsUpdatingGuard(false);
      notify(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          t("alarmDetail.updateError", "Failed to update alarm"),
        { type: "error" }
      );
    },
  });

  const handleStatusChange = (status: AlarmStatus) => {
    if (id) {
      updateAlarm({ id, status });
    }
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
                    <Body className="font-medium text-lg">
                      {alarm.userName}
                    </Body>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      disabled={
                        alarm.status === "closed" ||
                        alarm.status === "cancelled"
                      }
                      className={clsx(
                        "px-2 flex items-center gap-1 py-1 rounded-sm text-sm font-semibold border",
                        alarm.status === "closed" ||
                          alarm.status === "cancelled"
                          ? "cursor-not-allowed opacity-50"
                          : "cursor-pointer",
                        getStatusColor(alarm.status),
                      )}
                    >
                      {alarm.status.charAt(0).toUpperCase() +
                        alarm.status.slice(1)}
                      {!(
                        alarm.status === "closed" ||
                        alarm.status === "cancelled"
                      ) && <ChevronDown />}
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuRadioGroup
                        value={alarm.status}
                        onValueChange={(newStatus) =>
                          handleStatusChange(newStatus as AlarmStatus)
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

                <div>
                  <Body size="sm" className="text-muted-foreground mb-2">
                    {t("alarmDetail.assignedGuard", "Assigned Guard")}
                  </Body>
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
                            setIsUpdatingGuard(true);
                            updateAlarm({ id: id!, guardId: option.value });
                          } else if (option === null) {
                            setIsUpdatingGuard(true);
                            updateAlarm({ id: id!, guardId: null as any });
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
                        isDisabled={
                          isUpdatingGuard ||
                          alarm.status === "closed" ||
                          alarm.status === "cancelled"
                        }
                        isClearable
                      />
                    </div>
                    {isUpdatingGuard && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
                    )}
                  </div>
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
                          onClick={() =>
                            handleStatusChange("open" as AlarmStatus)
                          }
                        >
                          {t("alarms.escalate", "Escalate")}
                        </Button>
                      )}
                      <Button
                        onClick={() =>
                          handleStatusChange("closed" as AlarmStatus)
                        }
                      >
                        {t("alarms.close", "Close")}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() =>
                          handleStatusChange("cancelled" as AlarmStatus)
                        }
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
              <AlarmMap alarms={[alarm]} focusedAlarmId={alarm.id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
