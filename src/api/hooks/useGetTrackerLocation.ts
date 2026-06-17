import { useQuery } from "@tanstack/react-query";

import axiosInstance from "@/lib/axios";

export type TrackerLocation = {
  imei: string;
  latitude: number;
  longitude: number;
  speed: number;
  course: number;
  status: string;
  gpsTime: string;
  battery: number;
  acc: boolean;
};

type GetTrackerLocationResponse = {
  trackers: TrackerLocation[];
};

const getTrackerLocation =
  async (): Promise<TrackerLocation[]> => {
    const response = await axiosInstance.get<GetTrackerLocationResponse>(
      "/api/trackers/location",
    );
    return response.data.trackers;
  };

export const useGetTrackerLocation = () => {
  return useQuery({
    queryKey: ["trackers", "location"],
    queryFn: getTrackerLocation,
    enabled: false, // Disabled until iTrack API access is granted
    // refetchInterval: 10000, // TODO: Re-enable when iTrack works
  });
};
