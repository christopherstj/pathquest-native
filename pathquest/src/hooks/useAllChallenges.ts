import { useQuery } from "@tanstack/react-query";
import { getApiClient } from "@/src/lib/api/client";
import { endpoints } from "@pathquest/shared/api";
import type { ChallengeProgress } from "@pathquest/shared";

/**
 * Fetch ALL challenges in the database (paginated), independent of map viewport.
 *
 * Uses `/challenges/search` with no bounds, which returns `ChallengeProgress[]`
 * including best-effort per-user progress fields (completed/total/is_completed).
 */
export function useAllChallenges(enabled = true) {
  return useQuery({
    queryKey: ["allChallenges"],
    queryFn: async (): Promise<ChallengeProgress[]> => {
      const client = getApiClient();
      return await endpoints.searchChallenges(client);
    },
    enabled,
    staleTime: 1000 * 60 * 5,
  });
}


