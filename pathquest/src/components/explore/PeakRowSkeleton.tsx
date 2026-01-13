/**
 * PeakRowSkeleton
 * 
 * Loading skeleton that matches the PeakRow layout.
 * Shows animated placeholders for peak name, elevation, location, etc.
 */

import React from 'react';
import { View } from 'react-native';
import { CardFrame } from '@/src/components/ui';
import Skeleton from '@/src/components/ui/Skeleton';
import { useTheme } from '@/src/theme';

interface PeakRowSkeletonProps {
  /** Unique key for the skeleton animation */
  index?: number;
}

const PeakRowSkeleton: React.FC<PeakRowSkeletonProps> = ({ index = 0 }) => {
  const { colors } = useTheme();

  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
      <CardFrame 
        topo="corner" 
        seed={`peak-skeleton:${index}`} 
        style={{ padding: 12 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {/* Medal / Badge skeleton */}
          <View style={{ marginRight: 12 }}>
            <Skeleton variant="circle" width={44} height={44} />
          </View>

          {/* Peak info skeleton */}
          <View style={{ flex: 1, marginRight: 8 }}>
            {/* Peak name */}
            <Skeleton variant="text" width="70%" height={16} />

            {/* Elevation and location */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
              <Skeleton variant="text" width={60} height={13} />
              <Skeleton variant="text" width="40%" height={12} />
            </View>

            {/* Public summit count */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
              <Skeleton variant="circle" width={12} height={12} />
              <Skeleton variant="text" width={80} height={11} />
            </View>
          </View>

          {/* Chevron placeholder */}
          <Skeleton variant="rectangle" width={14} height={14} borderRadius={2} />
        </View>
      </CardFrame>
    </View>
  );
};

export default React.memo(PeakRowSkeleton);

