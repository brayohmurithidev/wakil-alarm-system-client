import type { GuardStatus } from "@/api/types";
import { cn } from "@/lib/utils";

type AvatarVariant = "alarm" | "guard";
type AvatarSize = "sm" | "md" | "lg";

type AvatarProps = {
  name: string;
  imageUrl?: string | null;
  variant: AvatarVariant;
  size?: AvatarSize;
  className?: string;
  // When variant="guard", colours the ring green (online) or gray (offline)
  // instead of the default gold. Omit to keep gold.
  guardStatus?: GuardStatus;
};

// Online = green, offline = gray. Available and busy are both "online".
const GUARD_RING_COLOR: Record<GuardStatus, string> = {
  available: "#22c55e",
  busy:      "#22c55e",
  offline:   "#6b7280",
};

// Alarms/clients are circular with a red ring; guards are rounded-square
// with a gold ring, so the two are distinguishable by shape, not just color.
const VARIANT_BASE: Record<AvatarVariant, string> = {
  alarm: "rounded-full border-2 border-destructive",
  guard: "rounded-lg border-2 border-primary",
};

const SIZE_STYLES: Record<AvatarSize, string> = {
  sm: "h-8 w-8 text-xs",
  md: "h-12 w-12 text-sm",
  lg: "h-16 w-16 text-lg",
};

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0] + parts[parts.length - 1]![0]).toUpperCase();
}

export function Avatar({
  name,
  imageUrl,
  variant,
  size = "md",
  className,
  guardStatus,
}: AvatarProps) {
  const ringStyle =
    variant === "guard" && guardStatus
      ? { borderColor: GUARD_RING_COLOR[guardStatus] }
      : undefined;

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden bg-muted font-semibold text-foreground",
        VARIANT_BASE[variant],
        SIZE_STYLES[size],
        className,
      )}
      style={ringStyle}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={name}
          className="h-full w-full object-cover"
        />
      ) : (
        <span>{getInitials(name)}</span>
      )}
    </div>
  );
}
