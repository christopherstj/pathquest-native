import { useQuery } from "@tanstack/react-query";
import { endpoints } from "@pathquest/shared/api";
import type { Activity, SummitWithPeak } from "@pathquest/shared";

import { getApiClient } from "@/src/lib/api/client";

export type ActivityDetailsResponse = {
  activity: Activity;
  summits: SummitWithPeak[];
};

export function useActivityDetails(activityId: string) {
  return useQuery<ActivityDetailsResponse>({
    queryKey: ["activityDetails", activityId],
    queryFn: async (): Promise<ActivityDetailsResponse> => {
      const client = getApiClient();
      return await endpoints.getActivityDetails(client, activityId);
    },
    enabled: !!activityId,
    staleTime: 1000 * 60 * 5,
  });
}


