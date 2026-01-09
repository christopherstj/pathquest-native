/**
 * Profile Tab Route
 * 
 * Full-screen profile with stats, peaks, journal, and challenges.
 * Shows an engaging preview for unauthenticated users.
 */

import React, { useMemo } from 'react';
import { View, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFetching } from '@tanstack/react-query';
import { 
  Settings, 
  LogIn, 
  UserCircle, 
  MapPin, 
  Map, 
  Plus, 
  Mountain, 
  Trophy, 
  Calendar, 
  TrendingUp,
  FileText,
  Star,
} from 'lucide-react-native';
import { ProfileContent } from '@/src/components/profile';
import { RefreshBar } from '@/src/components/shared';
import { Text, CardFrame, TopoPattern } from '@/src/components/ui';
import { UserAvatar } from "@/src/components/shared";
import { useAuthStore } from '@/src/lib/auth';
import { startStravaAuth } from '@/src/lib/auth/strava';
import { useManualSummitStore } from '@/src/store';
import type { Peak, ChallengeProgress } from '@pathquest/shared';

const BACKGROUND_COLOR = '#25221E';

export default function ProfileRoute() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  
  // Hooks must be called unconditionally (before any early returns)
  const isFetchingProfile = useIsFetching({ queryKey: ['userProfile'] }) > 0;
  const isFetchingPeaks = useIsFetching({ queryKey: ['userPeaks'] }) > 0;
  const isFetchingJournal = useIsFetching({ queryKey: ['userJournal'] }) > 0;
  const isRefreshing = isFetchingProfile || isFetchingPeaks || isFetchingJournal;
  
  const locationText = useMemo(() => {
    const parts = [user?.city, user?.state, user?.country].filter(Boolean);
    return parts.join(", ");
  }, [user?.city, user?.state, user?.country]);
  
  const handleLogin = async () => {
    await startStravaAuth();
  };
  
  const handleOpenSettings = () => {
    router.push('/settings');
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
  
  const handleViewOnMap = () => {
    if (!user?.id) return;
    router.push({
      pathname: '/explore/users/[userId]',
      params: { userId: user.id },
    });
  };
  
  const openManualSummit = useManualSummitStore((s) => s.openManualSummit);
  
  const handleLogManualSummit = () => {
    // Open modal without pre-selected peak - user will search
    openManualSummit();
  };
  
  // Not authenticated - show engaging preview
  if (!isAuthenticated) {
    return (
      <View 
        style={{ 
          flex: 1,
          backgroundColor: BACKGROUND_COLOR,
          paddingTop: insets.top, 
        }}
      >
        {/* Topo pattern background */}
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
          <TopoPattern
            width={400}
            height={800}
            variant="full"
            lines={12}
            opacity={0.06}
            strokeWidth={1.25}
            color="#5B9167"
            seed="profile-guest-backdrop"
          />
        </View>

        <ScrollView 
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero section */}
          <CardFrame topo="full" seed="profile-guest-hero" style={{ padding: 20, marginBottom: 16 }}>
            {/* Accent wash */}
            <View 
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 100,
                backgroundColor: '#5B9167',
                opacity: 0.08,
              }}
            />
            
            <View style={{ alignItems: 'center' }}>
              <View 
                style={{ 
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12,
                  backgroundColor: 'rgba(91, 145, 103, 0.15)',
                  borderWidth: 2,
                  borderColor: 'rgba(91, 145, 103, 0.3)',
                }}
              >
                <UserCircle size={40} color="#5B9167" strokeWidth={1.5} />
              </View>
              
              <Text 
                className="text-xl font-bold text-center mb-1"
                style={{ color: '#F5F0E8' }}
              >
                Your Summit Journal
              </Text>
              
              <Text 
                className="text-center text-sm leading-5 mb-4"
                style={{ color: '#A9A196' }}
              >
                Track your adventures and build your peak collection
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
                  Connect with Strava
                </Text>
              </TouchableOpacity>
            </View>
          </CardFrame>

          {/* Preview: Stats you could track */}
          <Text 
            className="text-xs font-semibold tracking-wide mb-3 px-1"
            style={{ color: '#A9A196' }}
          >
            WHAT YOU'LL TRACK
          </Text>
          
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
            <CardFrame topo="none" seed="preview-stat-1" style={{ flex: 1, padding: 14, alignItems: 'center' }}>
              <Mountain size={20} color="#5B9167" />
              <Text className="text-2xl font-bold mt-2" style={{ color: '#F5F0E8' }}>—</Text>
              <Text className="text-xs mt-1" style={{ color: '#A9A196' }}>Peaks</Text>
            </CardFrame>
            
            <CardFrame topo="none" seed="preview-stat-2" style={{ flex: 1, padding: 14, alignItems: 'center' }}>
              <TrendingUp size={20} color="#5B9167" />
              <Text className="text-2xl font-bold mt-2" style={{ color: '#F5F0E8' }}>—</Text>
              <Text className="text-xs mt-1" style={{ color: '#A9A196' }}>Elevation</Text>
            </CardFrame>
            
            <CardFrame topo="none" seed="preview-stat-3" style={{ flex: 1, padding: 14, alignItems: 'center' }}>
              <Trophy size={20} color="#C8A45C" />
              <Text className="text-2xl font-bold mt-2" style={{ color: '#F5F0E8' }}>—</Text>
              <Text className="text-xs mt-1" style={{ color: '#A9A196' }}>Challenges</Text>
            </CardFrame>
          </View>

          {/* Preview: Sample journal entry */}
          <Text 
            className="text-xs font-semibold tracking-wide mb-3 px-1"
            style={{ color: '#A9A196' }}
          >
            YOUR SUMMIT JOURNAL
          </Text>
          
          <CardFrame topo="corner" seed="preview-journal" style={{ padding: 14, marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
              <View 
                style={{ 
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(91, 145, 103, 0.15)',
                  borderWidth: 1,
                  borderColor: 'rgba(91, 145, 103, 0.3)',
                }}
              >
                <FileText size={18} color="#5B9167" />
              </View>
              <View style={{ flex: 1 }}>
                <Text className="font-medium" style={{ color: '#F5F0E8' }}>
                  Your trip reports will appear here
                </Text>
                <Text className="text-xs mt-1" style={{ color: '#A9A196' }}>
                  Add notes, photos, conditions, and ratings to remember your adventures
                </Text>
              </View>
            </View>
            
            {/* Sample entry preview */}
            <View 
              style={{ 
                marginTop: 12,
                padding: 12,
                borderRadius: 10,
                backgroundColor: 'rgba(91, 145, 103, 0.08)',
                borderWidth: 1,
                borderColor: 'rgba(91, 145, 103, 0.15)',
                borderStyle: 'dashed',
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Mountain size={14} color="#5B9167" />
                  <Text className="font-medium text-sm" style={{ color: '#5B9167' }}>
                    Example Peak
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} size={10} color="#C8A45C" fill="#C8A45C" />
                  ))}
                </View>
              </View>
              <Text className="text-xs mt-2" style={{ color: '#A9A196' }}>
                "Amazing views from the summit! Clear skies and perfect conditions..."
              </Text>
            </View>
          </CardFrame>

          {/* Features list */}
          <Text 
            className="text-xs font-semibold tracking-wide mb-3 px-1"
            style={{ color: '#A9A196' }}
          >
            FEATURES
          </Text>
          
          <CardFrame topo="none" seed="preview-features" style={{ padding: 14 }}>
            <View style={{ gap: 12 }}>
              <FeatureRow 
                icon={<Mountain size={16} color="#5B9167" />}
                title="Auto-detect summits"
                description="Sync Strava activities and we'll find your peaks"
              />
              <FeatureRow 
                icon={<Trophy size={16} color="#C8A45C" />}
                title="Complete challenges"
                description="Track progress on peak lists like the 14ers"
              />
              <FeatureRow 
                icon={<Calendar size={16} color="#6B9DD4" />}
                title="Summit timeline"
                description="Browse your climbing history by date"
              />
              <FeatureRow 
                icon={<FileText size={16} color="#C87D55" />}
                title="Trip reports"
                description="Add notes, photos, and conditions"
              />
            </View>
          </CardFrame>

          {/* Bottom CTA */}
          <TouchableOpacity
            className="flex-row items-center justify-center gap-2 py-3.5 rounded-xl mt-4"
            style={{ 
              backgroundColor: 'rgba(91, 145, 103, 0.15)',
              borderWidth: 1,
              borderColor: 'rgba(91, 145, 103, 0.3)',
            }}
            onPress={handleLogin}
            activeOpacity={0.7}
          >
            <LogIn size={16} color="#5B9167" />
            <Text className="font-medium" style={{ color: '#5B9167' }}>
              Sign in to get started
            </Text>
          </TouchableOpacity>
        </ScrollView>
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
        className="flex-row items-start justify-between px-4 py-3 border-b"
        style={{ borderColor: 'rgba(69, 65, 60, 0.5)' }}
      >
        <View className="flex-row items-start gap-3 flex-1">
          <UserAvatar size="md" name={user?.name} uri={user?.pic} />
          <View className="flex-1">
            <Text className="font-semibold" style={{ color: '#F5F0E8' }}>
              {user?.name}
            </Text>
            {locationText ? (
              <View className="flex-row items-center gap-1.5 mt-0.5">
                <MapPin size={12} color="#A9A196" />
                <Text className="text-xs" style={{ color: '#A9A196' }} numberOfLines={1}>
                  {locationText}
                </Text>
              </View>
            ) : null}
            <TouchableOpacity 
              className="flex-row items-center gap-1.5 px-3 py-2 rounded-lg mt-2"
              style={{ 
                backgroundColor: 'rgba(91, 145, 103, 0.15)',
                borderWidth: 1,
                borderColor: 'rgba(91, 145, 103, 0.3)',
                alignSelf: 'flex-start',
              }}
              onPress={handleViewOnMap}
              activeOpacity={0.7}
            >
              <Map size={14} color="#5B9167" />
              <Text className="text-xs font-medium" style={{ color: '#5B9167' }}>
                View on Map
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity 
            className="p-2.5 rounded-lg"
            style={{ 
              backgroundColor: 'rgba(91, 145, 103, 0.15)',
              borderWidth: 1,
              borderColor: 'rgba(91, 145, 103, 0.3)',
            }}
            onPress={handleLogManualSummit}
            activeOpacity={0.7}
          >
            <Plus size={16} color="#5B9167" />
          </TouchableOpacity>
          <TouchableOpacity 
            className="p-2.5 rounded-lg"
            style={{ 
              backgroundColor: 'rgba(169, 161, 150, 0.1)',
              borderWidth: 1,
              borderColor: 'rgba(69, 65, 60, 0.5)',
            }}
            onPress={handleOpenSettings}
            activeOpacity={0.7}
          >
            <Settings size={16} color="#A9A196" />
          </TouchableOpacity>
        </View>
      </View>
      
      <ProfileContent 
        userId={user?.id || ''} 
        onPeakPress={handlePeakPress}
        onChallengePress={handleChallengePress}
      />
    </View>
  );
}

// Helper component for feature rows
function FeatureRow({ 
  icon, 
  title, 
  description 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
      <View 
        style={{ 
          width: 28,
          height: 28,
          borderRadius: 8,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(91, 145, 103, 0.1)',
        }}
      >
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text className="font-medium text-sm" style={{ color: '#F5F0E8' }}>
          {title}
        </Text>
        <Text className="text-xs mt-0.5" style={{ color: '#A9A196' }}>
          {description}
        </Text>
      </View>
    </View>
  );
}

