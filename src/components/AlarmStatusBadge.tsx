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
    case "closed":
      return "bg-gray-100 text-gray-800 border-gray-300";
    case "cancelled":
      return "bg-gray-100 text-gray-600 border-gray-300";
    default:
      return "bg-gray-100 text-gray-800 border-gray-300";
  }
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
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
