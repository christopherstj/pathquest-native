/**
 * DiscoveryContent
 * 
 * Shows the list of peaks and challenges visible in the current map viewport.
 * This is the default content for the Explore tab when no detail is selected.
 */

import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { ZoomIn, MapPin, Trophy } from 'lucide-react-native';
import { SecondaryCTA, Text } from '@/src/components/ui';
import { TabSwitcher } from '@/src/components/shared';
import { useTheme } from '@/src/theme';
import { useMapStore } from '@/src/store/mapStore';
import { useAllChallenges } from '@/src/hooks';
import PeakRow from './PeakRow';
import PeakRowSkeleton from './PeakRowSkeleton';
import ChallengeRow from './ChallengeRow';
import ChallengeRowSkeleton from './ChallengeRowSkeleton';
import type { Peak, ChallengeProgress } from '@pathquest/shared';

type DiscoveryTab = 'peaks' | 'challenges';
type ChallengeMode = 'inView' | 'all';

interface DiscoveryContentProps {
  onPeakPress?: (peak: Peak) => void;
  onChallengePress?: (challenge: ChallengeProgress) => void;
  /** Controlled active tab (persisted by parent) */
  activeTab?: DiscoveryTab;
  onTabChange?: (tab: DiscoveryTab) => void;
  /** Controlled challenge filter (persisted by parent) */
  challengeFilter?: ChallengeMode;
  onChallengeFilterChange?: (filter: ChallengeMode) => void;
}

const DiscoveryContent: React.FC<DiscoveryContentProps> = ({
  onPeakPress,
  onChallengePress,
  activeTab: controlledTab,
  onTabChange,
  challengeFilter: controlledFilter,
  onChallengeFilterChange,
}) => {
  // Support both controlled and uncontrolled modes
  const [internalTab, setInternalTab] = useState<DiscoveryTab>('peaks');
  const [internalFilter, setInternalFilter] = useState<ChallengeMode>('inView');
  const [allChallengesLimit, setAllChallengesLimit] = useState(50);
  
  const activeTab = controlledTab ?? internalTab;
  const setActiveTab = onTabChange ?? setInternalTab;
  const challengeMode = controlledFilter ?? internalFilter;
  const setChallengeMode = onChallengeFilterChange ?? setInternalFilter;
  const { colors } = useTheme();
  
  const visiblePeaks = useMapStore((state) => state.visiblePeaks);
  const visibleChallenges = useMapStore((state) => state.visibleChallenges);
  const isZoomedOutTooFar = useMapStore((state) => state.isZoomedOutTooFar);
  const isLoadingPeaks = useMapStore((state) => state.isLoadingPeaks);
  const isLoadingChallenges = useMapStore((state) => state.isLoadingChallenges);

  const isAllChallengesMode = activeTab === 'challenges' && challengeMode === 'all';

  const { data: allChallengesData, isLoading: allChallengesLoading } = useAllChallenges(isAllChallengesMode);

  // Sort by percent complete (descending) — most progress at top
  const sortByProgress = (list: ChallengeProgress[]) =>
    [...list].sort((a, b) => {
      const aTotal = a.total > 0 ? a.total : (a.num_peaks ?? 1);
      const bTotal = b.total > 0 ? b.total : (b.num_peaks ?? 1);
      const aPct = aTotal > 0 ? (a.completed ?? 0) / aTotal : 0;
      const bPct = bTotal > 0 ? (b.completed ?? 0) / bTotal : 0;
      return bPct - aPct; // descending
    });

  const allChallenges = useMemo(() => sortByProgress(allChallengesData ?? []), [allChallengesData]);

  // Also sort visible (in-view) challenges by progress
  const sortedVisibleChallenges = useMemo(() => sortByProgress(visibleChallenges), [visibleChallenges]);

  const allChallengesVisible = allChallenges.slice(0, allChallengesLimit);
  const allHasMore = allChallenges.length > allChallengesVisible.length;

  // Show zoom prompt if too zoomed out (except when browsing all challenges).
  if (isZoomedOutTooFar && !isAllChallengesMode) {
    return (
      <View className="flex-1 items-center justify-center p-8">
        <ZoomIn size={32} color={colors.mutedForeground} />
        <Text className="text-foreground text-lg font-semibold mt-4 text-center font-display">
          Zoom in to explore
        </Text>
        <Text className="text-muted-foreground text-sm mt-2 text-center leading-5">
          Pan and zoom the map to discover peaks and challenges in the area
        </Text>
      </View>
    );
  }

  const peakCount = visiblePeaks.length;
  const challengeCount = visibleChallenges.length;

  return (
    <View style={{ flex: 1 }}>
      {/* Tab switcher */}
      <View style={{ marginHorizontal: 16, marginTop: 12, marginBottom: 12 }}>
        <TabSwitcher
          tabs={[
            { id: 'peaks', label: 'Peaks', badge: peakCount },
            { id: 'challenges', label: 'Challenges', badge: challengeCount },
          ]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </View>

      {/* Challenges mode toggle (viewport vs all) */}
      {activeTab === 'challenges' ? (
        <View style={{ marginHorizontal: 16, marginBottom: 12 }}>
          <TabSwitcher
            tabs={[
              { id: 'inView', label: 'In view', badge: challengeCount },
              { id: 'all', label: 'All' },
            ]}
            activeTab={challengeMode}
            onTabChange={(next) => {
              setChallengeMode(next);
              if (next === "all") setAllChallengesLimit(50);
            }}
          />
        </View>
      ) : null}

      {/* Content */}
      <BottomSheetScrollView
        style={{ flex: 1 }}
        // Extra bottom padding so the last row (and "Load more") don't tuck behind the bottom tab bar.
        contentContainerStyle={{ paddingBottom: 96 }}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'peaks' ? (
          // Show loading skeletons when peaks are loading and we have no data yet
          isLoadingPeaks && peakCount === 0 ? (
            <View>
              {[0, 1, 2, 3, 4].map((i) => (
                <PeakRowSkeleton key={i} index={i} />
              ))}
            </View>
          ) : peakCount > 0 ? (
            visiblePeaks.map((peak) => (
              <PeakRow
                key={peak.id}
                peak={peak}
                onPress={onPeakPress}
              />
            ))
          ) : (
            <View className="items-center justify-center p-8">
              <MapPin size={24} color={colors.mutedForeground} />
              <Text className="text-muted-foreground text-sm mt-3 text-center">
                No peaks in this area
              </Text>
            </View>
          )
        ) : isAllChallengesMode ? (
          allChallengesLoading ? (
            <View>
              {[0, 1, 2, 3, 4].map((i) => (
                <ChallengeRowSkeleton key={i} index={i} />
              ))}
            </View>
          ) : allChallengesVisible.length > 0 ? (
            <View>
              {allChallengesVisible.map((challenge) => (
                <ChallengeRow key={challenge.id} challenge={challenge} onPress={onChallengePress} />
              ))}

              {allHasMore ? (
                <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
                  <SecondaryCTA
                    label="Load more"
                    onPress={() => setAllChallengesLimit((n) => n + 50)}
                  />
                </View>
              ) : null}
            </View>
          ) : (
            <View className="items-center justify-center p-8">
              <Trophy size={24} color={colors.mutedForeground} />
              <Text className="text-muted-foreground text-sm mt-3 text-center">
                No challenges found
              </Text>
            </View>
          )
        ) : (
          // Show loading skeletons when challenges are loading and we have no data yet
          isLoadingChallenges && challengeCount === 0 ? (
            <View>
              {[0, 1, 2, 3, 4].map((i) => (
                <ChallengeRowSkeleton key={i} index={i} />
              ))}
            </View>
          ) : challengeCount > 0 ? (
            sortedVisibleChallenges.map((challenge) => (
              <ChallengeRow key={challenge.id} challenge={challenge} onPress={onChallengePress} />
            ))
          ) : (
            <View className="items-center justify-center p-8">
              <Trophy size={24} color={colors.mutedForeground} />
              <Text className="text-muted-foreground text-sm mt-3 text-center">
                No challenges in this area
              </Text>
            </View>
          )
        )}
      </BottomSheetScrollView>
    </View>
  );
};

export default DiscoveryContent;
