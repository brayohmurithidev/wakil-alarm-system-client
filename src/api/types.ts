export type AlarmStatus =
  | "unknown"
  | "pending"
  | "open"
  | "acknowledged"
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
  createdAt: string;
  updatedAt: string;
};

export type AlarmLocation = {
  id: string;
  latitude: number;
  longitude: number;
  timestamp: string;
};

export type Guard = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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
  guardArrivedAt?: string | null;
  report?: AlarmReport | null;
};

export type AlarmsResponse = {
  alarms: Alarm[];
};

export type AlarmResponse = {
  alarm: Alarm;
};
