import { Edit2, Loader2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";

import { useCreateAlarmReport } from "@/api/hooks/useCreateAlarmReport";
import { useGetAlarm } from "@/api/hooks/useGetAlarm";
import { useGetGuards } from "@/api/hooks/useGetGuards";
import { useUpdateAlarm } from "@/api/hooks/useUpdateAlarm";
import { AlarmMap } from "@/components/AlarmMap";
import { AlarmStatusBadge } from "@/components/AlarmStatusBadge";
import { notify } from "@/components/Alert/notify";
import {
  type CloseCaseData,
  CloseCaseDialog,
} from "@/components/CloseCaseDialog";
import { AlarmIcon } from "@/components/icons/AlarmIcon";
import { Loading } from "@/components/Loading";
import { PageHeader } from "@/components/PageHeader";
import { Body, Button, Heading } from "@/components/ui";
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

export function AlarmDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: alarm, isLoading, error } = useGetAlarm(id || "");
  const { data: guards } = useGetGuards();
  const [isUpdatingGuard, setIsUpdatingGuard] = useState(false);
  const [isCloseCaseDialogOpen, setIsCloseCaseDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "view">("create");
  const [isEditingArrivalTime, setIsEditingArrivalTime] = useState(false);
  const [arrivalTimeValue, setArrivalTimeValue] = useState("");
  const { mutate: updateAlarm } = useUpdateAlarm({
    onSuccess: (response) => {
      setIsUpdatingGuard(false);
      notify(
        response.message ||
          t("alarmDetail.updateSuccess", "Alarm updated successfully"),
        { type: "success" },
      );
    },
    onError: (error: any) => {
      setIsUpdatingGuard(false);
      notify(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          t("alarmDetail.updateError", "Failed to update alarm"),
        { type: "error" },
      );
    },
  });

  const { mutate: createAlarmReport, isPending: isCreatingReport } =
    useCreateAlarmReport({
      onSuccess: (response) => {
        setIsCloseCaseDialogOpen(false);
        notify(
          response.message ||
            "Alarm report created and case closed successfully",
          { type: "success" },
        );
      },
      onError: (error: any) => {
        notify(
          error?.response?.data?.message ||
            error?.response?.data?.error ||
            "Failed to create alarm report",
          { type: "error" },
        );
      },
    });

  const handleCloseCaseSubmit = (data: CloseCaseData) => {
    if (!id) return;

    createAlarmReport({
      alarmId: id,
      callLog: data.callLog as
        | "called_answered"
        | "called_no_answer"
        | "not_called",
      communicationType: data.communicationType as
        | "sms_sent"
        | "whatsapp_sent"
        | "no_sent",
      communicationNotes: data.communicationNotes || undefined,
      internalNotes: data.internalNotes || undefined,
      outcome: data.outcome as
        | "resolved_remotely"
        | "physical_response"
        | "false_alarm"
        | "escalated",
      whatHappened: data.whatHappened,
      learningIdentified: data.learningIdentified,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-background flex flex-col w-full">
        <PageHeader
          title={t("alarmDetail.title", "Alarm Details")}
          icon={<AlarmIcon size={30} />}
          className="px-4 sm:px-8"
        />
        <div className="flex-1 flex items-center justify-center">
          <Loading />
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
          className="px-4 sm:px-8"
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
        className="px-4 sm:px-8"
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
                  <AlarmStatusBadge status={alarm.status} />
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
                  <Body size="sm" className="text-muted-foreground">
                    {t("alarmDetail.acknowledgedBy", "Acknowledged By")}
                  </Body>
                  <Body className="font-medium">
                    {alarm.acknowledgedBy
                      ? alarm.acknowledgedBy.name
                      : t(
                          "alarmDetail.notYetAcknowledged",
                          "Not yet acknowledged",
                        )}
                  </Body>
                </div>

                <div>
                  {alarm.acknowledgedAt ? (
                    <div>
                      <Body size="sm" className="text-muted-foreground mb-2">
                        {t("alarmDetail.acknowledgedAt", "Acknowledged At")}
                      </Body>
                      <Body className="font-medium">
                        {formatDate(alarm.acknowledgedAt)}
                      </Body>
                    </div>
                  ) : (
                    <Button
                      className="w-full bg-purple-600 hover:bg-purple-700"
                      size="lg"
                      onClick={() => {
                        if (id) {
                          updateAlarm({
                            id,
                            status: "acknowledged",
                          });
                        }
                      }}
                      disabled={
                        alarm.status === "closed" ||
                        alarm.status === "cancelled"
                      }
                    >
                      {t("alarmDetail.acknowledge", "Acknowledge Alarm")}
                    </Button>
                  )}
                </div>

                <div>
                  <Body size="sm" className="text-muted-foreground">
                    {t("alarmDetail.guardAssignedAt", "Guard Assigned At")}
                  </Body>
                  <Body className="font-medium">
                    {alarm.guardId
                      ? alarm.guardAssignedAt
                        ? formatDate(alarm.guardAssignedAt)
                        : "-"
                      : t(
                          "alarmDetail.guardNotAssigned",
                          "Guard not yet assigned",
                        )}
                  </Body>
                </div>

                <div>
                  <Body size="sm" className="text-muted-foreground">
                    {t(
                      "alarmDetail.guardAcknowledgedAt",
                      "Guard Acknowledged At",
                    )}
                  </Body>
                  <Body className="font-medium">
                    {alarm.guardId
                      ? alarm.guardAcknowledgedAt
                        ? formatDate(alarm.guardAcknowledgedAt)
                        : t(
                            "alarmDetail.guardNotAcknowledged",
                            "Not yet acknowledged by guard",
                          )
                      : t(
                          "alarmDetail.guardNotAssigned",
                          "Guard not yet assigned",
                        )}
                  </Body>
                </div>

                <div>
                  <Body size="sm" className="text-muted-foreground">
                    {t("alarmDetail.guardArrivedAt", "Guard Arrived At")}
                  </Body>
                  {alarm.guardId ? (
                    alarm.guardArrivedAt ? (
                      <div>
                        {isEditingArrivalTime ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="datetime-local"
                              value={arrivalTimeValue}
                              onChange={(e) =>
                                setArrivalTimeValue(e.target.value)
                              }
                              className="flex-1 px-3 py-2 bg-card border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                              disabled={
                                alarm.status === "closed" ||
                                alarm.status === "cancelled"
                              }
                            />
                            <Button
                              size="sm"
                              onClick={() => {
                                if (id && arrivalTimeValue) {
                                  updateAlarm({
                                    id,
                                    guardArrivedAt: new Date(
                                      arrivalTimeValue,
                                    ).toISOString(),
                                  });
                                  setIsEditingArrivalTime(false);
                                }
                              }}
                              disabled={
                                !arrivalTimeValue ||
                                alarm.status === "closed" ||
                                alarm.status === "cancelled"
                              }
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setIsEditingArrivalTime(false)}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-2">
                            <Body className="font-medium">
                              {formatDate(alarm.guardArrivedAt)}
                            </Body>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 !hover:bg-gray-700"
                              onClick={() => {
                                const date = new Date(alarm.guardArrivedAt!);
                                const localDateTime = new Date(
                                  date.getTime() -
                                    date.getTimezoneOffset() * 60000,
                                )
                                  .toISOString()
                                  .slice(0, 16);
                                setArrivalTimeValue(localDateTime);
                                setIsEditingArrivalTime(true);
                              }}
                              disabled={
                                alarm.status === "closed" ||
                                alarm.status === "cancelled"
                              }
                            >
                              <Edit2 className="size-5 text-white" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (id) {
                            updateAlarm({
                              id,
                              guardArrivedAt: new Date().toISOString(),
                            });
                          }
                        }}
                        disabled={
                          alarm.status === "closed" ||
                          alarm.status === "cancelled"
                        }
                      >
                        {t(
                          "alarmDetail.markArrival",
                          "Mark Guard Arrived (Now)",
                        )}
                      </Button>
                    )
                  ) : (
                    <Body className="font-medium">
                      {t(
                        "alarmDetail.guardNotAssigned",
                        "Guard not yet assigned",
                      )}
                    </Body>
                  )}
                </div>

                <div>
                  <Body size="sm" className="text-muted-foreground mb-2">
                    {t("alarmDetail.assignedGuard", "Assigned Guard")}
                  </Body>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <Select
                        value={alarm.guardId ?? UNASSIGNED_GUARD}
                        onValueChange={(value) => {
                          setIsUpdatingGuard(true);
                          updateAlarm({
                            id: id!,
                            guardId:
                              value === UNASSIGNED_GUARD
                                ? (null as any)
                                : value,
                          });
                        }}
                        disabled={
                          isUpdatingGuard ||
                          alarm.status === "closed" ||
                          alarm.status === "cancelled"
                        }
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
                    {isUpdatingGuard && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  {(alarm.status === "open" ||
                    alarm.status === "acknowledged" ||
                    (alarm.status === "cancelled" && !alarm.report)) &&
                    !alarm.report && (
                      <Button
                        className="w-full text-lg bg-red-500 hover:bg-red-600"
                        size="lg"
                        onClick={() => {
                          setDialogMode("create");
                          setIsCloseCaseDialogOpen(true);
                        }}
                      >
                        {alarm.status === "cancelled" ? "Fill Report & Close" : "Close Case"}
                      </Button>
                    )}
                  {alarm.status === "closed" && alarm.report && (
                    <Button
                      className="w-full text-lg"
                      size="lg"
                      variant="outline"
                      onClick={() => {
                        setDialogMode("view");
                        setIsCloseCaseDialogOpen(true);
                      }}
                    >
                      View Report
                    </Button>
                  )}
                </div>
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
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
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

      <CloseCaseDialog
        alarm={alarm}
        open={isCloseCaseDialogOpen}
        onOpenChange={setIsCloseCaseDialogOpen}
        onSubmit={handleCloseCaseSubmit}
        isLoading={isCreatingReport}
        mode={dialogMode}
        initialData={alarm.report}
      />
    </div>
  );
}
