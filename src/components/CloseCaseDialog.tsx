import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import type { Alarm, AlarmReport } from "@/api/types";
import wakilLogo from "@/assets/wakil-gold.png";
import {
  FormInput,
  FormLabel,
  FormTextarea,
} from "@/components/FormGroup/FormGroup";
import { GuardIncidentReportCard } from "@/components/GuardIncidentReportCard";
import { Body, Button, Heading } from "@/components/ui";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";

type CloseCaseDialogProps = {
  alarm: Alarm;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CloseCaseData) => void;
  isLoading?: boolean;
  mode?: "create" | "view";
  initialData?: AlarmReport | null;
};

const closeCaseSchema = z.object({
  callLog: z
    .string()
    .min(1, "Please select a call status")
    .refine(
      (val) =>
        ["called_answered", "called_no_answer", "not_called"].includes(val),
      {
        message: "Please select a valid call status",
      }
    ),
  communicationType: z
    .string()
    .min(1, "Please select a communication type")
    .refine((val) => ["sms_sent", "whatsapp_sent", "no_sent"].includes(val), {
      message: "Please select a valid communication type",
    }),
  communicationNotes: z.string().optional(),
  internalNotes: z.string().optional(),
  outcome: z
    .string()
    .min(1, "Please select an outcome")
    .refine(
      (val) =>
        [
          "resolved_remotely",
          "physical_response",
          "false_alarm",
          "escalated",
        ].includes(val),
      {
        message: "Please select a valid outcome",
      }
    ),
  whatHappened: z
    .string()
    .min(1, "Please describe what happened")
    .min(10, "Please provide at least 10 characters"),
  learningIdentified: z.boolean().default(false),
  videoRecordingId: z.string().optional(),
});

export type CloseCaseData = z.infer<typeof closeCaseSchema>;

export function CloseCaseDialog({
  alarm,
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
  mode = "create",
  initialData = null,
}: CloseCaseDialogProps) {
  const isViewMode = mode === "view";

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CloseCaseData>({
    resolver: zodResolver(closeCaseSchema) as any,
    defaultValues: {
      callLog: "",
      communicationType: "",
      communicationNotes: "",
      internalNotes: "",
      outcome: "",
      whatHappened: "",
      learningIdentified: false,
      videoRecordingId: "",
    },
  });

  useEffect(() => {
    if (!open) {
      reset();
    } else if (isViewMode && initialData) {
      // Populate form with existing report data in view mode
      reset({
        callLog: initialData.callLog,
        communicationType: initialData.communicationType,
        communicationNotes: initialData.communicationNotes || "",
        internalNotes: initialData.internalNotes || "",
        outcome: initialData.outcome,
        whatHappened: initialData.whatHappened,
        learningIdentified: initialData.learningIdentified,
        videoRecordingId: initialData.videoRecordingId || "",
      });
    }
  }, [open, reset, isViewMode, initialData]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const calculateTimeDifference = (start: string, end: string) => {
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    const diffMs = endTime - startTime;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);

    if (diffHours > 0) {
      const mins = diffMins % 60;
      return `${diffHours}h ${mins}m`;
    } else if (diffMins > 0) {
      const secs = diffSecs % 60;
      return `${diffMins}m ${secs}s`;
    } else {
      return `${diffSecs}s`;
    }
  };

  const onFormSubmit = (data: CloseCaseData) => {
    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-400! sm:max-w-400! md:max-w-400! lg:max-w-400! max-h-[90vh] w-[95vw] overflow-y-auto">
        <DialogHeader className="text-white">
          <DialogTitle className="flex items-center gap-3">
            <img src={wakilLogo} alt="Wakil" className="size-16 w-auto" />
          </DialogTitle>
          <DialogTitle className="mx-auto pb-8">
            <Heading size="xxl">
              {isViewMode ? "View Alarm Report" : "Alarm report"}
            </Heading>
          </DialogTitle>
        </DialogHeader>

        <form
          id="close-case-form"
          onSubmit={handleSubmit(onFormSubmit)}
          className="space-y-12 pb-12 max-w-4xl w-full mx-auto"
        >
          <div className="space-y-8">
            <Heading size="xl" className="border-b pb-2">
              A. Case Detail
            </Heading>
            <div className="space-y-2 bg-muted/30 p-4 rounded-lg">
              <div className="flex justify-between items-center text-sm">
                <Body size="sm" className="text-muted-foreground">
                  Alarm ID
                </Body>
                <Body size="sm" className="font-medium">
                  {alarm.id}
                </Body>
              </div>
              <div className="flex justify-between items-center text-sm">
                <Body size="sm" className="text-muted-foreground">
                  User ID
                </Body>
                <Body size="sm" className="font-medium">
                  {alarm.userId}
                </Body>
              </div>
              <div className="flex justify-between items-center text-sm">
                <Body size="sm" className="text-muted-foreground">
                  User
                </Body>
                <Body size="sm" className="font-medium">
                  {alarm.userName}
                </Body>
              </div>
              <div className="flex justify-between items-center text-sm">
                <Body size="sm" className="text-muted-foreground">
                  Phone
                </Body>
                <Body size="sm" className="font-medium">
                  {alarm.userPhone}
                </Body>
              </div>
              <div className="flex justify-between items-center text-sm">
                <Body size="sm" className="text-muted-foreground">
                  Location
                </Body>
                <Body size="sm" className="font-medium">
                  {alarm.latitude.toFixed(6)}, {alarm.longitude.toFixed(6)}
                </Body>
              </div>
              <div className="flex justify-between items-center text-sm">
                <Body size="sm" className="text-muted-foreground">
                  Status
                </Body>
                <Body size="sm" className="font-medium">
                  {alarm.status}
                </Body>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <Heading size="xl" className="border-b pb-2">
              B. Event Timeline
            </Heading>
            <div className="space-y-2 bg-muted/30 p-4 rounded-lg">
              <div className="flex justify-between items-center text-sm">
                <Body size="sm" className="text-muted-foreground">
                  Alarm received
                </Body>
                <Body size="sm" className="font-medium">
                  {formatDate(alarm.createdAt)}
                </Body>
              </div>
              <div className="flex justify-between items-center text-sm">
                <Body size="sm" className="text-muted-foreground">
                  Acknowledged by
                </Body>
                <Body size="sm" className="font-medium">
                  {alarm.acknowledgedBy
                    ? alarm.acknowledgedBy.name
                    : "Not yet acknowledged"}
                </Body>
              </div>
              <div className="flex justify-between items-center text-sm">
                <Body size="sm" className="text-muted-foreground">
                  Acknowledged at
                </Body>
                <Body size="sm" className="font-medium">
                  {alarm.acknowledgedAt
                    ? formatDate(alarm.acknowledgedAt)
                    : "Not yet acknowledged"}
                </Body>
              </div>
              <div className="flex justify-between items-center text-sm">
                <Body size="sm" className="text-muted-foreground">
                  Time to acknowledge
                </Body>
                <Body size="sm" className="font-medium">
                  {alarm.acknowledgedAt
                    ? calculateTimeDifference(
                        alarm.createdAt,
                        alarm.acknowledgedAt,
                      )
                    : "-"}
                </Body>
              </div>
              <div className="flex justify-between items-center text-sm">
                <Body size="sm" className="text-muted-foreground">
                  Guard assigned
                </Body>
                <Body size="sm" className="font-medium">
                  {alarm.guard ? alarm.guard.name : "Guard not yet assigned"}
                </Body>
              </div>
              <div className="flex justify-between items-center text-sm">
                <Body size="sm" className="text-muted-foreground">
                  Guard assigned at
                </Body>
                <Body size="sm" className="font-medium">
                  {alarm.guard && alarm.guardAssignedAt
                    ? formatDate(alarm.guardAssignedAt)
                    : alarm.guard
                      ? "-"
                      : "Guard not yet assigned"}
                </Body>
              </div>
              <div className="flex justify-between items-center text-sm">
                <Body size="sm" className="text-muted-foreground">
                  Guard arrived
                </Body>
                <Body size="sm" className="font-medium">
                  {alarm.guardArrivedAt
                    ? formatDate(alarm.guardArrivedAt)
                    : "Guard not yet arrived"}
                </Body>
              </div>
            </div>
          </div>

          {alarm.guardIncidentReports && alarm.guardIncidentReports.length > 0 && (
            <div className="space-y-8">
              <Heading size="xl" className="border-b pb-2">
                B2. Guard&apos;s Field Report
              </Heading>
              <div className="space-y-4">
                {alarm.guardIncidentReports.map((report) => (
                  <GuardIncidentReportCard key={report.id} report={report} />
                ))}
              </div>
            </div>
          )}

          <div className="space-y-8">
            <Heading size="xl" className="border-b pb-2">
              C. Communication <span className="text-red-500">*</span>
            </Heading>

            <div>
              <FormLabel htmlFor="callLog">
                Call Log <span className="text-red-500">*</span>
              </FormLabel>
              <Controller
                name="callLog"
                control={control}
                defaultValue=""
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isViewMode}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select call status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="called_answered">
                        Called - Answered
                      </SelectItem>
                      <SelectItem value="called_no_answer">
                        Called - No Answer
                      </SelectItem>
                      <SelectItem value="not_called">Not Called</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.callLog && (
                <Body size="sm" className="text-red-500 mt-1">
                  {errors.callLog.message}
                </Body>
              )}
            </div>

            <div>
              <FormLabel htmlFor="communicationType">
                SMS / WhatsApp Sent <span className="text-red-500">*</span>
              </FormLabel>
              <Controller
                name="communicationType"
                control={control}
                defaultValue=""
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isViewMode}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select communication type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sms_sent">SMS sent</SelectItem>
                      <SelectItem value="whatsapp_sent">
                        WhatsApp sent
                      </SelectItem>
                      <SelectItem value="no_sent">No sent</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.communicationType && (
                <Body size="sm" className="text-red-500 mt-1">
                  {errors.communicationType.message}
                </Body>
              )}
            </div>

            <div>
              <FormLabel htmlFor="communicationNotes">
                Communication Notes (optional)
              </FormLabel>
              <FormTextarea
                id="communicationNotes"
                placeholder="Add details about what was sent..."
                {...register("communicationNotes")}
                rows={3}
                disabled={isViewMode}
              />
            </div>

            <div>
              <FormLabel htmlFor="internalNotes">
                Internal Notes (optional)
              </FormLabel>
              <FormTextarea
                id="internalNotes"
                placeholder="Add any internal notes or observations..."
                {...register("internalNotes")}
                rows={3}
                disabled={isViewMode}
              />
            </div>
          </div>

          {/* Section D: Manual Report */}
          <div className="space-y-8">
            <Heading size="xl" className="border-b pb-2">
              D. Manual Report <span className="text-red-500">*</span>
            </Heading>

            <div>
              <FormLabel htmlFor="outcome">
                Outcome <span className="text-red-500">*</span>
              </FormLabel>
              <Controller
                name="outcome"
                control={control}
                defaultValue=""
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isViewMode}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select outcome" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="resolved_remotely">
                        Resolved Remotely
                      </SelectItem>
                      <SelectItem value="physical_response">
                        Physical Response Completed
                      </SelectItem>
                      <SelectItem value="false_alarm">False Alarm</SelectItem>
                      <SelectItem value="escalated">Escalated</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.outcome && (
                <Body size="sm" className="text-red-500 mt-1">
                  {errors.outcome.message}
                </Body>
              )}
            </div>

            <div>
              <FormLabel htmlFor="whatHappened">
                What Happened <span className="text-red-500">*</span>
              </FormLabel>
              <FormTextarea
                id="whatHappened"
                placeholder="Briefly describe what happened and how it was resolved..."
                {...register("whatHappened")}
                rows={4}
                disabled={isViewMode}
              />
              {errors.whatHappened && (
                <Body size="sm" className="text-red-500 mt-1">
                  {errors.whatHappened.message}
                </Body>
              )}
            </div>

            <div>
              <FormLabel htmlFor="videoRecordingId">
                Video Recording ID (optional)
              </FormLabel>
              <FormInput
                id="videoRecordingId"
                type="text"
                placeholder="e.g. REC-2026-03842"
                {...register("videoRecordingId")}
                disabled={isViewMode}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                id="learningIdentified"
                type="checkbox"
                className="h-4 w-4 accent-primary"
                {...register("learningIdentified")}
                disabled={isViewMode}
              />
              <label
                htmlFor="learningIdentified"
                className="text-white text-sm font-semibold"
              >
                A learning or process improvement was identified from this
                incident
              </label>
            </div>
          </div>
        </form>
        <DialogFooter className="sticky bottom-0  bg-gray-800 z-10">
          {isViewMode ? (
            <Button
              type="button"
              size="lg"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          ) : (
            <>
              <Button
                type="button"
                size="lg"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="close-case-form"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? "Submitting..." : "Submit report & Close case"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
