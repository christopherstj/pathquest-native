import React from 'react';
import { Pressable, StyleProp, View, ViewStyle } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Text } from './Text';
import { useTheme } from '@/src/theme';

export interface PrimaryCTAProps {
  label: string;
  onPress: () => void;
  Icon?: LucideIcon;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Custom background color. Defaults to primary */
  backgroundColor?: string;
  /** Custom foreground color (text/icon). Defaults to primaryForeground */
  foregroundColor?: string;
}

const PrimaryCTA: React.FC<PrimaryCTAProps> = ({
  label,
  onPress,
  Icon,
  disabled,
  style,
  backgroundColor,
  foregroundColor,
}) => {
  const { colors, isDark } = useTheme();
  const bgColor = backgroundColor || colors.primary;
  const textColor = foregroundColor || colors.primaryForeground;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        {
          borderRadius: 10,
          overflow: 'hidden',
          minHeight: 44,
          shadowColor: bgColor,
          shadowOffset: { width: 0, height: pressed ? 2 : 8 },
          shadowOpacity: pressed ? 0.18 : 0.35,
          shadowRadius: pressed ? 6 : 14,
          elevation: pressed ? 3 : 8,
          transform: [{ translateY: pressed ? 1 : 0 }],
          opacity: disabled ? 0.55 : 1,
        },
        style,
      ]}
    >
      {/* Background layer - explicit View to ensure it renders */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: bgColor,
          borderRadius: 10,
        }}
        pointerEvents="none"
      />

      {/* Subtle top highlight */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.2)',
        }}
      />

      {/* Content with explicit padding */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          paddingVertical: 12,
          paddingHorizontal: 16,
        }}
      >
        {Icon ? <Icon size={16} color={textColor} /> : null}
        <Text style={{ color: textColor }} className="text-sm font-bold">
          {label}
        </Text>
      </View>
    </Pressable>
  );
};

export default PrimaryCTA;
