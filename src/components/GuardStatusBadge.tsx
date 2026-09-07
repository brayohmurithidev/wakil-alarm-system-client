import clsx from "clsx";

import {
  getGuardLifecycleStatus,
  GUARD_LIFECYCLE_STATUS_LABEL,
  type GuardLifecycleStatus,
} from "@/lib/guardLifecycleStatus";

type GuardStatusBadgeProps = {
  isActive: boolean;
  mustChangePassword: boolean;
  className?: string;
};

// Guard Account Phase 4 - previously only 3 labels ("Inactive", "Pending
// Setup", "Active"), collapsing both disabled states together. The
// underlying (isActive, mustChangePassword) data was always fully
// unambiguous (see lib/guardLifecycleStatus.ts) - only this badge's
// display was lossy.
const STATUS_COLOR: Record<GuardLifecycleStatus, string> = {
  pendingSetup: "bg-orange-100 text-orange-800 border-orange-300",
  active: "bg-green-100 text-green-800 border-green-300",
  disabledPending: "bg-amber-50 text-amber-700 border-amber-200",
  disabled: "bg-gray-100 text-gray-600 border-gray-300",
};

export function GuardStatusBadge({
  isActive,
  mustChangePassword,
  className,
}: GuardStatusBadgeProps) {
  const status = getGuardLifecycleStatus({ isActive, mustChangePassword });

  return (
    <span
      className={clsx(
        "px-2 py-1 rounded-sm text-sm font-semibold border inline-block",
        STATUS_COLOR[status],
        className,
      )}
    >
      {GUARD_LIFECYCLE_STATUS_LABEL[status]}
    </span>
  );
}
