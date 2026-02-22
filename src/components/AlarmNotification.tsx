import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { useUpdateAlarm } from "@/api/hooks/useUpdateAlarm";
import type { Alarm } from "@/api/types";
import { notify } from "@/components/Alert/notify";
import { Body, Button, Heading } from "@/components/ui";
import { Dialog, DialogContent } from "@/components/ui/Dialog";

type AlarmNotificationProps = {
  alarms: Alarm[];
  onRemoveAlarm: (alarmId: string) => void;
};

export function AlarmNotification({
  alarms,
  onRemoveAlarm,
}: AlarmNotificationProps) {
  const { t } = useTranslation();
  const [acknowledgingIds, setAcknowledgingIds] = useState<Set<string>>(
    new Set(),
  );

  useEffect(() => {
    let audio: HTMLAudioElement | null = null;

    if (alarms.length > 0) {
      audio = new Audio("/alarm.wav");
      audio.volume = 0.8;
      audio.loop = true;
      audio.play().catch((error) => {
        console.error("Failed to play alarm sound:", error);
      });
    }

    return () => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    };
  }, [alarms.length]);

  const { mutate: updateAlarm } = useUpdateAlarm({
    onSuccess: (response, variables) => {
      notify(response.message, { type: "success" });
      onRemoveAlarm(variables.id);
      setAcknowledgingIds((prev) => {
        const next = new Set(prev);
        next.delete(variables.id);
        return next;
      });
    },
    onError: (error: Error, variables) => {
      const errorMessage =
        (error as any).response?.data?.message || error.message;
      notify(errorMessage, { type: "error" });
      setAcknowledgingIds((prev) => {
        const next = new Set(prev);
        next.delete(variables.id);
        return next;
      });
    },
  });

  const handleAcknowledge = (alarmId: string) => {
    setAcknowledgingIds((prev) => new Set(prev).add(alarmId));
    updateAlarm({
      id: alarmId,
      status: "open",
    });
  };

  const hasAlarms = alarms.length > 0;
  const alarmCount = alarms.length;

  return (
    <Dialog open={hasAlarms}>
      <DialogContent
        showCloseButton={false}
        className={`p-0 gap-0 !w-full overflow-hidden ${
          alarmCount === 1 ? "!max-w-xl" : "!max-w-6xl"
        }`}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {hasAlarms && (
          <>
            {/* Header */}
            <div className="bg-red-600 text-white p-8">
              <div className="flex items-center justify-center gap-4 mb-3">
                <span className="text-5xl animate-pulse">🚨</span>
                <Heading size="xxl" className="text-white">
                  {alarmCount === 1
                    ? t("alarmNotification.title", "Alarm Alert")
                    : t(
                        "alarmNotification.multipleTitle",
                        `${alarmCount} Active Alarms`,
                      )}
                </Heading>
                <span className="text-5xl animate-pulse">🚨</span>
              </div>
              <Body className="text-white/90 text-center text-lg">
                {alarmCount === 1
                  ? t("alarmNotification.subtitle", "Immediate action required")
                  : t(
                      "alarmNotification.multipleSubtitle",
                      "Multiple emergencies require attention",
                    )}
              </Body>
            </div>

            {/* Alarms Grid */}
            <div
              className={`p-8 ${
                alarmCount === 1
                  ? ""
                  : "max-h-[80vh] overflow-y-auto grid gap-6 md:grid-cols-2"
              }`}
            >
              {alarms.map((alarm) => (
                <div
                  key={alarm.id}
                  className={`space-y-3 ${
                    alarmCount > 1
                      ? "border border-border rounded-lg p-4 bg-card"
                      : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {alarm.userImage && (
                      <img
                        src={alarm.userImage}
                        alt={alarm.userName}
                        className={`rounded-full object-cover border-2 border-red-500 ${
                          alarmCount === 1 ? "w-16 h-16" : "w-12 h-12"
                        }`}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <Heading
                        size={alarmCount === 1 ? "lg" : "sm"}
                        className="mb-1 truncate"
                      >
                        {alarm.userName}
                      </Heading>
                      <Body
                        size="sm"
                        className="text-muted-foreground truncate"
                      >
                        {alarm.userPhone}
                      </Body>
                    </div>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-3">
                    <Body size="sm" className="text-muted-foreground mb-1">
                      {t("alarmNotification.location")}
                    </Body>
                    <Body size="sm" className="font-mono">
                      {alarm.latitude.toFixed(6)}, {alarm.longitude.toFixed(6)}
                    </Body>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-3">
                    <Body size="sm" className="text-muted-foreground mb-1">
                      {t("alarmNotification.time")}
                    </Body>
                    <Body size="sm">
                      {new Date(alarm.createdAt).toLocaleString()}
                    </Body>
                  </div>

                  <Button
                    className="w-full bg-red-600 hover:bg-red-700"
                    size={alarmCount === 1 ? "default" : "sm"}
                    onClick={() => handleAcknowledge(alarm.id)}
                    disabled={acknowledgingIds.has(alarm.id)}
                  >
                    {acknowledgingIds.has(alarm.id)
                      ? t("alarmNotification.acknowledging", "Acknowledging...")
                      : t("alarmNotification.acknowledge", "Acknowledge")}
                  </Button>
                </div>
              ))}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
