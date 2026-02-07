export type AlarmStatus = "unknown" | "pending" | "open" | "closed" | "cancelled";

export type AlarmLocation = {
  id: string;
  latitude: number;
  longitude: number;
  timestamp: string;
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
