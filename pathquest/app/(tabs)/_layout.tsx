/**
 * Tabs Layout
 *
 * Uses Expo Router's Tabs with custom styling and animated tab icons.
 * The map is kept in the explore layout so it persists across explore routes.
 *
 * Routes:
 * - / (index) → Home tab
 * - /explore/* → Explore tab (nested stack for discovery/peak/challenge)
 * - /profile → Profile tab
 */

import React, { useCallback, useEffect } from "react";
import { View } from "react-native";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Home, Compass, User } from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/src/theme";

// Spring config for snappy icon animation
const SPRING_CONFIG = {
  damping: 12,
  stiffness: 300,
  mass: 0.6,
};

interface AnimatedTabIconProps {
  Icon: LucideIcon;
  color: string;
  focused: boolean;
}

const AnimatedTabIcon: React.FC<AnimatedTabIconProps> = ({ Icon, color, focused }) => {
  const scale = useSharedValue(1);
  const prevFocused = React.useRef(focused);

  useEffect(() => {
    // Only animate when becoming focused (not on initial render)
    if (focused && !prevFocused.current) {
      // Bounce animation
      scale.value = withSpring(1.15, SPRING_CONFIG, () => {
        scale.value = withSpring(1, SPRING_CONFIG);
      });
      // Haptic feedback
      Haptics.selectionAsync().catch(() => {});
    }
    prevFocused.current = focused;
  }, [focused, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Icon size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
    </Animated.View>
  );
};

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 8,
          // Subtle shadow for depth
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: isDark ? 0.2 : 0.08,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "500",
          marginTop: 2,
          fontFamily: "Fraunces_500Medium",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon Icon={Home} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon Icon={Compass} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "You",
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon Icon={User} color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
