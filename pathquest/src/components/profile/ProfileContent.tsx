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
import { View } from 'react-native';
import { TabSwitcher } from '@/src/components/shared';
import { useProfileData, useUserJournal, useUserPeaks, useUserProfile } from '@/src/hooks/useProfileData';
import type { JournalEntry } from '@/src/hooks';
import type { SummitType } from '@pathquest/shared/types';
import { useAddReportStore } from '@/src/store';
import StatsContent from './StatsContent';
import PeaksContent from './PeaksContent';
import JournalContent from './JournalContent';
import ChallengesContent from './ChallengesContent';
import ReviewContent from './ReviewContent';
import { useUnconfirmedSummits } from '@/src/hooks';

type ProfileTab = 'stats' | 'peaks' | 'journal' | 'challenges' | 'review';
type PublicProfileTab = 'stats' | 'peaks' | 'journal' | 'challenges';

interface ProfileContentProps {
  userId: string;
  onPeakPress?: (peakId: string) => void;
  onChallengePress?: (challengeId: string) => void;
  onActivityPress?: (activityId: string) => void;
  /** When false, render a public view (Stats + Peaks only) */
  isOwner?: boolean;
  /** When true, use BottomSheetScrollView instead of ScrollView */
  inBottomSheet?: boolean;
}

const ProfileContent: React.FC<ProfileContentProps> = ({
  userId,
  onPeakPress,
  onChallengePress,
  onActivityPress,
  isOwner = true,
  inBottomSheet = false,
}) => {
  const [activeTab, setActiveTab] = useState<ProfileTab>('stats');
  const [publicTab, setPublicTab] = useState<PublicProfileTab>('stats');

  // Owner view (full): use combined hook.
  const ownerData = useProfileData(isOwner ? userId : undefined);
  
  // Unconfirmed summits count for Review tab badge (owner only)
  const { data: unconfirmedSummits } = useUnconfirmedSummits(isOwner ? undefined : 0);
  const unconfirmedCount = unconfirmedSummits?.length ?? 0;

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
  
  // Add Report modal store
  const openAddReportModal = useAddReportStore((s) => s.openModal);
  
  // Helper to determine summit type
  const getSummitType = (activityId?: string | number | null): SummitType => {
    // activityId can be string or number from the API
    if (activityId === null || activityId === undefined) return 'manual';
    if (typeof activityId === 'number') return 'activity';
    if (typeof activityId === 'string' && activityId.trim() !== '') return 'activity';
    return 'manual';
  };
  
  // Journal entry handlers - open AddReportModal for both add and edit
  const handleAddNotes = useCallback((entry: JournalEntry) => {
    openAddReportModal({
      ascentId: entry.id,
      peakId: entry.peakId,
      peakName: entry.peakName,
      timestamp: entry.timestamp,
      activityId: entry.activityId,
      summitType: getSummitType(entry.activityId),
      notes: entry.notes,
      difficulty: entry.difficulty as any,
      experienceRating: entry.experienceRating as any,
      conditionTags: entry.conditionTags,
      customTags: entry.customTags,
    });
  }, [openAddReportModal]);
  
  const handleEditEntry = useCallback((entry: JournalEntry) => {
    openAddReportModal({
      ascentId: entry.id,
      peakId: entry.peakId,
      peakName: entry.peakName,
      timestamp: entry.timestamp,
      activityId: entry.activityId,
      summitType: getSummitType(entry.activityId),
      notes: entry.notes,
      difficulty: entry.difficulty as any,
      experienceRating: entry.experienceRating as any,
      conditionTags: entry.conditionTags,
      customTags: entry.customTags,
    });
  }, [openAddReportModal]);

  const renderContent = () => {
    if (!isOwner) {
      switch (publicTab) {
        case 'stats':
          return <StatsContent stats={publicStats} isLoading={publicProfile.isLoading} inBottomSheet={inBottomSheet} onPeakPress={onPeakPress} />;
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
            onPeakPress={onPeakPress}
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
      case 'review':
        return (
          <ReviewContent
            inBottomSheet={inBottomSheet}
            onViewActivity={onActivityPress}
            onViewPeak={onPeakPress}
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
                  { id: 'review', label: 'Review', badge: unconfirmedCount > 0 ? unconfirmedCount : undefined },
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
