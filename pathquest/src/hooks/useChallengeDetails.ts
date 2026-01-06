import { useQuery } from "@tanstack/react-query";
import { getApiClient } from "@/src/lib/api/client";
import { endpoints } from "@pathquest/shared/api";

export function useChallengeDetails(challengeId: string | null, enabled = true) {
  return useQuery({
    queryKey: ["challengeDetails", challengeId],
    queryFn: async (): Promise<Awaited<ReturnType<typeof endpoints.getPublicChallengeDetails>>> => {
      if (!challengeId) {
        throw new Error("challengeId is required");
      }
      const client = getApiClient();
      return await endpoints.getPublicChallengeDetails(client, challengeId);
    },
    enabled: enabled && !!challengeId,
    staleTime: 1000 * 60 * 5,
  });
}


