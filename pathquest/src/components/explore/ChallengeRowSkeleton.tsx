/**
 * ChallengeRowSkeleton
 * 
 * Loading skeleton that matches the ChallengeRow layout.
 * Shows animated placeholders for challenge name, region, peaks, progress bar.
 */

import React from 'react';
import { View } from 'react-native';
import { CardFrame } from '@/src/components/ui';
import Skeleton from '@/src/components/ui/Skeleton';
import { useTheme } from '@/src/theme';

interface ChallengeRowSkeletonProps {
  /** Unique key for the skeleton animation */
  index?: number;
}

const ChallengeRowSkeleton: React.FC<ChallengeRowSkeletonProps> = ({ index = 0 }) => {
  const { colors } = useTheme();

  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
      <CardFrame 
        topo="corner" 
        seed={`challenge-skeleton:${index}`} 
        style={{ padding: 12 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {/* Challenge info skeleton */}
          <View style={{ flex: 1, marginRight: 12 }}>
            {/* Challenge name row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Skeleton variant="text" width="60%" height={16} />
            </View>

            {/* Region and peak count */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
              <Skeleton variant="text" width="35%" height={12} />
              <Skeleton variant="text" width={50} height={12} />
            </View>

            {/* Progress bar skeleton */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 }}>
              <View style={{ flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' }}>
                <Skeleton variant="rectangle" width="100%" height={6} borderRadius={3} />
              </View>
              <Skeleton variant="text" width={48} height={11} />
            </View>
          </View>

          {/* Chevron placeholder */}
          <Skeleton variant="rectangle" width={14} height={14} borderRadius={2} />
        </View>
      </CardFrame>
    </View>
  );
};

export default React.memo(ChallengeRowSkeleton);




