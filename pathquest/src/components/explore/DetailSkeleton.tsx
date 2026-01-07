/**
 * DetailSkeleton
 * 
 * Loading skeleton for peak and challenge detail pages.
 * Shows animated placeholder content while data loads.
 */

import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing } from 'react-native';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { ChevronLeft } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import { useTheme } from '@/src/theme';

interface DetailSkeletonProps {
  onBack?: () => void;
  type?: 'peak' | 'challenge' | 'activity';
}

// Animated shimmer bar
const ShimmerBar: React.FC<{ 
  width: number | string; 
  height: number; 
  style?: object;
  delay?: number;
}> = ({ width, height, style, delay = 0 }) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const { colors } = useTheme();
  
  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1200,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [shimmerAnim, delay]);
  
  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.6],
  });
  
  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: height / 2,
          backgroundColor: colors.muted,
          opacity,
        },
        style,
      ]}
    />
  );
};

export default function DetailSkeleton({ onBack, type = 'peak' }: DetailSkeletonProps) {
  const { colors } = useTheme();
  
  return (
    <View style={{ flex: 1 }}>
      {/* Back button */}
      {onBack && (
        <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingTop: 8 }}>
          <TouchableOpacity
            onPress={onBack}
            activeOpacity={0.7}
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ChevronLeft size={20} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      )}
      
      <BottomSheetScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={{ padding: 16, paddingTop: onBack ? 8 : 16, paddingBottom: 28 }}
      >
        {/* Hero card skeleton */}
        <View 
          style={{ 
            borderRadius: 16, 
            padding: 20,
            backgroundColor: colors.muted,
            marginBottom: 20,
          }}
        >
          {/* Badge */}
          <ShimmerBar width={80} height={24} style={{ marginBottom: 16 }} />
          
          {/* Title */}
          <ShimmerBar width="80%" height={28} style={{ marginBottom: 8 }} delay={100} />
          
          {/* Subtitle */}
          <ShimmerBar width="50%" height={16} style={{ marginBottom: 20 }} delay={200} />
          
          {type === 'challenge' ? (
            // Challenge progress circle placeholder
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <View 
                style={{ 
                  width: 80, 
                  height: 80, 
                  borderRadius: 40,
                  backgroundColor: colors.border,
                  opacity: 0.5,
                }}
              />
              <View style={{ flex: 1 }}>
                <ShimmerBar width="60%" height={20} style={{ marginBottom: 8 }} delay={300} />
                <ShimmerBar width="40%" height={14} delay={400} />
              </View>
            </View>
          ) : (
            // Peak elevation/stats placeholder
            <View style={{ flexDirection: 'row', gap: 16 }}>
              <ShimmerBar width={100} height={36} delay={300} />
              <ShimmerBar width={80} height={36} delay={400} />
            </View>
          )}
          
          {/* CTA button */}
          <ShimmerBar 
            width="100%" 
            height={48} 
            style={{ marginTop: 20, borderRadius: 12 }} 
            delay={500} 
          />
        </View>
        
        {/* Tab switcher skeleton */}
        <View 
          style={{ 
            flexDirection: 'row', 
            gap: 8,
            marginBottom: 16,
          }}
        >
          <ShimmerBar width={80} height={36} delay={600} />
          <ShimmerBar width={80} height={36} delay={650} />
          {type === 'challenge' && <ShimmerBar width={80} height={36} delay={700} />}
        </View>
        
        {/* Content cards skeleton */}
        {[0, 1, 2].map((i) => (
          <View 
            key={i}
            style={{ 
              borderRadius: 12, 
              padding: 16,
              backgroundColor: colors.muted,
              marginBottom: 12,
              opacity: 0.7,
            }}
          >
            <ShimmerBar width="70%" height={18} style={{ marginBottom: 12 }} delay={750 + i * 100} />
            <ShimmerBar width="90%" height={14} style={{ marginBottom: 8 }} delay={800 + i * 100} />
            <ShimmerBar width="60%" height={14} delay={850 + i * 100} />
          </View>
        ))}
      </BottomSheetScrollView>
    </View>
  );
}

