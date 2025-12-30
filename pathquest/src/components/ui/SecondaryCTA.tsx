import React from 'react';
import { Pressable, StyleProp, View, ViewStyle } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Text } from './Text';
import { useTheme } from '@/src/theme';

export interface SecondaryCTAProps {
  label: string;
  onPress: () => void;
  Icon?: LucideIcon;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

const SecondaryCTA: React.FC<SecondaryCTAProps> = ({ label, onPress, Icon, disabled, style }) => {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        {
          borderRadius: 10,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: colors.border as any,
          backgroundColor: pressed ? (colors.muted as any) : 'transparent',
          minHeight: 44,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: pressed ? 1 : 3 },
          shadowOpacity: pressed ? 0.06 : 0.1,
          shadowRadius: pressed ? 4 : 8,
          elevation: pressed ? 2 : 4,
          transform: [{ translateY: pressed ? 1 : 0 }],
          opacity: disabled ? 0.55 : 1,
        },
        style,
      ]}
    >
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
        {Icon ? <Icon size={16} color={colors.mutedForeground} /> : null}
        <Text style={{ color: colors.mutedForeground }} className="text-sm font-semibold">
          {label}
        </Text>
      </View>
    </Pressable>
  );
};

export default SecondaryCTA;
