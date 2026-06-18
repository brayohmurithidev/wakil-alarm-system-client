import clsx from "clsx";

type GuardStatusBadgeProps = {
  isActive: boolean;
  mustChangePassword: boolean;
  className?: string;
};

export function GuardStatusBadge({
  isActive,
  mustChangePassword,
  className,
}: GuardStatusBadgeProps) {
  const { label, color } = !isActive
    ? { label: "Inactive", color: "bg-gray-100 text-gray-600 border-gray-300" }
    : mustChangePassword
      ? {
          label: "Pending Setup",
          color: "bg-orange-100 text-orange-800 border-orange-300",
        }
      : { label: "Active", color: "bg-green-100 text-green-800 border-green-300" };

  return (
    <span
      className={clsx(
        "px-2 py-1 rounded-sm text-sm font-semibold border inline-block",
        color,
        className,
      )}
    >
      {label}
    </span>
  );
}
