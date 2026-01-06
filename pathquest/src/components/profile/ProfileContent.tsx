/**
 * ProfileContent
 * 
 * Main profile wrapper with sub-tab navigation:
 * - Stats: Highlight reel and climbing statistics
 * - Peaks: List of summited peaks
 * - Journal: Summit journal entries
 * - Challenges: Accepted challenges with progress
 */

import React, { useState, useCallback } from 'react';
import { View, Alert } from 'react-native';
import { TabSwitcher } from '@/src/components/shared';
import { useProfileData } from '@/src/hooks';
import type { JournalEntry } from '@/src/hooks';
import StatsContent from './StatsContent';
import PeaksContent from './PeaksContent';
import JournalContent from './JournalContent';
import ChallengesContent from './ChallengesContent';

type ProfileTab = 'stats' | 'peaks' | 'journal' | 'challenges';

interface ProfileContentProps {
  userId: string;
  onPeakPress?: (peakId: string) => void;
  onChallengePress?: (challengeId: string) => void;
}

const ProfileContent: React.FC<ProfileContentProps> = ({
  userId,
  onPeakPress,
  onChallengePress,
}) => {
  const [activeTab, setActiveTab] = useState<ProfileTab>('stats');
  
  // Fetch profile data
  const {
    stats,
    peaks,
    peaksTotalCount,
    journalEntries,
    journalTotalCount,
    challenges,
    isStatsLoading,
    isPeaksLoading,
    isJournalLoading,
    isChallengesLoading,
  } = useProfileData(userId);
  
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
    switch (activeTab) {
      case 'stats':
        return (
          <StatsContent 
            stats={stats}
            isLoading={isStatsLoading}
          />
        );
      case 'peaks':
        return (
          <PeaksContent 
            initialPeaks={peaks}
            totalCount={peaksTotalCount}
            totalSummitsCount={stats?.totalSummits}
            userId={userId}
            onPeakPress={(peak) => onPeakPress?.(peak.id)}
            isLoading={isPeaksLoading}
          />
        );
      case 'journal':
        return (
          <JournalContent 
            initialEntries={journalEntries}
            totalCount={journalTotalCount}
            userId={userId}
            onAddNotes={handleAddNotes}
            onEditEntry={handleEditEntry}
            isLoading={isJournalLoading}
          />
        );
      case 'challenges':
        return (
          <ChallengesContent 
            challenges={challenges}
            onChallengePress={(challenge) => onChallengePress?.(challenge.id)}
            isLoading={isChallengesLoading}
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
          tabs={[
            { id: 'stats', label: 'Stats' },
            { id: 'peaks', label: 'Peaks' },
            { id: 'journal', label: 'Journal' },
            { id: 'challenges', label: 'Challenges' },
          ]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
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
