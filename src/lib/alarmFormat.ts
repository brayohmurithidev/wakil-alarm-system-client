// Presentation-only formatting for the Alarms/History table - kept pure and
// separate from alarmsListState.ts (that file is about what to fetch, this
// one is about how to display a row once it's back).

/** Compact "Aug 31, 2026" / "12:20 PM" pair - operator's local timezone, no seconds. */
export function formatAlarmDateParts(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  return {
    date: new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(d),
    time: new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
    }).format(d),
  };
}

/** Compact coordinate display (~11m precision) for the table cell itself. */
export function formatCoordinatesCompact(latitude: number, longitude: number): string {
  return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
}

/** Full-precision coordinates, for a title/tooltip - exact value stays accessible. */
export function formatCoordinatesFull(latitude: number, longitude: number): string {
  return `${latitude}, ${longitude}`;
}
