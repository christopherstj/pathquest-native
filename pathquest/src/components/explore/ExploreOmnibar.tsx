import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, TextInput, TouchableOpacity } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Search, X, Mountain, Trophy } from "lucide-react-native";
import type { Peak, ChallengeProgress } from "@pathquest/shared";
import { getElevationString } from "@pathquest/shared";
import { endpoints } from "@pathquest/shared/api";
import { getApiClient } from "@/src/lib/api/client";
import { CardFrame, Text } from "@/src/components/ui";
import { useTheme } from "@/src/theme";

type SearchResult =
  | { type: "peak"; id: string; peak: Peak }
  | { type: "challenge"; id: string; challenge: ChallengeProgress };

const SEARCH_DEBOUNCE_MS = 250;
const MAX_PEAKS = 6;
const MAX_CHALLENGES = 6;

export interface ExploreOmnibarProps {
  onPeakPress: (peak: Peak) => void;
  onChallengePress: (challenge: ChallengeProgress) => void;
  /**
   * Optional: hide omnibar in some states (e.g. detail mode).
   */
  visible?: boolean;
}

export default function ExploreOmnibar({ onPeakPress, onChallengePress, visible = true }: ExploreOmnibarProps) {
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
    queryFn: async (): Promise<{ peaks: Peak[]; challenges: ChallengeProgress[] }> => {
      if (debouncedQuery.length < 2) return { peaks: [], challenges: [] };
      const client = getApiClient();
      const [peaks, challenges] = await Promise.all([
        endpoints.searchPeaks(client, { search: debouncedQuery, perPage: "10", page: "1", showSummittedPeaks: "true" }),
        endpoints.searchChallenges(client, { search: debouncedQuery }),
      ]);
      return { peaks, challenges };
    },
    enabled: visible,
    staleTime: 1000 * 10,
  });

  const results = useMemo<SearchResult[]>(() => {
    const peaks = (data?.peaks ?? []).slice(0, MAX_PEAKS).map((p) => ({ type: "peak" as const, id: p.id, peak: p }));
    const challenges = (data?.challenges ?? [])
      .slice(0, MAX_CHALLENGES)
      .map((c) => ({ type: "challenge" as const, id: c.id, challenge: c }));
    // Web app prioritizes challenges first; do same.
    return [...challenges, ...peaks];
  }, [data?.challenges, data?.peaks]);

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
              })
            )}
          </CardFrame>
        </View>
      ) : null}
    </View>
  );
}


