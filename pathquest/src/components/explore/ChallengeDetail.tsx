/**
 * ChallengeDetail
 * 
 * Shows detailed information about a challenge including:
 * - Header with name, region
 * - Progress bar and stats
 * - Sub-tabs: Progress, Peaks
 */

import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, Text } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import type { ChallengeProgress } from '@pathquest/shared';

type ChallengeDetailTab = 'progress' | 'peaks';

interface ChallengeDetailProps {
  challenge: ChallengeProgress;
  onClose?: () => void;
  onFavoriteToggle?: () => void;
  isFavorited?: boolean;
}

const ChallengeDetail: React.FC<ChallengeDetailProps> = ({
  challenge,
  onClose,
  onFavoriteToggle,
  isFavorited = false,
}) => {
  const [activeTab, setActiveTab] = useState<ChallengeDetailTab>('progress');

  // Calculate progress
  const progressPercent = challenge.total > 0 
    ? Math.round((challenge.completed / challenge.total) * 100) 
    : 0;
  const isCompleted = challenge.is_completed || progressPercent === 100;
  const remaining = challenge.total - challenge.completed;

  return (
    <View className="flex-1">
      {/* Header */}
      <View className="flex-row p-4 border-b border-border">
        <View className="flex-1">
          {/* Badge */}
          <View className="flex-row items-center gap-1 bg-muted px-2 py-1 rounded-xl self-start mb-2">
            <FontAwesome name="trophy" size={10} color="#A9A196" />
            <Text className="text-muted-foreground text-[10px] font-semibold tracking-wider">CHALLENGE</Text>
          </View>
          
          {/* Title */}
          <Text className="text-foreground text-[22px] font-bold mb-1 font-display" numberOfLines={2}>
            {challenge.name || 'Unknown Challenge'}
          </Text>
          
          {/* Region */}
          {challenge.region && (
            <Text className="text-muted-foreground text-sm">
              {challenge.region}
            </Text>
          )}
        </View>

        {/* Actions */}
        <View className="flex-row gap-2 ml-3">
          {onFavoriteToggle && (
            <TouchableOpacity 
              className="w-10 h-10 rounded-lg border border-border items-center justify-center"
              onPress={onFavoriteToggle}
              activeOpacity={0.7}
            >
              <FontAwesome 
                name={isFavorited ? 'heart' : 'heart-o'} 
                size={18} 
                color={isFavorited ? '#C44536' : '#A9A196'} 
              />
            </TouchableOpacity>
          )}
          {onClose && (
            <TouchableOpacity 
              className="w-10 h-10 rounded-lg border border-border items-center justify-center"
              onPress={onClose}
              activeOpacity={0.7}
            >
              <FontAwesome name="times" size={18} color="#A9A196" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Progress Section */}
      <View className="m-4 p-4 rounded-xl bg-card">
        {/* Progress Bar */}
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-foreground text-base font-semibold">
            {isCompleted ? 'Completed!' : `${progressPercent}% Complete`}
          </Text>
          <Text className="text-muted-foreground text-[13px]">
            {challenge.completed} / {challenge.total} peaks
          </Text>
        </View>
        
        <View className="h-2 rounded bg-muted overflow-hidden">
          <View 
            className={`h-full rounded ${isCompleted ? 'bg-summited' : 'bg-primary'}`}
            style={{ width: `${progressPercent}%` }}
          />
        </View>

        {/* Quick Stats */}
        <View className="flex-row flex-wrap gap-4 mt-3">
          {!isCompleted && remaining > 0 && (
            <View className="flex-row items-center gap-1.5">
              <FontAwesome name="flag" size={12} color="#A9A196" />
              <Text className="text-muted-foreground text-xs">
                {remaining} remaining
              </Text>
            </View>
          )}
          {challenge.lastProgressDate && (
            <View className="flex-row items-center gap-1.5">
              <FontAwesome name="calendar" size={12} color="#A9A196" />
              <Text className="text-muted-foreground text-xs">
                Last progress: {new Date(challenge.lastProgressDate).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Sub-tabs */}
      <View className="flex-row mx-4 mt-2 mb-3 p-1 rounded-lg bg-muted gap-1">
        <TouchableOpacity
          className={`flex-1 items-center justify-center py-2 px-3 rounded-lg ${
            activeTab === 'progress' ? 'bg-background' : ''
          }`}
          onPress={() => setActiveTab('progress')}
          activeOpacity={0.7}
        >
          <Text className={`text-[13px] font-medium ${
            activeTab === 'progress' ? 'text-foreground' : 'text-muted-foreground'
          }`}>
            Progress
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          className={`flex-1 items-center justify-center py-2 px-3 rounded-lg ${
            activeTab === 'peaks' ? 'bg-background' : ''
          }`}
          onPress={() => setActiveTab('peaks')}
          activeOpacity={0.7}
        >
          <Text className={`text-[13px] font-medium ${
            activeTab === 'peaks' ? 'text-foreground' : 'text-muted-foreground'
          }`}>
            Peaks ({challenge.total})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <ScrollView 
        className="flex-1"
        contentContainerClassName="p-4 pb-8"
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'progress' && (
          <View className="items-center justify-center p-8">
            <FontAwesome name="line-chart" size={24} color="#A9A196" />
            <Text className="text-muted-foreground text-sm mt-3 text-center">
              Progress details and next peak suggestions will appear here
            </Text>
          </View>
        )}
        
        {activeTab === 'peaks' && (
          <View className="items-center justify-center p-8">
            <FontAwesome name="list" size={24} color="#A9A196" />
            <Text className="text-muted-foreground text-sm mt-3 text-center">
              List of peaks in this challenge will appear here
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default ChallengeDetail;
