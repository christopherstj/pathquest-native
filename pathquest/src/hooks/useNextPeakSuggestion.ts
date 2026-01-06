import { useQuery } from "@tanstack/react-query";
import { getApiClient } from "@/src/lib/api/client";
import { endpoints } from "@pathquest/shared/api";

export function useNextPeakSuggestion(
  challengeId: string | null,
  coords: { lat: number; lng: number } | null,
  enabled = true
) {
  return useQuery({
    queryKey: ["nextPeakSuggestion", challengeId, coords?.lat, coords?.lng],
    queryFn: async (): Promise<Awaited<ReturnType<typeof endpoints.getNextPeakSuggestion>>> => {
      if (!challengeId) throw new Error("challengeId is required");
      const client = getApiClient();
      return await endpoints.getNextPeakSuggestion(client, challengeId, coords ?? undefined);
    },
    enabled: enabled && !!challengeId,
    staleTime: 1000 * 60 * 2,
  });
}


