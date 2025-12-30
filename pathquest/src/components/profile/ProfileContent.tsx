/**
 * ProfileContent
 * 
 * Main profile wrapper with sub-tab navigation:
 * - Stats: Highlight reel and climbing statistics
 * - Peaks: List of summited peaks
 * - Journal: Summit journal entries
 * - Challenges: Accepted challenges with progress
 */

import React, { useState } from 'react';
import { View, TouchableOpacity, ScrollView } from 'react-native';
import { BarChart3, MapPin, BookOpen, Trophy } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Text } from '@/src/components/ui';
import StatsContent from './StatsContent';
import PeaksContent from './PeaksContent';
import JournalContent from './JournalContent';
import ChallengesContent from './ChallengesContent';

type ProfileTab = 'stats' | 'peaks' | 'journal' | 'challenges';

interface ProfileContentProps {
  userId: string;
  onPeakPress?: (peakId: string) => void;
  onChallengePress?: (challengeId: string) => void;
  isLoading?: boolean;
}

interface TabButtonProps {
  Icon: LucideIcon;
  label: string;
  isActive: boolean;
  onPress: () => void;
}

const TabButton: React.FC<TabButtonProps> = ({ Icon, label, isActive, onPress }) => {
  return (
    <TouchableOpacity
      className={`flex-row items-center gap-1.5 py-2 px-3 rounded-lg ${
        isActive ? 'bg-background' : ''
      }`}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Icon
        size={14} 
        color={isActive ? '#EDE5D8' : '#A9A196'} 
      />
      <Text className={`text-[13px] ${isActive ? 'text-foreground font-semibold' : 'text-muted-foreground font-medium'}`}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const ProfileContent: React.FC<ProfileContentProps> = ({
  userId,
  onPeakPress,
  onChallengePress,
  isLoading = false,
}) => {
  const [activeTab, setActiveTab] = useState<ProfileTab>('stats');

  const renderContent = () => {
    switch (activeTab) {
      case 'stats':
        return (
          <StatsContent 
            stats={undefined}
            isLoading={isLoading}
          />
        );
      case 'peaks':
        return (
          <PeaksContent 
            peaks={[]}
            onPeakPress={(peak) => onPeakPress?.(peak.id)}
            isLoading={isLoading}
          />
        );
      case 'journal':
        return (
          <JournalContent 
            entries={[]}
            isLoading={isLoading}
          />
        );
      case 'challenges':
        return (
          <ChallengesContent 
            challenges={[]}
            onChallengePress={(challenge) => onChallengePress?.(challenge.id)}
            isLoading={isLoading}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View className="flex-1">
      {/* Sub-tab bar */}
      <View className="py-2 border-b border-border">
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="px-4"
        >
          <View className="flex-row p-1 rounded-lg bg-muted gap-1">
            <TabButton
              Icon={BarChart3}
              label="Stats"
              isActive={activeTab === 'stats'}
              onPress={() => setActiveTab('stats')}
            />
            <TabButton
              Icon={MapPin}
              label="Peaks"
              isActive={activeTab === 'peaks'}
              onPress={() => setActiveTab('peaks')}
            />
            <TabButton
              Icon={BookOpen}
              label="Journal"
              isActive={activeTab === 'journal'}
              onPress={() => setActiveTab('journal')}
            />
            <TabButton
              Icon={Trophy}
              label="Challenges"
              isActive={activeTab === 'challenges'}
              onPress={() => setActiveTab('challenges')}
            />
          </View>
        </ScrollView>
      </View>

      {/* Content */}
      <View className="flex-1">
        {renderContent()}
      </View>
    </View>
  );
};

export default ProfileContent;
