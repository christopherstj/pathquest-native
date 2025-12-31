import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { getApiClient } from "@/src/lib/api/client";
import { endpoints } from "@pathquest/shared/api";
import type { Activity, Challenge, CurrentWeather, Peak, PeakActivity, PeakForecast, Summit } from "@pathquest/shared";

export type PeakDetailsResponse = {
  peak: Peak;
  publicSummits: Summit[];
  challenges: Challenge[];
  activities?: Activity[];
};

export type PublicSummit = Summit & {
  user_id?: string;
  user_name?: string;
};

export type PeakPublicSummitsCursorResponse = {
  summits: PublicSummit[];
  nextCursor: string | null;
  totalCount: number;
};

export function usePeakDetails(peakId: string) {
  return useQuery({
    queryKey: ["peakDetails", peakId],
    queryFn: async (): Promise<PeakDetailsResponse> => {
      const client = getApiClient();
      return await endpoints.getPeakDetails(client, peakId);
    },
    enabled: !!peakId,
    staleTime: 1000 * 60 * 5,
  });
}

export function usePeakWeather(peakId: string) {
  return useQuery({
    queryKey: ["peakWeather", peakId],
    queryFn: async (): Promise<CurrentWeather> => {
      const client = getApiClient();
      return await endpoints.getPeakWeather(client, peakId);
    },
    enabled: !!peakId,
    staleTime: 1000 * 60 * 5,
  });
}

export function usePeakActivity(peakId: string) {
  return useQuery({
    queryKey: ["peakActivity", peakId],
    queryFn: async (): Promise<PeakActivity> => {
      const client = getApiClient();
      return await endpoints.getPeakActivity(client, peakId);
    },
    enabled: !!peakId,
    staleTime: 1000 * 60 * 2,
  });
}

export function usePeakForecast(peakId: string) {
  return useQuery({
    queryKey: ["peakForecast", peakId],
    queryFn: async (): Promise<PeakForecast> => {
      const client = getApiClient();
      return await endpoints.getPeakForecast(client, peakId);
    },
    enabled: !!peakId,
    staleTime: 1000 * 60 * 15, // Cache forecast for 15 minutes
  });
}

export function usePeakPublicSummitsCursor(peakId: string, pageSize = 20) {
  return useInfiniteQuery({
    queryKey: ["peakPublicSummits", peakId, pageSize],
    queryFn: async ({ pageParam }): Promise<PeakPublicSummitsCursorResponse> => {
      const client = getApiClient();
      return await endpoints.getPeakPublicSummitsCursor(client, {
        peakId,
        cursor: typeof pageParam === "string" ? pageParam : undefined,
        limit: pageSize,
      });
    },
    initialPageParam: undefined as undefined | string,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!peakId,
    staleTime: 1000 * 30,
  });
}

export function getPeakTitle(peak: Peak | undefined | null) {
  return peak?.name || "Unknown Peak";
}


