/**
 * ImportProgressCard
 * 
 * Shows the progress of historical Strava activity import.
 * Displays:
 * - Animated progress bar
 * - Activities processed count
 * - Summits found counter
 * - ETA display
 * - User-friendly status message
 */

import React, { useEffect } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Download, Mountain, Clock, X, Sparkles } from 'lucide-react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '@/src/theme';
import { Text, Value, CardFrame } from '@/src/components/ui';

export interface ImportStatus {
  totalActivities: number;
  processedActivities: number;
  pendingActivities: number;
  skippedActivities: number;
  summitsFound: number;
  percentComplete: number;
  estimatedHoursRemaining: number | null;
  status: 'not_started' | 'processing' | 'complete';
  message: string;
}

interface ImportProgressCardProps {
  status: ImportStatus | null;
  onDismiss?: () => void;
}

const ImportProgressCard: React.FC<ImportProgressCardProps> = ({ 
  status, 
  onDismiss,
}) => {
  const { colors, isDark } = useTheme();
  
  // Animated progress bar width
  const progressWidth = useSharedValue(0);
  
  // Shimmer animation for progress bar
  const shimmerPosition = useSharedValue(-1);

  useEffect(() => {
    if (status?.percentComplete !== undefined) {
      progressWidth.value = withTiming(status.percentComplete, {
        duration: 500,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [status?.percentComplete]);

  // Start shimmer animation
  useEffect(() => {
    shimmerPosition.value = withRepeat(
      withTiming(2, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      false
    );
  }, []);

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerPosition.value * 150 }],
    opacity: 0.3,
  }));

  // Don't show if no status, complete, or not started
  if (!status || status.status === 'complete' || status.status === 'not_started') {
    return null;
  }

  const { 
    totalActivities, 
    processedActivities, 
    summitsFound, 
    percentComplete, 
    estimatedHoursRemaining,
    message,
  } = status;

  // Format ETA for display
  const formatEta = (hours: number | null): string => {
    if (hours === null) return '';
    if (hours < 1) return 'Less than an hour';
    if (hours < 24) {
      const h = Math.ceil(hours);
      return `~${h} hour${h !== 1 ? 's' : ''}`;
    }
    const days = Math.ceil(hours / 24);
    return `~${days} day${days !== 1 ? 's' : ''}`;
  };

  return (
    <CardFrame 
      topo="corner" 
      seed="import-progress"
      style={{ 
        padding: 0,
        overflow: 'hidden',
      }}
    >
      {/* Accent gradient */}
      <View 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 80,
          backgroundColor: colors.primary,
          opacity: isDark ? 0.1 : 0.08,
        }}
      />

      {/* Dismiss button */}
      {onDismiss && (
        <TouchableOpacity
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 10,
            padding: 6,
            borderRadius: 16,
            backgroundColor: `${colors.foreground}10`,
          }}
          onPress={onDismiss}
          activeOpacity={0.7}
        >
          <X size={16} color={colors.mutedForeground} />
        </TouchableOpacity>
      )}

      <View style={{ padding: 16 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <View 
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: `${colors.primary}20`,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Download size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text 
              style={{ 
                color: colors.foreground,
                fontSize: 15,
                fontWeight: '600',
              }}
            >
              Importing Your Strava History
            </Text>
            <Text 
              style={{ 
                color: colors.mutedForeground,
                fontSize: 12,
              }}
            >
              Biggest adventures processed first
            </Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={{ marginBottom: 14 }}>
          <View 
            style={{ 
              flexDirection: 'row', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: 6,
            }}
          >
            <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>
              {processedActivities.toLocaleString()} of {totalActivities.toLocaleString()} activities
            </Text>
            <Value style={{ color: colors.foreground, fontSize: 13, fontWeight: '600' }}>
              {percentComplete}%
            </Value>
          </View>
          
          <View 
            style={{
              height: 10,
              borderRadius: 5,
              backgroundColor: `${colors.foreground}15`,
              overflow: 'hidden',
            }}
          >
            <Animated.View
              style={[
                {
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  bottom: 0,
                  borderRadius: 5,
                  backgroundColor: colors.primary,
                },
                progressBarStyle,
              ]}
            >
              {/* Shimmer effect */}
              <Animated.View
                style={[
                  {
                    position: 'absolute',
                    top: 0,
                    left: -50,
                    width: 50,
                    height: '100%',
                    backgroundColor: 'white',
                  },
                  shimmerStyle,
                ]}
              />
            </Animated.View>
          </View>
        </View>

        {/* Stats row */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
          {/* Summits found */}
          <View 
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              paddingVertical: 10,
              paddingHorizontal: 12,
              borderRadius: 10,
              backgroundColor: `${colors.secondary}15`,
            }}
          >
            <Mountain size={18} color={colors.secondary} />
            <View>
              <Value style={{ color: colors.foreground, fontSize: 18, fontWeight: '700' }}>
                {summitsFound}
              </Value>
              <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>
                summit{summitsFound !== 1 ? 's' : ''} found
              </Text>
            </View>
          </View>

          {/* ETA */}
          <View 
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              paddingVertical: 10,
              paddingHorizontal: 12,
              borderRadius: 10,
              backgroundColor: `${colors.primary}15`,
            }}
          >
            <Clock size={18} color={colors.primary} />
            <View>
              <Text 
                style={{ 
                  color: colors.foreground, 
                  fontSize: 13, 
                  fontWeight: '600',
                }}
                numberOfLines={1}
              >
                {formatEta(estimatedHoursRemaining) || 'Calculating...'}
              </Text>
              <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>
                remaining
              </Text>
            </View>
          </View>
        </View>

        {/* Message */}
        <View 
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingTop: 4,
          }}
        >
          <Sparkles size={12} color={colors.mutedForeground} />
          <Text 
            style={{ 
              color: colors.mutedForeground, 
              fontSize: 12,
              fontStyle: 'italic',
              flex: 1,
            }}
            numberOfLines={2}
          >
            {message}
          </Text>
        </View>
      </View>
    </CardFrame>
  );
};

export default ImportProgressCard;

