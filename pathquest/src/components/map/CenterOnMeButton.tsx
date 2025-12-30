/**
 * CenterOnMeButton
 * 
 * Floating action button that centers the map on the user's current location.
 * Positioned in the bottom-right corner above the content sheet.
 */

import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Navigation } from 'lucide-react-native';
import Animated, { 
  useAnimatedStyle, 
  withSpring,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

interface CenterOnMeButtonProps {
  /** Callback when button is pressed */
  onPress: () => void;
  /** Whether the button is visible */
  visible?: boolean;
  /** Additional style for positioning */
  style?: ViewStyle;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const CenterOnMeButton: React.FC<CenterOnMeButtonProps> = ({
  onPress,
  visible = true,
  style,
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(visible ? 1 : 0);

  // Animate visibility
  React.useEffect(() => {
    opacity.value = withTiming(visible ? 1 : 0, { duration: 200 });
  }, [visible, opacity]);

  // Handle press with animation
  const handlePress = () => {
    // Pulse animation
    scale.value = withSequence(
      withSpring(0.9, { damping: 10 }),
      withSpring(1, { damping: 10 })
    );
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <AnimatedTouchable
      style={[styles.button, animatedStyle, style]}
      onPress={handlePress}
      activeOpacity={0.8}
      accessibilityLabel="Center on my location"
      accessibilityRole="button"
    >
      <Navigation size={20} color="#EDE5D8" />
    </AnimatedTouchable>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(45, 40, 35, 0.92)', // bg-card equivalent
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(169, 161, 150, 0.2)', // border-border equivalent
  },
});

export default CenterOnMeButton;

