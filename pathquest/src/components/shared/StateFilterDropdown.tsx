/**
 * StateFilterDropdown
 * 
 * A pill-style dropdown for filtering by state.
 * Uses a modal bottom sheet on press for state selection.
 */

import React, { useState } from 'react';
import { View, TouchableOpacity, Modal, ScrollView, Pressable } from 'react-native';
import { ChevronDown, Check, X, MapPin } from 'lucide-react-native';
import { Text } from '@/src/components/ui';
import { useTheme } from '@/src/theme';

interface StateFilterDropdownProps {
  states: string[];
  selectedState: string;
  onStateChange: (state: string) => void;
  isLoading?: boolean;
  accentColor?: string;
}

export function StateFilterDropdown({
  states,
  selectedState,
  onStateChange,
  isLoading = false,
  accentColor,
}: StateFilterDropdownProps) {
  const { colors, isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  
  const accent = accentColor ?? colors.primary;
  const isFiltered = selectedState !== '';

  return (
    <>
      <TouchableOpacity
        onPress={() => setIsOpen(true)}
        disabled={isLoading || states.length === 0}
        activeOpacity={0.7}
        className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full border"
        style={{
          backgroundColor: isFiltered ? `${accent}15` : 'transparent',
          borderColor: isFiltered ? `${accent}50` : colors.border,
          opacity: isLoading ? 0.5 : 1,
        }}
      >
        <MapPin size={12} color={isFiltered ? accent : colors.mutedForeground} />
        <Text
          className="text-xs font-medium"
          style={{ color: isFiltered ? accent : colors.mutedForeground }}
        >
          {selectedState || 'All States'}
        </Text>
        <ChevronDown size={12} color={isFiltered ? accent : colors.mutedForeground} />
      </TouchableOpacity>

      {/* State Selection Modal */}
      <Modal
        visible={isOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable 
          className="flex-1 justify-end"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onPress={() => setIsOpen(false)}
        >
          <Pressable 
            className="rounded-t-2xl max-h-[70%]"
            style={{ backgroundColor: colors.card }}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <View 
              className="flex-row items-center justify-between px-4 py-3 border-b"
              style={{ borderColor: colors.border }}
            >
              <Text className="text-base font-semibold" style={{ color: colors.foreground }}>
                Filter by State
              </Text>
              <TouchableOpacity
                onPress={() => setIsOpen(false)}
                className="p-1"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={20} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            {/* Options */}
            <ScrollView className="max-h-[400px]">
              {/* All States option */}
              <TouchableOpacity
                onPress={() => {
                  onStateChange('');
                  setIsOpen(false);
                }}
                className="flex-row items-center justify-between px-4 py-3 border-b"
                style={{ borderColor: colors.border }}
                activeOpacity={0.7}
              >
                <Text 
                  className="text-sm"
                  style={{ 
                    color: selectedState === '' ? accent : colors.foreground,
                    fontWeight: selectedState === '' ? '600' : '400',
                  }}
                >
                  All States
                </Text>
                {selectedState === '' && (
                  <Check size={16} color={accent} />
                )}
              </TouchableOpacity>

              {/* State options */}
              {states.map((state) => (
                <TouchableOpacity
                  key={state}
                  onPress={() => {
                    onStateChange(state);
                    setIsOpen(false);
                  }}
                  className="flex-row items-center justify-between px-4 py-3 border-b"
                  style={{ borderColor: colors.border }}
                  activeOpacity={0.7}
                >
                  <Text 
                    className="text-sm"
                    style={{ 
                      color: selectedState === state ? accent : colors.foreground,
                      fontWeight: selectedState === state ? '600' : '400',
                    }}
                  >
                    {state}
                  </Text>
                  {selectedState === state && (
                    <Check size={16} color={accent} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Safe area padding */}
            <View className="h-8" />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

