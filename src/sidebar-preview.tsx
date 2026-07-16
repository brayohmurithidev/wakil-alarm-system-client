import "@/index.css";

import { createRoot } from "react-dom/client";

import { AlarmMap } from "@/components/AlarmMap";
import type { Alarm } from "@/api/types";

const alarms: Alarm[] = [
  {
    id: "a1",
    latitude: -1.2921,
    longitude: 36.8219,
    userId: "u1",
    userName: "Jane Maina",
    userPhone: "+254700000111",
    userImage: null,
    status: "open",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    locations: [],
  } as unknown as Alarm,
];

function Preview() {
  return (
    <div style={{ height: "100vh" }}>
      <AlarmMap alarms={alarms} />
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<Preview />);
