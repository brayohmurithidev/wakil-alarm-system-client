import { Loader2, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";

import type { AdminRole, Alarm, Guard } from "@/api/types";
import { AlarmStatusBadge } from "@/components/AlarmStatusBadge";
import { Body } from "@/components/ui";
import { Avatar } from "@/components/ui/Avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  assignmentRestrictionReason,
  canAssignGuard,
} from "@/lib/alarmAssignmentPermissions";
import { formatAlarmDateParts, formatCoordinatesCompact, formatCoordinatesFull } from "@/lib/alarmFormat";
import { isAlarmAssignable } from "@/lib/alarmsListState";
import { formatDistanceKm, haversineKm } from "@/lib/distance";

// Radix Select rejects an empty-string item value, so unassigning a guard
// needs an explicit sentinel item rather than a clearable empty state.
const UNASSIGNED_GUARD = "__unassigned__";

function GuardAssignmentCell({
  alarm,
  guards,
  guardAssignments,
  updatingAlarmId,
  currentAdminRole,
  onSelectGuard,
}: {
  alarm: Alarm;
  guards: Guard[];
  guardAssignments: Map<string, string>;
  updatingAlarmId: string | null;
  currentAdminRole: AdminRole;
  onSelectGuard: (alarm: Alarm, guardId: string | null, guards: Guard[]) => void;
}) {
  // Terminal alarms (closed/cancelled) are never assignable - the API
  // rejects the write (ALARM_TERMINAL), so presenting a live control here
  // would just be a dropdown that always fails. Plain text instead (Phase 8).
  if (!isAlarmAssignable(alarm.status)) {
    return <Body size="sm">{alarm.guard?.name ?? "Unassigned"}</Body>;
  }

  // Non-terminal, but the API's own role check (assignGuard.ts's
  // assertMayReassign) would 409 a DISPATCHER trying to reassign a guard
  // who's already acknowledged/reporting - see alarmAssignmentPermissions.ts,
  // a pure mirror of that exact rule, not a re-derivation of it. Disabled
  // rather than plain text: unlike the terminal case above (never
  // editable, for anyone), this is a role-specific, situational
  // restriction, so the control stays visually present with a reason a
  // dispatcher can actually read, instead of looking identical to a
  // permanently-closed row.
  const restrictionReason = assignmentRestrictionReason(currentAdminRole, alarm);
  const isRestricted = !canAssignGuard(currentAdminRole, alarm);

  return (
    <div className="flex items-center gap-2" title={restrictionReason ?? undefined}>
      <div className="flex-1">
        <Select
          value={alarm.guardId ?? UNASSIGNED_GUARD}
          onValueChange={(value) =>
            onSelectGuard(alarm, value === UNASSIGNED_GUARD ? null : value, guards)
          }
          disabled={updatingAlarmId === alarm.id || isRestricted}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={UNASSIGNED_GUARD}>Unassigned</SelectItem>
            {guards
              .map((guard) => ({
                guard,
                distanceKm:
                  guard.currentLatitude != null && guard.currentLongitude != null
                    ? haversineKm(alarm, {
                        latitude: guard.currentLatitude,
                        longitude: guard.currentLongitude,
                      })
                    : null,
              }))
              .sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity))
              .map(({ guard, distanceKm }) => {
                const assignedAlarmId = guardAssignments.get(guard.id);
                const isAssignedElsewhere =
                  assignedAlarmId != null && assignedAlarmId !== alarm.id;
                return (
                  <SelectItem key={guard.id} value={guard.id} disabled={isAssignedElsewhere}>
                    {guard.name}
                    {distanceKm != null && ` — ${formatDistanceKm(distanceKm)}`}
                    {isAssignedElsewhere && " (Assigned)"}
                  </SelectItem>
                );
              })}
          </SelectContent>
        </Select>
      </div>
      {updatingAlarmId === alarm.id && (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
      )}
      {isRestricted && updatingAlarmId !== alarm.id && (
        <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      )}
    </div>
  );
}

export function AlarmsTable({
  alarms,
  guards,
  guardAssignments,
  updatingAlarmId,
  currentAdminRole,
  onSelectGuard,
}: {
  alarms: Alarm[];
  guards: Guard[] | undefined;
  guardAssignments: Map<string, string>;
  updatingAlarmId: string | null;
  currentAdminRole: AdminRole;
  onSelectGuard: (alarm: Alarm, guardId: string | null, guards: Guard[]) => void;
}) {
  const navigate = useNavigate();

  return (
    <Table>
      <TableHeader className="bg-muted">
        <TableRow>
          <TableHead>User</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Time</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Acknowledged By</TableHead>
          <TableHead>Assigned Guard</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {alarms.map((alarm) => {
          const { date, time } = formatAlarmDateParts(alarm.createdAt);
          return (
            <TableRow
              key={alarm.id}
              className="cursor-pointer"
              onClick={() => navigate(`/alarms/${alarm.id}`)}
            >
              <TableCell className="whitespace-normal">
                <div className="flex items-center gap-3">
                  <Avatar
                    name={alarm.userName}
                    imageUrl={alarm.userImage}
                    variant="alarm"
                    size="sm"
                  />
                  <Body className="max-w-[180px] truncate font-medium text-foreground">
                    {alarm.userName}
                  </Body>
                </div>
              </TableCell>
              <TableCell>
                <Body className="max-w-[140px] truncate">{alarm.userPhone}</Body>
              </TableCell>
              <TableCell title={formatCoordinatesFull(alarm.latitude, alarm.longitude)}>
                <Body size="sm">{formatCoordinatesCompact(alarm.latitude, alarm.longitude)}</Body>
              </TableCell>
              <TableCell>
                <Body size="sm" className="text-foreground">{date}</Body>
                <Body size="sm" className="text-muted-foreground">{time}</Body>
              </TableCell>
              <TableCell>
                <AlarmStatusBadge status={alarm.status} />
              </TableCell>
              <TableCell>
                <Body size="sm">{alarm.acknowledgedBy ? alarm.acknowledgedBy.name : "-"}</Body>
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()} className="whitespace-normal">
                <GuardAssignmentCell
                  alarm={alarm}
                  guards={guards ?? []}
                  guardAssignments={guardAssignments}
                  updatingAlarmId={updatingAlarmId}
                  currentAdminRole={currentAdminRole}
                  onSelectGuard={onSelectGuard}
                />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
