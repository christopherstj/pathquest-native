/**
 * DiscoveryContent
 * 
 * Shows the list of peaks and challenges visible in the current map viewport.
 * This is the default content for the Explore tab when no detail is selected.
 */

import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { ZoomIn, MapPin, Trophy } from 'lucide-react-native';
import { Text } from '@/src/components/ui';
import { useMapStore } from '@/src/store/mapStore';
import PeakRow from './PeakRow';
import ChallengeRow from './ChallengeRow';
import type { Peak, ChallengeProgress } from '@pathquest/shared';

type DiscoveryTab = 'peaks' | 'challenges';

interface DiscoveryContentProps {
  onPeakPress?: (peak: Peak) => void;
  onChallengePress?: (challenge: ChallengeProgress) => void;
}

const DiscoveryContent: React.FC<DiscoveryContentProps> = ({
  onPeakPress,
  onChallengePress,
}) => {
  const [activeTab, setActiveTab] = useState<DiscoveryTab>('peaks');
  
  const visiblePeaks = useMapStore((state) => state.visiblePeaks);
  const visibleChallenges = useMapStore((state) => state.visibleChallenges);
  const isZoomedOutTooFar = useMapStore((state) => state.isZoomedOutTooFar);

  // Show zoom prompt if too zoomed out
  if (isZoomedOutTooFar) {
    return (
      <View className="flex-1 items-center justify-center p-8">
        <ZoomIn size={32} color="#A9A196" />
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
    <View className="flex-1">
      {/* Tab switcher */}
      <View className="flex-row mx-4 mt-2 mb-3 p-1 rounded-lg bg-muted gap-1">
        <TouchableOpacity
          className={`flex-1 flex-row items-center justify-center gap-1.5 py-2 px-3 rounded-lg ${
            activeTab === 'peaks' ? 'bg-background' : ''
          }`}
          onPress={() => setActiveTab('peaks')}
          activeOpacity={0.7}
        >
          <MapPin
            size={14} 
            color={activeTab === 'peaks' ? '#EDE5D8' : '#A9A196'} 
          />
          <Text className={`text-[13px] font-medium font-display ${
            activeTab === 'peaks' ? 'text-foreground' : 'text-muted-foreground'
          }`}>
            Peaks ({peakCount})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          className={`flex-1 flex-row items-center justify-center gap-1.5 py-2 px-3 rounded-lg ${
            activeTab === 'challenges' ? 'bg-background' : ''
          }`}
          onPress={() => setActiveTab('challenges')}
          activeOpacity={0.7}
        >
          <Trophy
            size={14} 
            color={activeTab === 'challenges' ? '#EDE5D8' : '#A9A196'} 
          />
          <Text className={`text-[13px] font-medium ${
            activeTab === 'challenges' ? 'text-foreground' : 'text-muted-foreground'
          }`}>
            Challenges ({challengeCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView 
        className="flex-1"
        contentContainerClassName="pb-5"
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'peaks' ? (
          peakCount > 0 ? (
            visiblePeaks.map((peak) => (
              <PeakRow
                key={peak.id}
                peak={peak}
                onPress={onPeakPress}
              />
            ))
          ) : (
            <View className="items-center justify-center p-8">
              <MapPin size={24} color="#A9A196" />
              <Text className="text-muted-foreground text-sm mt-3 text-center">
                No peaks in this area
              </Text>
            </View>
          )
        ) : (
          challengeCount > 0 ? (
            visibleChallenges.map((challenge) => (
              <ChallengeRow
                key={challenge.id}
                challenge={challenge}
                onPress={onChallengePress}
              />
            ))
          ) : (
            <View className="items-center justify-center p-8">
              <Trophy size={24} color="#A9A196" />
              <Text className="text-muted-foreground text-sm mt-3 text-center">
                No challenges in this area
              </Text>
            </View>
          )
        )}
      </ScrollView>
    </View>
  );
};

export default DiscoveryContent;
