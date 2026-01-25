import React from "react";
import { View, TouchableOpacity, StyleProp, ViewStyle } from "react-native";
import { Text } from "@/src/components/ui";
import { useTheme } from "@/src/theme";

export type TabSwitcherTab<TTabId extends string> = {
  id: TTabId;
  label: string;
  badge?: string | number;
  disabled?: boolean;
};

export type TabSwitcherProps<TTabId extends string> = {
  tabs: TabSwitcherTab<TTabId>[];
  activeTab: TTabId;
  onTabChange: (tab: TTabId) => void;
  style?: StyleProp<ViewStyle>;
};

export function TabSwitcher<TTabId extends string>({ tabs, activeTab, onTabChange, style }: TabSwitcherProps<TTabId>) {
  const { colors } = useTheme();
  
  return (
    <View className="flex-row p-1 rounded-xl bg-muted gap-1" style={style}>
      {tabs.map((t) => {
        const isActive = t.id === activeTab;
        const label = t.badge !== undefined ? `${t.label} (${t.badge})` : t.label;
        return (
          <TouchableOpacity
            key={t.id}
            className="flex-1 items-center justify-center py-2.5 px-3 rounded-lg"
            style={isActive ? {
              backgroundColor: colors.background,
              // Subtle primary accent border
              borderWidth: 1,
              borderColor: `${colors.primary}30`,
            } : undefined}
            onPress={() => onTabChange(t.id)}
            activeOpacity={0.7}
            disabled={t.disabled}
          >
            <Text
              className={`text-[13px] font-semibold ${t.disabled ? "opacity-50" : ""}`}
              style={{ 
                // Active tab uses primary color for pop
                color: isActive ? colors.primary : colors.mutedForeground 
              }}
              numberOfLines={1}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}


