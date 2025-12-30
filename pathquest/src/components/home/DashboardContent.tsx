/**
 * DashboardContent
 * 
 * Main dashboard wrapper for the Home tab. Shows:
 * - Welcome header
 * - Quick stats bar
 * - Recent summits
 * - Favorite challenges with progress
 * 
 * Shows a login prompt when not authenticated.
 */

import React from 'react';
import { View, ScrollView, TouchableOpacity, Text } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useAuthStore } from '@/src/lib/auth';
import { startStravaAuth } from '@/src/lib/auth/strava';
import QuickStats from './QuickStats';
import RecentSummits from './RecentSummits';
import FavoriteChallenges from './FavoriteChallenges';

interface DashboardContentProps {
  onPeakPress?: (peakId: string) => void;
  onChallengePress?: (challengeId: string) => void;
}

const DashboardContent: React.FC<DashboardContentProps> = ({
  onPeakPress,
  onChallengePress,
}) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  const handleLogin = async () => {
    await startStravaAuth();
  };

  // Guest view
  if (!isAuthenticated) {
    return (
      <ScrollView 
        className="flex-1"
        contentContainerClassName="p-6 pt-10 items-center"
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome */}
        <View className="items-center mb-8">
          <View className="w-20 h-20 rounded-full bg-primary/15 items-center justify-center mb-4">
            <FontAwesome name="map" size={32} color="#5B9167" />
          </View>
          <Text className="text-foreground text-2xl font-bold text-center mb-2 font-display">
            Welcome to PathQuest
          </Text>
          <Text className="text-muted-foreground text-[15px] text-center leading-[22px] px-4">
            Track your mountain adventures, discover new peaks, and join climbing challenges.
          </Text>
        </View>

        {/* Login CTA */}
        <TouchableOpacity 
          className="flex-row items-center gap-2.5 bg-primary px-6 py-3.5 rounded-lg mb-10"
          onPress={handleLogin}
          activeOpacity={0.8}
        >
          <FontAwesome name="sign-in" size={18} color="#F5F2ED" />
          <Text className="text-primary-foreground text-base font-semibold">
            Connect with Strava
          </Text>
        </TouchableOpacity>

        {/* Features */}
        <View className="w-full gap-4">
          <FeatureItem 
            icon="flag" 
            title="Track Summits" 
            description="Automatically detect peaks from your activities"
          />
          <FeatureItem 
            icon="trophy" 
            title="Join Challenges" 
            description="Complete peak lists like the 14ers or ADK 46"
          />
          <FeatureItem 
            icon="map-marker" 
            title="Explore" 
            description="Discover new peaks and plan your next adventure"
          />
        </View>
      </ScrollView>
    );
  }

  // Authenticated view
  return (
    <ScrollView 
      className="flex-1"
      contentContainerClassName="p-4 pb-8 gap-4"
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View className="flex-row justify-between items-center mb-2">
        <View>
          <Text className="text-muted-foreground text-sm">
            Welcome back
          </Text>
          <Text className="text-foreground text-2xl font-bold font-display">
            {user?.name || 'Explorer'}
          </Text>
        </View>
        {user?.pic && (
          <View className="w-11 h-11 rounded-full bg-muted items-center justify-center">
            <FontAwesome name="user" size={20} color="#A9A196" />
          </View>
        )}
      </View>

      {/* Quick Stats */}
      <QuickStats 
        totalPeaks={0}
        totalElevation={0}
        summitsThisMonth={0}
        summitsLastMonth={0}
        isLoading={false}
      />

      {/* Recent Summits */}
      <View className="mt-2">
        <RecentSummits 
          summits={[]}
          onSummitPress={(summit) => onPeakPress?.(summit.peakId)}
          isLoading={false}
        />
      </View>

      {/* Favorite Challenges */}
      <View className="mt-2">
        <FavoriteChallenges 
          challenges={[]}
          onChallengePress={(challenge) => onChallengePress?.(challenge.id)}
          isLoading={false}
        />
      </View>
    </ScrollView>
  );
};

interface FeatureItemProps {
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  title: string;
  description: string;
}

const FeatureItem: React.FC<FeatureItemProps> = ({ icon, title, description }) => {
  return (
    <View className="flex-row items-start gap-3">
      <View className="w-10 h-10 rounded-lg bg-primary/15 items-center justify-center">
        <FontAwesome name={icon} size={16} color="#5B9167" />
      </View>
      <View className="flex-1">
        <Text className="text-foreground text-[15px] font-semibold mb-0.5">{title}</Text>
        <Text className="text-muted-foreground text-[13px] leading-[18px]">
          {description}
        </Text>
      </View>
    </View>
  );
};

export default DashboardContent;
