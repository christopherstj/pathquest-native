import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, TextInput, TouchableOpacity } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Search, X, Mountain, Trophy, MapPin } from "lucide-react-native";
import type { Peak, ChallengeProgress, PeakSearchResult, ChallengeSearchResult } from "@pathquest/shared";
import { getElevationString } from "@pathquest/shared";
import { endpoints } from "@pathquest/shared/api";
import { getApiClient } from "@/src/lib/api/client";
import { getMapboxToken } from "@/src/lib/map/getMapboxToken";
import { CardFrame, Text } from "@/src/components/ui";
import { useTheme } from "@/src/theme";

type SearchResult =
  | { type: "peak"; id: string; peak: Peak }
  | { type: "challenge"; id: string; challenge: ChallengeProgress }
  | {
      type: "place";
      id: string;
      title: string;
      subtitle: string;
      coords: [number, number]; // [lng, lat]
      place_type: string[];
      category?: string;
    };

const SEARCH_DEBOUNCE_MS = 250;
const MAX_PEAKS = 6;
const MAX_CHALLENGES = 6;

export interface ExploreOmnibarProps {
  onPeakPress: (peak: Peak) => void;
  onChallengePress: (challenge: ChallengeProgress) => void;
  onPlacePress?: (place: { coords: [number, number]; zoom: number; title: string; subtitle: string }) => void;
  /**
   * Optional: hide omnibar in some states (e.g. detail mode).
   */
  visible?: boolean;
}

export default function ExploreOmnibar({
  onPeakPress,
  onChallengePress,
  onPlacePress,
  visible = true,
}: ExploreOmnibarProps) {
  const { colors } = useTheme();
  const inputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query]);

  const { data, isLoading } = useQuery({
    queryKey: ["omnibar", debouncedQuery],
    queryFn: async (): Promise<{ peaks: Peak[]; challenges: ChallengeProgress[]; places: any[] }> => {
      if (debouncedQuery.length < 2) return { peaks: [], challenges: [], places: [] };
      const client = getApiClient();
      const [searchResults, placesJson] = await Promise.all([
        endpoints.unifiedSearch(client, {
          query: debouncedQuery,
          limit: 20,
          includePeaks: true,
          includeChallenges: true,
        }),
        fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(debouncedQuery)}.json?access_token=${getMapboxToken()}&types=region,place,poi,locality&country=us&limit=6`
        ).then((r) => r.json()),
      ]);

      // Map unified search results to Peak and ChallengeProgress types
      const peaks: Peak[] = searchResults.results
        .filter((r): r is PeakSearchResult => r.type === "peak")
        .map((r) => ({
          id: r.id,
          name: r.name,
          elevation: r.elevation,
          county: r.county,
          state: r.state,
          country: r.country,
          location_coords: r.location_coords,
          is_favorited: r.isFavorited,
          public_summits: r.publicSummits,
          summits: r.userSummits,
          num_challenges: r.numChallenges,
        }));

      const challenges: ChallengeProgress[] = searchResults.results
        .filter((r): r is ChallengeSearchResult => r.type === "challenge")
        .map((r) => ({
          id: r.id,
          name: r.name,
          region: r.region,
          center_lat: r.center_lat,
          center_long: r.center_long,
          location_coords: r.center_lat && r.center_long ? [r.center_long, r.center_lat] : undefined,
          num_peaks: r.numPeaks,
          is_favorited: r.isFavorited ?? false,
          is_public: true,
          total: r.numPeaks,
          completed: r.userCompleted ?? 0,
        }));

      const placeFeatures = Array.isArray(placesJson?.features) ? placesJson.features : [];
      const outdoorCategories = ["park", "forest", "mountain", "trail", "nature", "recreation", "outdoor"];
      const filteredPlaces = placeFeatures.filter((f: any) => {
        if (f?.place_type?.includes("region") || f?.place_type?.includes("place") || f?.place_type?.includes("locality")) return true;
        if (f?.place_type?.includes("poi")) {
          const categories = String(f?.properties?.category ?? "").toLowerCase();
          return outdoorCategories.some((c) => categories.includes(c));
        }
        return true;
      });

      return { peaks, challenges, places: filteredPlaces };
    },
    enabled: visible,
    staleTime: 1000 * 10,
  });

  const results = useMemo<SearchResult[]>(() => {
    // Unified search already returns results sorted by relevancy score
    // We just need to limit and map to our display format
    const peaks = (data?.peaks ?? [])
      .slice(0, MAX_PEAKS)
      .map((p) => ({ type: "peak" as const, id: p.id, peak: p }));

    const challenges = (data?.challenges ?? [])
      .slice(0, MAX_CHALLENGES)
      .map((c) => ({ type: "challenge" as const, id: c.id, challenge: c }));

    const places = (data?.places ?? []).slice(0, 6).map((f: any) => ({
      type: "place" as const,
      id: String(f.id ?? `${f.text}:${f.place_name}`),
      title: String(f.text ?? "Place"),
      subtitle: String(f.place_name ?? ""),
      coords: (Array.isArray(f.center) ? [f.center[0], f.center[1]] : [0, 0]) as [number, number],
      place_type: Array.isArray(f.place_type) ? f.place_type : [],
      category: f?.properties?.category,
    }));

    // Prioritize: Challenges first, then Peaks, then Places (like web app).
    return [...challenges, ...peaks, ...places];
  }, [data?.challenges, data?.peaks, data?.places]);

  const showDropdown = visible && isOpen && debouncedQuery.length >= 2 && (isLoading || results.length > 0);

  const handleClear = () => {
    setQuery("");
    setDebouncedQuery("");
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleSelectPeak = (p: Peak) => {
    onPeakPress(p);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleSelectChallenge = (c: ChallengeProgress) => {
    onChallengePress(c);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleSelectPlace = (p: Extract<SearchResult, { type: "place" }>) => {
    const zoom = getZoomForPlace(p.place_type);
    onPlacePress?.({ coords: p.coords, zoom, title: p.title, subtitle: p.subtitle });
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const getZoomForPlace = (placeType: string[]): number => {
    if (placeType.includes("poi")) return 15;
    if (placeType.includes("address")) return 16;
    if (placeType.includes("neighborhood")) return 14;
    if (placeType.includes("locality")) return 13;
    if (placeType.includes("place")) return 11;
    if (placeType.includes("district")) return 10;
    if (placeType.includes("region")) return 6;
    if (placeType.includes("country")) return 4;
    return 11;
  };

  if (!visible) return null;

  return (
    <View style={{ width: "100%" }}>
      {/* Input */}
      <CardFrame topo="corner" seed="omnibar" style={{ paddingHorizontal: 12, paddingVertical: 10 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Search size={16} color={colors.mutedForeground as any} />
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={(t) => setQuery(t)}
            onFocus={() => setIsOpen(true)}
            onBlur={() => setIsOpen(false)}
            placeholder="Search peaks or challenges…"
            placeholderTextColor={colors.mutedForeground as any}
            style={{
              flex: 1,
              color: colors.foreground as any,
              fontSize: 14,
            }}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {query.length > 0 ? (
            <TouchableOpacity onPress={handleClear} activeOpacity={0.7} style={{ padding: 6 }}>
              <X size={16} color={colors.mutedForeground as any} />
            </TouchableOpacity>
          ) : null}
        </View>
      </CardFrame>

      {/* Dropdown */}
      {showDropdown ? (
        <View style={{ marginTop: 10 }}>
          <CardFrame topo="corner" seed="omnibar-results" style={{ paddingVertical: 8 }}>
            {isLoading ? (
              <View style={{ paddingHorizontal: 12, paddingVertical: 10 }}>
                <Text className="text-muted-foreground text-sm">Searching…</Text>
              </View>
            ) : (
              results.map((r) => {
                if (r.type === "peak") {
                  const p = r.peak;
                  const subtitleParts = [
                    p.elevation !== undefined ? getElevationString(p.elevation, "imperial") : null,
                    p.state ?? null,
                  ].filter(Boolean);
                  return (
                    <TouchableOpacity
                      key={`peak:${p.id}`}
                      onPress={() => handleSelectPeak(p)}
                      activeOpacity={0.7}
                      style={{ paddingHorizontal: 12, paddingVertical: 10 }}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                        <Mountain size={16} color={colors.primary as any} />
                        <View style={{ flex: 1 }}>
                          <Text className="text-foreground text-sm font-semibold" numberOfLines={1}>
                            {p.name ?? "Unknown Peak"}
                          </Text>
                          {subtitleParts.length > 0 ? (
                            <Text className="text-muted-foreground text-xs mt-0.5" numberOfLines={1}>
                              {subtitleParts.join(" · ")}
                            </Text>
                          ) : null}
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                }

                if (r.type === "challenge") {
                  const c = r.challenge;
                  const subtitle = `${c.num_peaks ?? c.total} peaks${c.region ? ` · ${c.region}` : ""}`;
                  return (
                    <TouchableOpacity
                      key={`challenge:${c.id}`}
                      onPress={() => handleSelectChallenge(c)}
                      activeOpacity={0.7}
                      style={{ paddingHorizontal: 12, paddingVertical: 10 }}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                        <Trophy size={16} color={colors.secondary as any} />
                        <View style={{ flex: 1 }}>
                          <Text className="text-foreground text-sm font-semibold" numberOfLines={1}>
                            {c.name ?? "Unknown Challenge"}
                          </Text>
                          <Text className="text-muted-foreground text-xs mt-0.5" numberOfLines={1}>
                            {subtitle}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                }

                // place
                return (
                  <TouchableOpacity
                    key={`place:${r.id}`}
                    onPress={() => handleSelectPlace(r)}
                    activeOpacity={0.7}
                    style={{ paddingHorizontal: 12, paddingVertical: 10 }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                      <MapPin size={16} color={colors.mutedForeground as any} />
                      <View style={{ flex: 1 }}>
                        <Text className="text-foreground text-sm font-semibold" numberOfLines={1}>
                          {r.title}
                        </Text>
                        <Text className="text-muted-foreground text-xs mt-0.5" numberOfLines={1}>
                          {r.subtitle}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </CardFrame>
        </View>
      ) : null}
    </View>
  );
}


