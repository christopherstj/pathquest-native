/**
 * OnboardingModal
 * 
 * Multi-step modal shown on first login to explain what happens during signup:
 * 1. Welcome slide - "Your Strava history is being analyzed"
 * 2. How it works slide - Brief explanation of summit detection
 * 3. What to expect slide - Time estimate, biggest adventures first
 */

import React, { useState, useCallback } from 'react';
import { View, TouchableOpacity, Modal, Pressable, Dimensions, useWindowDimensions } from 'react-native';
import { 
  Mountain, 
  MapPin, 
  Clock, 
  ChevronRight, 
  ChevronLeft,
  Sparkles,
  Activity,
  Check,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring,
  withTiming,
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
} from 'react-native-reanimated';
import { useTheme } from '@/src/theme';
import { Text, Value, CardFrame, PrimaryCTA, SecondaryCTA } from '@/src/components/ui';
import TopoPattern from '@/src/components/ui/TopoPattern';
import MountainRidge from '@/src/components/ui/MountainRidge';

interface OnboardingSlide {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  highlight?: string;
}

const SLIDES: OnboardingSlide[] = [
  {
    id: 'welcome',
    icon: Mountain,
    title: 'Scanning Your Adventures',
    description: "We're analyzing your entire Strava history to find every peak you've summited. This happens automatically in the background.",
    highlight: 'Your summits will appear as we find them!',
  },
  {
    id: 'how-it-works',
    icon: MapPin,
    title: 'How Summit Detection Works',
    description: "PathQuest analyzes your GPS tracks to detect when you've reached a summit. We check elevation, approach patterns, and time spent at each peak.",
    highlight: 'Accuracy improves with more GPS data points.',
  },
  {
    id: 'what-to-expect',
    icon: Clock,
    title: 'What to Expect',
    description: "Your biggest adventures are processed first, so you'll start seeing summits within minutes. Full processing depends on your activity history.",
    highlight: 'New activities always process instantly!',
  },
];

interface OnboardingModalProps {
  visible: boolean;
  onComplete: () => void;
  totalActivities?: number;
  estimatedMinutes?: number;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({
  visible,
  onComplete,
  totalActivities,
  estimatedMinutes,
}) => {
  const { colors, isDark } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const isLastSlide = currentSlide === SLIDES.length - 1;
  const slide = SLIDES[currentSlide];
  const Icon = slide.icon;

  const handleNext = useCallback(() => {
    if (isLastSlide) {
      onComplete();
    } else {
      setCurrentSlide((prev) => prev + 1);
    }
  }, [isLastSlide, onComplete]);

  const handlePrev = useCallback(() => {
    if (currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1);
    }
  }, [currentSlide]);

  // Format time estimate for display
  const formatTimeEstimate = (minutes?: number): string => {
    if (!minutes) return 'a few minutes to several hours';
    if (minutes < 60) return `about ${Math.ceil(minutes)} minutes`;
    const hours = Math.ceil(minutes / 60);
    if (hours < 24) return `about ${hours} hour${hours !== 1 ? 's' : ''}`;
    const days = Math.ceil(hours / 24);
    return `about ${days} day${days !== 1 ? 's' : ''}`;
  };

  // Dynamic description for the "what to expect" slide
  const getDescription = (slideId: string): string => {
    if (slideId === 'what-to-expect' && totalActivities) {
      return `You have ${totalActivities.toLocaleString()} activities to process. Your biggest adventures are analyzed first, so you'll start seeing summits within minutes. Full processing takes ${formatTimeEstimate(estimatedMinutes)}.`;
    }
    return SLIDES.find(s => s.id === slideId)?.description || '';
  };

  const cardWidth = Math.min(screenWidth - 48, 360);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onComplete}
    >
      <Pressable 
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 24,
        }}
        onPress={() => {}} // Don't close on backdrop tap during onboarding
      >
        <Pressable onPress={(e) => e.stopPropagation()}>
          <View
            style={{
              width: cardWidth,
              backgroundColor: colors.card,
              borderRadius: 20,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            {/* Topo pattern background */}
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
              <TopoPattern
                width={cardWidth}
                height={420}
                variant="full"
                lines={6}
                opacity={isDark ? 0.08 : 0.06}
                strokeWidth={1.5}
                color={colors.contourInk}
                seed={`onboarding-${slide.id}`}
              />
            </View>

            {/* Accent gradient at top */}
            <View 
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 120,
                backgroundColor: colors.primary,
                opacity: isDark ? 0.12 : 0.08,
              }}
            />

            <View style={{ padding: 24, paddingTop: 32 }}>
              {/* Slide indicator dots */}
              <View 
                style={{
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 8,
                  marginBottom: 24,
                }}
              >
                {SLIDES.map((_, index) => (
                  <View
                    key={index}
                    style={{
                      width: index === currentSlide ? 24 : 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: index === currentSlide 
                        ? colors.primary 
                        : `${colors.foreground}20`,
                    }}
                  />
                ))}
              </View>

              {/* Icon */}
              <View 
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 20,
                  backgroundColor: `${colors.primary}20`,
                  alignItems: 'center',
                  justifyContent: 'center',
                  alignSelf: 'center',
                  marginBottom: 20,
                }}
              >
                <Icon size={36} color={colors.primary} />
              </View>

              {/* Title */}
              <Text 
                style={{ 
                  color: colors.foreground,
                  fontSize: 22,
                  fontWeight: '700',
                  textAlign: 'center',
                  marginBottom: 12,
                }}
              >
                {slide.title}
              </Text>

              {/* Description */}
              <Text 
                style={{ 
                  color: colors.mutedForeground,
                  fontSize: 15,
                  textAlign: 'center',
                  lineHeight: 22,
                  marginBottom: 16,
                  minHeight: 88,
                }}
              >
                {getDescription(slide.id)}
              </Text>

              {/* Highlight box */}
              {slide.highlight && (
                <View 
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    borderRadius: 12,
                    backgroundColor: `${colors.secondary}15`,
                    borderWidth: 1,
                    borderColor: `${colors.secondary}30`,
                    marginBottom: 24,
                  }}
                >
                  <Sparkles size={16} color={colors.secondary} />
                  <Text 
                    style={{ 
                      color: colors.secondary,
                      fontSize: 13,
                      fontWeight: '500',
                      flex: 1,
                    }}
                  >
                    {slide.highlight}
                  </Text>
                </View>
              )}

              {/* Navigation buttons */}
              <View style={{ flexDirection: 'row', gap: 12 }}>
                {currentSlide > 0 && (
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      paddingVertical: 14,
                      paddingHorizontal: 20,
                      borderRadius: 12,
                      backgroundColor: `${colors.foreground}10`,
                    }}
                    onPress={handlePrev}
                    activeOpacity={0.7}
                  >
                    <ChevronLeft size={18} color={colors.foreground} />
                    <Text style={{ color: colors.foreground, fontWeight: '600', fontSize: 15 }}>
                      Back
                    </Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity
                  style={{
                    flex: currentSlide > 0 ? 1 : undefined,
                    width: currentSlide === 0 ? '100%' : undefined,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    paddingVertical: 14,
                    paddingHorizontal: 20,
                    borderRadius: 12,
                    backgroundColor: colors.primary,
                  }}
                  onPress={handleNext}
                  activeOpacity={0.8}
                >
                  <Text style={{ color: 'white', fontWeight: '600', fontSize: 15 }}>
                    {isLastSlide ? "Let's Go!" : 'Next'}
                  </Text>
                  {isLastSlide ? (
                    <Check size={18} color="white" />
                  ) : (
                    <ChevronRight size={18} color="white" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Mountain ridge at bottom */}
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, pointerEvents: 'none' }}>
              <MountainRidge
                width={cardWidth}
                height={40}
                opacity={isDark ? 0.1 : 0.08}
                variant="jagged"
                layers={2}
              />
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default OnboardingModal;

