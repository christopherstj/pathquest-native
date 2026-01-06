import { useQuery } from "@tanstack/react-query";
import { getApiClient } from "@/src/lib/api/client";
import { endpoints } from "@pathquest/shared/api";

export function useUserChallengeProgress(
  userId: string | null,
  challengeId: string | null,
  enabled = true
) {
  return useQuery({
    queryKey: ["userChallengeProgress", userId, challengeId],
    queryFn: async (): Promise<Awaited<ReturnType<typeof endpoints.getUserChallengeProgress>>> => {
      if (!userId || !challengeId) {
        throw new Error("userId and challengeId are required");
      }
      const client = getApiClient();
      return await endpoints.getUserChallengeProgress(client, userId, challengeId);
    },
    enabled: enabled && !!userId && !!challengeId,
    staleTime: 1000 * 60 * 2,
  });
}


