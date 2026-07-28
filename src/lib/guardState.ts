import type { Guard } from "@/api/types";

// Guard state has three genuinely independent dimensions, confirmed against
// the API/Guard App audit rather than assumed:
//
// 1. Operational status - can this guard be assigned right now? Backed by
//    `guard.status`, which the API now keeps purely operational: "available"
//    or "busy" (has an active assignment - the API sets this, never the
//    client), or "offline" ONLY when the guard explicitly took themselves off
//    duty via their own profile action. There is no "on leave" concept
//    anywhere in the backend today (confirmed: no field, no migration, no
//    model) - it is intentionally not represented here rather than invented.
//
// 2. Connectivity - is the guard's phone/socket currently connected? Backed
//    by `guard.isConnected`, tracked independently by the API's Socket.IO
//    presence handlers. A dropped connection, a backgrounded app, or a dead
//    zone flips this alone; it never touches operational status.
//
// 3. Location freshness - how recent is the last known position? Derived
//    client-side from `locationUpdatedAt`, since the API stores the
//    timestamp but defines no freshness threshold of its own (confirmed gap
//    - thresholds below are this app's own definition, applied consistently
//    wherever location is shown).

export type OperationalStatus = "available" | "assigned" | "offDuty";

export function getOperationalStatus(guard: Guard): OperationalStatus {
  if (guard.status === "offline") return "offDuty";
  if (guard.status === "busy") return "assigned";
  return "available";
}

export function isEligibleForAssignment(guard: Guard): boolean {
  return getOperationalStatus(guard) === "available";
}

export type ConnectivityStatus = "connected" | "disconnected";

export function getConnectivityStatus(guard: Guard): ConnectivityStatus {
  return guard.isConnected ? "connected" : "disconnected";
}

// This app's own freshness thresholds (no backend definition exists to
// adopt). The Guard App reports location every ~15s / 30m while on duty
// (confirmed in its background-location task), so "live" allows a couple of
// missed beats before falling back to "recent", and "recent" covers a
// realistic gap (app briefly backgrounded, one bad network patch) before a
// position is considered stale.
export const LOCATION_LIVE_THRESHOLD_MS = 2 * 60_000; // 2 minutes
export const LOCATION_RECENT_THRESHOLD_MS = 15 * 60_000; // 15 minutes

export type LocationFreshness = "live" | "recent" | "stale" | "none";

export function getLocationFreshness(
  guard: Pick<Guard, "currentLatitude" | "currentLongitude" | "locationUpdatedAt">,
  now: number = Date.now(),
): LocationFreshness {
  if (
    guard.currentLatitude == null ||
    guard.currentLongitude == null ||
    !guard.locationUpdatedAt
  ) {
    return "none";
  }

  const ageMs = now - new Date(guard.locationUpdatedAt).getTime();
  if (!Number.isFinite(ageMs) || ageMs < 0) return "none";
  if (ageMs <= LOCATION_LIVE_THRESHOLD_MS) return "live";
  if (ageMs <= LOCATION_RECENT_THRESHOLD_MS) return "recent";
  return "stale";
}
