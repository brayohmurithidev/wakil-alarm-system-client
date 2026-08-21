export type AlarmStatus =
  | "unknown"
  | "pending"
  | "open"
  | "acknowledged"
  | "assigned"
  | "guard_acknowledged"
  | "report_submitted"
  | "closed"
  | "cancelled";

export type AdminRole = "DISPATCHER" | "SUPERVISOR" | "ADMIN";

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: AdminRole;
  isActive: boolean;
  isSuperAdmin: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AlarmSourceCredential = {
  id: string;
  name: string;
  provider: "VAKTA";
  keyPrefix: string;
  status: "ACTIVE" | "REVOKED" | "EXPIRED";
  createdAt: string;
  createdBy: Pick<AdminUser, "id" | "name" | "email"> | null;
  lastUsedAt: string | null;
  revokedAt: string | null;
  expiresAt: string | null;
  legacy: boolean;
};

export type AlarmLocation = {
  id: string;
  latitude: number;
  longitude: number;
  timestamp: string;
};

export type GuardStatus = "offline" | "available" | "busy";

export type Guard = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  isActive: boolean;
  mustChangePassword: boolean;
  otpExpiresAt?: string | null;
  rank: string | null;
  dateOfBirth: string | null;
  idNumber: string | null;
  licenseNumber: string | null;
  bloodGroup: string | null;
  avatarUrl: string | null;
  // Operational: available/busy, or offline only if the guard explicitly
  // took themselves off duty. No longer affected by Socket.IO connectivity
  // - see `isConnected` and src/lib/guardState.ts.
  status: GuardStatus;
  lastActiveAt: string | null;
  // Live Socket.IO connectivity, tracked independently of `status`. A guard
  // can be `available`/`busy` while disconnected (dead phone, no signal).
  isConnected: boolean;
  currentLatitude: number | null;
  currentLongitude: number | null;
  locationUpdatedAt: string | null;
  hasPushToken: boolean;
  createdAt: string;
  updatedAt: string;
  alarms?: Array<{ id: string; status: AlarmStatus; createdAt: string }>;
};

export type AlarmReport = {
  id: string;
  alarmId: string;
  callLog: string;
  communicationType: string;
  communicationNotes: string | null;
  internalNotes: string | null;
  outcome: string;
  whatHappened: string;
  learningIdentified: boolean;
  videoRecordingId: string | null;
  createdAt: string;
  createdById: string;
  createdBy?: AdminUser;
};

export type ReportStatus = "draft" | "submitted";

export type GuardIncidentReport = {
  id: string;
  alarmId: string;
  guardId: string;
  guard?: Guard;
  incidentType: string;
  outcome: string | null;
  description: string | null;
  photoUrls: string[];
  signatureUrl: string | null;
  status: ReportStatus;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Alarm = {
  id: string;
  latitude: number;
  longitude: number;
  userId: string;
  userName: string;
  userPhone: string;
  userImage?: string | null;
  status: AlarmStatus;
  guardId?: string | null;
  guard?: Guard | null;
  assignedUserId?: string | null;
  assignedUser?: AdminUser | null;
  createdAt: string;
  updatedAt: string;
  locations: AlarmLocation[];
  acknowledgedById?: string | null;
  acknowledgedBy?: AdminUser | null;
  acknowledgedAt?: string | null;
  closedById?: string | null;
  closedBy?: AdminUser | null;
  closedAt?: string | null;
  guardAssignedAt?: string | null;
  guardAcknowledgedAt?: string | null;
  guardArrivedAt?: string | null;
  report?: AlarmReport | null;
  guardIncidentReports?: GuardIncidentReport[];
};

export type AlarmsResponse = {
  alarms: Alarm[];
};

export type AlarmResponse = {
  alarm: Alarm;
};
