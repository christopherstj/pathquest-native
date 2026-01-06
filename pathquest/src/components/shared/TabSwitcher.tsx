import React from "react";
import { View, TouchableOpacity, StyleProp, ViewStyle } from "react-native";
import { Text } from "@/src/components/ui";

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
  return (
    <View className="flex-row p-1 rounded-lg bg-muted gap-1" style={style}>
      {tabs.map((t) => {
        const isActive = t.id === activeTab;
        const label = t.badge !== undefined ? `${t.label} (${t.badge})` : t.label;
        return (
          <TouchableOpacity
            key={t.id}
            className={`flex-1 items-center justify-center py-2 px-3 rounded-lg ${isActive ? "bg-background" : ""}`}
            onPress={() => onTabChange(t.id)}
            activeOpacity={0.7}
            disabled={t.disabled}
          >
            <Text
              className={`text-[13px] font-medium ${
                isActive ? "text-foreground" : "text-muted-foreground"
              } ${t.disabled ? "opacity-50" : ""}`}
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


