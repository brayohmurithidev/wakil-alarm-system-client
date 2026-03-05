import { useInitiatingAlarm } from "@/contexts/InitiatingAlarmContext";
import { Body, Heading } from "@/components/ui";
import { Dialog, DialogContent } from "@/components/ui/Dialog";

import { InitiatingAlarmIndicator } from "./InitiatingAlarmIndicator";

export const InitiatingAlarmsContainer = () => {
  const { initiatingAlarms } = useInitiatingAlarm();

  const hasAlarms = initiatingAlarms.length > 0;
  const alarmCount = initiatingAlarms.length;

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
            <div className="bg-yellow-500 text-gray-900 p-8">
              <div className="flex items-center justify-center gap-4 mb-3">
                <span className="text-5xl animate-pulse">⏳</span>
                <Heading size="xxl" className="text-gray-900">
                  {alarmCount === 1
                    ? "Initiating Alarm"
                    : `${alarmCount} Alarms Initiating`}
                </Heading>
                <span className="text-5xl animate-pulse">⏳</span>
              </div>
              <Body className="text-gray-900/90 text-center text-lg">
                {alarmCount === 1
                  ? "User is holding alarm button..."
                  : "Multiple users initiating alarms"}
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
              {initiatingAlarms.map((alarm) => (
                <div
                  key={alarm.id}
                  className={`space-y-4 ${
                    alarmCount > 1
                      ? "border border-border rounded-lg p-4 bg-card"
                      : ""
                  }`}
                >
                  <div className="flex flex-col items-center gap-4">
                    <InitiatingAlarmIndicator alarm={alarm} />

                    {alarm.userImage && (
                      <img
                        src={alarm.userImage}
                        alt={alarm.userName}
                        className={`rounded-full object-cover border-2 border-yellow-500 ${
                          alarmCount === 1 ? "w-16 h-16" : "w-12 h-12"
                        }`}
                      />
                    )}

                    <div className="text-center">
                      <Heading
                        size={alarmCount === 1 ? "lg" : "sm"}
                        className="mb-1"
                      >
                        {alarm.userName}
                      </Heading>
                      <Body size="sm" className="text-muted-foreground">
                        {alarm.userPhone}
                      </Body>
                    </div>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-3">
                    <Body size="sm" className="text-muted-foreground mb-1">
                      Location
                    </Body>
                    <Body size="sm" className="font-mono">
                      {alarm.latitude.toFixed(6)}, {alarm.longitude.toFixed(6)}
                    </Body>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-3">
                    <Body size="sm" className="text-muted-foreground mb-1">
                      Started
                    </Body>
                    <Body size="sm">
                      {new Date(alarm.createdAt).toLocaleString()}
                    </Body>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
