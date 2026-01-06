/**
 * ProfileContent
 * 
 * Main profile wrapper with sub-tab navigation:
 * - Stats: Highlight reel and climbing statistics
 * - Peaks: List of summited peaks
 * - Journal: Summit journal entries
 * - Challenges: Accepted challenges with progress
 */

import React, { useMemo, useState, useCallback } from 'react';
import { View, Alert } from 'react-native';
import { TabSwitcher } from '@/src/components/shared';
import { useProfileData, useUserJournal, useUserPeaks, useUserProfile } from '@/src/hooks/useProfileData';
import type { JournalEntry } from '@/src/hooks';
import StatsContent from './StatsContent';
import PeaksContent from './PeaksContent';
import JournalContent from './JournalContent';
import ChallengesContent from './ChallengesContent';

type ProfileTab = 'stats' | 'peaks' | 'journal' | 'challenges';
type PublicProfileTab = 'stats' | 'peaks' | 'journal' | 'challenges';

interface ProfileContentProps {
  userId: string;
  onPeakPress?: (peakId: string) => void;
  onChallengePress?: (challengeId: string) => void;
  /** When false, render a public view (Stats + Peaks only) */
  isOwner?: boolean;
  /** When true, use BottomSheetScrollView instead of ScrollView */
  inBottomSheet?: boolean;
}

const ProfileContent: React.FC<ProfileContentProps> = ({
  userId,
  onPeakPress,
  onChallengePress,
  isOwner = true,
  inBottomSheet = false,
}) => {
  const [activeTab, setActiveTab] = useState<ProfileTab>('stats');
  const [publicTab, setPublicTab] = useState<PublicProfileTab>('stats');

  // Owner view (full): use combined hook.
  const ownerData = useProfileData(isOwner ? userId : undefined);

  // Public view: profile + peaks + journal + challenges.
  const publicProfile = useUserProfile(!isOwner ? userId : undefined);
  const publicPeaks = useUserPeaks(!isOwner ? userId : undefined, 1, 50);
  const publicJournal = useUserJournal(!isOwner ? userId : undefined, 1, 30);
  const publicChallenges = useMemo(() => {
    const accepted = publicProfile.data?.acceptedChallenges ?? [];
    const completed = publicProfile.data?.completedChallenges ?? [];
    return [...accepted, ...completed];
  }, [publicProfile.data?.acceptedChallenges, publicProfile.data?.completedChallenges]);

  const publicStats = publicProfile.data?.stats
    ? {
        totalPeaks: publicProfile.data.stats.totalPeaks,
        totalSummits: publicProfile.data.stats.totalSummits,
        highestPeak: publicProfile.data.stats.highestPeak ?? undefined,
        lowestPeak: publicProfile.data.stats.lowestPeak
          ? {
              name: publicProfile.data.stats.lowestPeak.name,
              elevation: publicProfile.data.stats.lowestPeak.elevation,
            }
          : undefined,
        mostVisitedPeak: publicProfile.data.stats.mostVisitedPeak
          ? {
              name: publicProfile.data.stats.mostVisitedPeak.name,
              visitCount: publicProfile.data.stats.mostVisitedPeak.visitCount,
            }
          : undefined,
        challengesCompleted: publicProfile.data.stats.challengesCompleted,
        totalElevation: publicProfile.data.stats.totalElevationGained,
        statesClimbed: publicProfile.data.stats.statesClimbed?.length ?? 0,
        countriesClimbed: publicProfile.data.stats.countriesClimbed?.length ?? 0,
        climbingStreak: publicProfile.data.stats.climbingStreak ?? undefined,
        peakBreakdown: publicProfile.data.stats.peakTypeBreakdown
          ? {
              fourteeners: publicProfile.data.stats.peakTypeBreakdown.fourteeners,
              thirteeners: publicProfile.data.stats.peakTypeBreakdown.thirteeners,
              twelvers: publicProfile.data.stats.peakTypeBreakdown.twelvers,
              other:
                (publicProfile.data.stats.peakTypeBreakdown.elevenThousanders ?? 0) +
                (publicProfile.data.stats.peakTypeBreakdown.tenThousanders ?? 0) +
                (publicProfile.data.stats.peakTypeBreakdown.other ?? 0),
            }
          : undefined,
      }
    : undefined;
  
  // Journal entry handlers (placeholder - will wire to modals later)
  const handleAddNotes = useCallback((entry: JournalEntry) => {
    // TODO: Open add report modal
    Alert.alert(
      'Add Report',
      `Add trip report for ${entry.peakName}`,
      [{ text: 'OK' }]
    );
  }, []);
  
  const handleEditEntry = useCallback((entry: JournalEntry) => {
    // TODO: Open edit report modal
    Alert.alert(
      'Edit Report',
      `Edit trip report for ${entry.peakName}`,
      [{ text: 'OK' }]
    );
  }, []);

  const renderContent = () => {
    if (!isOwner) {
      switch (publicTab) {
        case 'stats':
          return <StatsContent stats={publicStats} isLoading={publicProfile.isLoading} inBottomSheet={inBottomSheet} />;
        case 'peaks':
          return (
            <PeaksContent
              initialPeaks={publicPeaks.data?.peaks ?? []}
              totalCount={publicPeaks.data?.totalCount ?? 0}
              totalSummitsCount={publicProfile.data?.stats?.totalSummits}
              userId={userId}
              onPeakPress={(peak) => onPeakPress?.(peak.id)}
              isLoading={publicPeaks.isLoading}
              inBottomSheet={inBottomSheet}
            />
          );
        case 'journal':
          return (
            <JournalContent
              initialEntries={publicJournal.data?.entries ?? []}
              totalCount={publicJournal.data?.totalCount ?? 0}
              userId={userId}
              // Public view: read-only
              isLoading={publicJournal.isLoading}
              inBottomSheet={inBottomSheet}
            />
          );
        case 'challenges':
          return (
            <ChallengesContent
              challenges={publicChallenges}
              onChallengePress={(challenge) => onChallengePress?.(challenge.id)}
              isLoading={publicProfile.isLoading}
              inBottomSheet={inBottomSheet}
            />
          );
        default:
          return null;
      }
    }

    switch (activeTab) {
      case 'stats':
        return (
          <StatsContent 
            stats={ownerData.stats}
            isLoading={ownerData.isStatsLoading}
            inBottomSheet={inBottomSheet}
          />
        );
      case 'peaks':
        return (
          <PeaksContent 
            initialPeaks={ownerData.peaks}
            totalCount={ownerData.peaksTotalCount}
            totalSummitsCount={ownerData.stats?.totalSummits}
            userId={userId}
            onPeakPress={(peak) => onPeakPress?.(peak.id)}
            isLoading={ownerData.isPeaksLoading}
            inBottomSheet={inBottomSheet}
          />
        );
      case 'journal':
        return (
          <JournalContent 
            initialEntries={ownerData.journalEntries}
            totalCount={ownerData.journalTotalCount}
            userId={userId}
            onAddNotes={handleAddNotes}
            onEditEntry={handleEditEntry}
            isLoading={ownerData.isJournalLoading}
            inBottomSheet={inBottomSheet}
          />
        );
      case 'challenges':
        return (
          <ChallengesContent 
            challenges={ownerData.challenges}
            onChallengePress={(challenge) => onChallengePress?.(challenge.id)}
            isLoading={ownerData.isChallengesLoading}
            inBottomSheet={inBottomSheet}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View className="flex-1">
      {/* Sub-tab bar */}
      <View className="px-4 py-2 border-b border-border">
        <TabSwitcher
          tabs={
            isOwner
              ? [
                  { id: 'stats', label: 'Stats' },
                  { id: 'peaks', label: 'Peaks' },
                  { id: 'journal', label: 'Journal' },
                  { id: 'challenges', label: 'Challenges' },
                ]
              : [
                  { id: 'stats', label: 'Stats' },
                  { id: 'peaks', label: 'Peaks' },
                  { id: 'journal', label: 'Journal' },
                  { id: 'challenges', label: 'Challenges' },
                ]
          }
          activeTab={isOwner ? activeTab : publicTab}
          onTabChange={(t) => {
            if (isOwner) setActiveTab(t as ProfileTab);
            else setPublicTab(t as PublicProfileTab);
          }}
        />
      </View>

      {/* Content */}
      <View className="flex-1">
        {renderContent()}
      </View>
    </View>
  );
};

export default ProfileContent;
