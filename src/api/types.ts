export type AlarmStatus = "unknown" | "initiating" | "pending" | "open" | "closed" | "cancelled";

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
  createdAt: string;
  updatedAt: string;
  locations: AlarmLocation[];
};

export type AlarmsResponse = {
  alarms: Alarm[];
};

export type AlarmResponse = {
  alarm: Alarm;
};
