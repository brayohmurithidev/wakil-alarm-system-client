import clsx from "clsx";

import type { AlarmStatus } from "@/api/types";

type AlarmStatusBadgeProps = {
  status: AlarmStatus;
  className?: string;
};

const getStatusColor = (status: AlarmStatus) => {
  switch (status) {
    case "pending":
      return "bg-orange-100 text-orange-800 border-orange-300";
    case "open":
      return "bg-blue-100 text-blue-800 border-blue-300";
    case "acknowledged":
      return "bg-purple-100 text-purple-800 border-purple-300";
    case "assigned":
      return "bg-indigo-100 text-indigo-800 border-indigo-300";
    case "guard_acknowledged":
      return "bg-teal-100 text-teal-800 border-teal-300";
    case "report_submitted":
      return "bg-lime-100 text-lime-800 border-lime-300";
    case "closed":
      return "bg-gray-100 text-gray-800 border-gray-300";
    case "cancelled":
      return "bg-gray-100 text-gray-600 border-gray-300";
    default:
      return "bg-gray-100 text-gray-800 border-gray-300";
  }
};

const STATUS_LABEL: Record<AlarmStatus, string> = {
  unknown: "Unknown",
  pending: "Pending",
  open: "Open",
  acknowledged: "Acknowledged",
  assigned: "Assigned",
  guard_acknowledged: "Guard Acknowledged",
  report_submitted: "Report Submitted",
  closed: "Closed",
  cancelled: "Cancelled",
};

export function AlarmStatusBadge({ status, className }: AlarmStatusBadgeProps) {
  return (
    <span
      className={clsx(
        "px-2 py-1 rounded-sm text-sm font-semibold border inline-block",
        getStatusColor(status),
        className,
      )}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}
