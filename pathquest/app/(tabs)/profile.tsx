/**
 * Profile Tab Route
 * 
 * Full-screen profile with stats, peaks, journal, and challenges.
 * Shows login prompt if not authenticated.
 */

import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFetching } from '@tanstack/react-query';
import { LogOut, LogIn, UserCircle } from 'lucide-react-native';
import { ProfileContent } from '@/src/components/profile';
import { RefreshBar } from '@/src/components/shared';
import { Text } from '@/src/components/ui';
import { useAuthStore } from '@/src/lib/auth';
import { startStravaAuth } from '@/src/lib/auth/strava';
import type { Peak, ChallengeProgress } from '@pathquest/shared';

const BACKGROUND_COLOR = '#25221E';

export default function ProfileRoute() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  
  // Hooks must be called unconditionally (before any early returns)
  const isFetchingProfile = useIsFetching({ queryKey: ['userProfile'] }) > 0;
  const isFetchingPeaks = useIsFetching({ queryKey: ['userPeaks'] }) > 0;
  const isFetchingJournal = useIsFetching({ queryKey: ['userJournal'] }) > 0;
  const isRefreshing = isFetchingProfile || isFetchingPeaks || isFetchingJournal;
  
  const handleLogin = async () => {
    await startStravaAuth();
  };
  
  const handleLogout = async () => {
    await logout();
  };
  
  const handlePeakPress = (peakId: string) => {
    router.push({
      pathname: '/explore/peak/[peakId]',
      params: { peakId },
    });
  };
  
  const handleChallengePress = (challengeId: string) => {
    router.push({
      pathname: '/explore/challenge/[challengeId]',
      params: { challengeId },
    });
  };
  
  // Not authenticated - show login prompt
  if (!isAuthenticated) {
    return (
      <View 
        style={{ 
          flex: 1,
          backgroundColor: BACKGROUND_COLOR,
          paddingTop: insets.top, 
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        {/* Decorative background */}
        <View 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 256,
            opacity: 0.2,
            backgroundColor: '#5B9167',
            borderBottomLeftRadius: 100,
            borderBottomRightRadius: 100,
          }}
        />
        
        <View 
          style={{ 
            width: 96,
            height: 96,
            borderRadius: 48,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
            backgroundColor: 'rgba(91, 145, 103, 0.15)',
            borderWidth: 2,
            borderColor: 'rgba(91, 145, 103, 0.3)',
          }}
        >
          <UserCircle size={48} color="#5B9167" strokeWidth={1.5} />
        </View>
        
        <Text 
          className="text-2xl font-bold text-center mb-2 font-display"
          style={{ color: '#F5F0E8' }}
        >
          Your Summit Journal
        </Text>
        
        <Text 
          className="text-center mb-6 leading-5"
          style={{ color: '#A9A196' }}
        >
          Sign in to track your peak conquests, earn achievements, and see your progress
        </Text>
        
        <TouchableOpacity
          className="flex-row items-center gap-2 px-6 py-3 rounded-xl"
          style={{ 
            backgroundColor: '#FC4C02',
            shadowColor: '#FC4C02',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 4,
          }}
          onPress={handleLogin}
          activeOpacity={0.8}
        >
          <LogIn size={18} color="white" />
          <Text className="text-white font-semibold">
            Continue with Strava
          </Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  // Authenticated - show profile
  return (
    <View 
      style={{ 
        flex: 1,
        backgroundColor: BACKGROUND_COLOR,
        paddingTop: insets.top,
      }}
    >
      <RefreshBar isRefreshing={isRefreshing} />
      {/* Header with user info */}
      <View 
        className="flex-row items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: 'rgba(69, 65, 60, 0.5)' }}
      >
        <View className="flex-row items-center gap-3">
          {user?.pic ? (
            <View 
              className="w-10 h-10 rounded-full overflow-hidden"
              style={{ borderWidth: 2, borderColor: '#5B9167' }}
            >
              {/* Profile picture would go here */}
              <View className="w-full h-full bg-muted" />
            </View>
          ) : (
            <View 
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: 'rgba(91, 145, 103, 0.2)' }}
            >
              <UserCircle size={24} color="#5B9167" />
            </View>
          )}
          <View>
            <Text className="font-semibold" style={{ color: '#F5F0E8' }}>
              {user?.name}
            </Text>
            <Text className="text-xs" style={{ color: '#A9A196' }}>
              View your summit journal
            </Text>
          </View>
        </View>
        
        <TouchableOpacity 
          className="p-2.5 rounded-lg"
          style={{ 
            backgroundColor: 'rgba(169, 161, 150, 0.1)',
            borderWidth: 1,
            borderColor: 'rgba(69, 65, 60, 0.5)',
          }}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <LogOut size={16} color="#A9A196" />
        </TouchableOpacity>
      </View>
      
      <ProfileContent 
        userId={user?.id || ''} 
        onPeakPress={handlePeakPress}
        onChallengePress={handleChallengePress}
      />
    </View>
  );
}

