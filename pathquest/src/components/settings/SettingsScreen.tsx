/**
 * Settings Screen
 * 
 * User settings page with account info, preferences, privacy settings,
 * and account management (sign out, delete account).
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import {
  X,
  ChevronRight,
  User,
  Settings2,
  Shield,
  Info,
  LogOut,
  Trash2,
  Link as LinkIcon,
  MapPin,
  Bell,
} from 'lucide-react-native';

import { Text, CardFrame } from '@/src/components/ui';
import { UserAvatar } from '@/src/components/shared';
import { useTheme } from '@/src/theme';
import { useAuthStore } from '@/src/lib/auth';
import { endpoints } from '@pathquest/shared/api';
import { formatLocationString } from '@/src/utils';

// Lazy import to avoid circular dependency issues
const getApiClientLazy = () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { getApiClient } = require('@/src/lib/api/client');
  return getApiClient();
};

// Strava brand color
const STRAVA_ORANGE = '#FC4C02';

// Privacy Policy and Terms URLs
const PRIVACY_POLICY_URL = 'https://pathquest.app/privacy';
const TERMS_OF_SERVICE_URL = 'https://pathquest.app/terms';

interface SettingRowProps {
  label: string;
  value?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  showChevron?: boolean;
}

function SettingRow({ label, value, onPress, rightElement, showChevron = false }: SettingRowProps) {
  const { colors } = useTheme();
  
  const content = (
    <View className="flex-row items-center justify-between py-3.5 px-4">
      <Text className="text-base" style={{ color: colors.foreground }}>
        {label}
      </Text>
      <View className="flex-row items-center gap-2">
        {value && (
          <Text className="text-sm" style={{ color: colors.mutedForeground }}>
            {value}
          </Text>
        )}
        {rightElement}
        {showChevron && (
          <ChevronRight size={18} color={colors.mutedForeground as string} />
        )}
      </View>
    </View>
  );
  
  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }
  
  return content;
}

interface SettingSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function SettingSection({ title, icon, children }: SettingSectionProps) {
  const { colors } = useTheme();
  
  return (
    <View className="mb-6">
      <View className="flex-row items-center gap-2 px-4 mb-2">
        {icon}
        <Text 
          className="text-xs uppercase tracking-wider font-semibold"
          style={{ color: colors.mutedForeground }}
        >
          {title}
        </Text>
      </View>
      <CardFrame variant="default" seed={`settings-${title}`}>
        {children}
      </CardFrame>
    </View>
  );
}

function SettingDivider() {
  const { colors } = useTheme();
  return (
    <View 
      className="mx-4" 
      style={{ height: 1, backgroundColor: colors.border as string }} 
    />
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const updateUserStore = useAuthStore((state) => state.updateUser);
  
  // Local state for settings (initialized from user, synced with API)
  const [units, setUnits] = useState<'imperial' | 'metric'>(user?.units ?? 'imperial');
  const [updateStravaDescriptions, setUpdateStravaDescriptions] = useState(user?.updateDescription ?? true);
  const [isPublicProfile, setIsPublicProfile] = useState(user?.isPublic ?? true);
  const [summitNotificationsEnabled, setSummitNotificationsEnabled] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoadingNotificationPrefs, setIsLoadingNotificationPrefs] = useState(true);

  // Load notification preferences on mount
  React.useEffect(() => {
    async function loadNotificationPrefs() {
      if (!user?.id) return;
      try {
        const client = getApiClientLazy();
        // Use fetchJson - the shared API client doesn't have .get()
        const data = await client.fetchJson<{ summitNotificationsEnabled?: boolean }>('/push-tokens/preferences');
        setSummitNotificationsEnabled(data?.summitNotificationsEnabled ?? true);
      } catch (error) {
        console.error('Failed to load notification preferences:', error);
      } finally {
        setIsLoadingNotificationPrefs(false);
      }
    }
    loadNotificationPrefs();
  }, [user?.id]);
  
  const appVersion = Constants.expoConfig?.version ?? '1.0.0';
  
  const handleClose = useCallback(() => {
    router.back();
  }, [router]);
  
  const handleUpdateSetting = useCallback(async (
    key: string, 
    value: boolean | string
  ) => {
    if (!user?.id) return;
    
    setIsSaving(true);
    try {
      const client = getApiClientLazy();
      await endpoints.updateUser(client, user.id, { [key]: value });
    } catch (error) {
      console.error('Failed to update setting:', error);
      Alert.alert('Error', 'Failed to save setting. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [user?.id]);
  
  const handleUnitsChange = useCallback((newUnits: 'imperial' | 'metric') => {
    setUnits(newUnits);
    updateUserStore({ units: newUnits });
    handleUpdateSetting('units', newUnits);
  }, [handleUpdateSetting, updateUserStore]);
  
  const handleStravaDescriptionsChange = useCallback((enabled: boolean) => {
    setUpdateStravaDescriptions(enabled);
    updateUserStore({ updateDescription: enabled });
    handleUpdateSetting('update_description', enabled);
  }, [handleUpdateSetting, updateUserStore]);
  
  const handlePublicProfileChange = useCallback((isPublic: boolean) => {
    setIsPublicProfile(isPublic);
    updateUserStore({ isPublic });
    handleUpdateSetting('is_public', isPublic);
  }, [handleUpdateSetting, updateUserStore]);

  const handleSummitNotificationsChange = useCallback(async (enabled: boolean) => {
    setSummitNotificationsEnabled(enabled);
    try {
      const client = getApiClientLazy();
      // Use fetchJson with PUT method - the shared API client doesn't have .put()
      await client.fetchJson('/push-tokens/preferences', {
        method: 'PUT',
        json: { summitNotificationsEnabled: enabled },
      });
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
      Alert.alert('Error', 'Failed to save notification preference. Please try again.');
      // Revert on error
      setSummitNotificationsEnabled(!enabled);
    }
  }, []);
  
  const handleSignOut = useCallback(async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(tabs)/explore');
          },
        },
      ]
    );
  }, [logout, router]);
  
  const handleDeleteAccount = useCallback(async () => {
    Alert.alert(
      'Delete Account',
      'Are you sure? This will permanently delete all your data including summits, trip reports, and challenge progress. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: async () => {
            if (!user?.id) return;
            
            setIsDeleting(true);
            try {
              const client = getApiClientLazy();
              await endpoints.deleteUser(client, user.id);
              
              await logout();
              router.replace('/(tabs)/explore');
            } catch (error) {
              console.error('Failed to delete account:', error);
              Alert.alert('Error', 'Failed to delete account. Please try again.');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  }, [user?.id, logout, router]);
  
  const handleOpenLink = useCallback((url: string) => {
    Linking.openURL(url).catch((err) => {
      console.error('Failed to open URL:', err);
    });
  }, []);
  
  return (
    <View 
      className="flex-1"
      style={{ 
        backgroundColor: colors.background,
        paddingTop: insets.top,
      }}
    >
      {/* Header */}
      <View 
        className="flex-row items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: colors.border }}
      >
        <TouchableOpacity 
          onPress={handleClose}
          className="p-2 -ml-2"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X size={24} color={colors.foreground as string} />
        </TouchableOpacity>
        <Text className="text-lg font-semibold" style={{ color: colors.foreground }}>
          Settings
        </Text>
        <View style={{ width: 40 }} />
      </View>
      
      <ScrollView 
        className="flex-1 px-4 pt-6"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      >
        {/* Account Section */}
        <SettingSection 
          title="Account" 
          icon={<User size={14} color={colors.mutedForeground as string} />}
        >
          <View className="flex-row items-center gap-3 p-4">
            <UserAvatar size="lg" name={user?.name} uri={user?.pic} />
            <View className="flex-1">
              <Text className="text-base font-semibold" style={{ color: colors.foreground }}>
                {user?.name ?? 'Unknown'}
              </Text>
              {user?.email && (
                <Text className="text-sm mt-0.5" style={{ color: colors.mutedForeground }}>
                  {user.email}
                </Text>
              )}
              <View className="flex-row items-center gap-1.5 mt-1.5">
                <LinkIcon size={12} color={STRAVA_ORANGE} />
                <Text className="text-xs" style={{ color: STRAVA_ORANGE }}>
                  Connected via Strava
                </Text>
              </View>
            </View>
          </View>
          <SettingDivider />
          <SettingRow
            label="Location"
            value={
              user?.city || user?.state || user?.country
                ? formatLocationString(user)
                : undefined
            }
            onPress={() => router.push('/settings/location')}
            showChevron
            rightElement={
              <MapPin size={16} color={colors.mutedForeground as string} />
            }
          />
        </SettingSection>
        
        {/* Preferences Section */}
        <SettingSection 
          title="Preferences" 
          icon={<Settings2 size={14} color={colors.mutedForeground as string} />}
        >
          <SettingRow 
            label="Units"
            rightElement={
              <View className="flex-row rounded-lg overflow-hidden" style={{ borderWidth: 1, borderColor: colors.border }}>
                <TouchableOpacity
                  className="px-3 py-1.5"
                  style={{ 
                    backgroundColor: units === 'imperial' ? colors.primary : 'transparent',
                  }}
                  onPress={() => handleUnitsChange('imperial')}
                >
                  <Text 
                    className="text-sm font-medium"
                    style={{ 
                      color: units === 'imperial' ? colors.primaryForeground : colors.mutedForeground,
                    }}
                  >
                    ft
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="px-3 py-1.5"
                  style={{ 
                    backgroundColor: units === 'metric' ? colors.primary : 'transparent',
                    borderLeftWidth: 1,
                    borderLeftColor: colors.border,
                  }}
                  onPress={() => handleUnitsChange('metric')}
                >
                  <Text 
                    className="text-sm font-medium"
                    style={{ 
                      color: units === 'metric' ? colors.primaryForeground : colors.mutedForeground,
                    }}
                  >
                    m
                  </Text>
                </TouchableOpacity>
              </View>
            }
          />
        </SettingSection>
        
        {/* Notifications Section */}
        <SettingSection 
          title="Notifications" 
          icon={<Bell size={14} color={colors.mutedForeground as string} />}
        >
          <SettingRow 
            label="Summit Notifications"
            rightElement={
              isLoadingNotificationPrefs ? (
                <ActivityIndicator size="small" color={colors.mutedForeground as string} />
              ) : (
                <Switch
                  value={summitNotificationsEnabled}
                  onValueChange={handleSummitNotificationsChange}
                  trackColor={{ 
                    false: colors.muted as string, 
                    true: colors.primary as string,
                  }}
                  thumbColor={colors.background as string}
                />
              )
            }
          />
          <View className="px-4 pb-3">
            <Text className="text-xs" style={{ color: colors.mutedForeground }}>
              Receive a notification when you log a new summit
            </Text>
          </View>
        </SettingSection>

        {/* Privacy Section */}
        <SettingSection 
          title="Privacy" 
          icon={<Shield size={14} color={colors.mutedForeground as string} />}
        >
          <SettingRow 
            label="Update Strava Descriptions"
            rightElement={
              <Switch
                value={updateStravaDescriptions}
                onValueChange={handleStravaDescriptionsChange}
                trackColor={{ 
                  false: colors.muted as string, 
                  true: colors.primary as string,
                }}
                thumbColor={colors.background as string}
              />
            }
          />
          <SettingDivider />
          <SettingRow 
            label="Public Profile"
            rightElement={
              <Switch
                value={isPublicProfile}
                onValueChange={handlePublicProfileChange}
                trackColor={{ 
                  false: colors.muted as string, 
                  true: colors.primary as string,
                }}
                thumbColor={colors.background as string}
              />
            }
          />
        </SettingSection>
        
        {/* About Section */}
        <SettingSection 
          title="About" 
          icon={<Info size={14} color={colors.mutedForeground as string} />}
        >
          <SettingRow 
            label="Version"
            value={appVersion}
          />
          <SettingDivider />
          <SettingRow 
            label="Privacy Policy"
            onPress={() => handleOpenLink(PRIVACY_POLICY_URL)}
            showChevron
          />
          <SettingDivider />
          <SettingRow 
            label="Terms of Service"
            onPress={() => handleOpenLink(TERMS_OF_SERVICE_URL)}
            showChevron
          />
        </SettingSection>
        
        {/* Sign Out Button */}
        <TouchableOpacity
          className="flex-row items-center justify-center gap-2 py-3.5 rounded-xl mb-6"
          style={{ 
            backgroundColor: colors.muted,
            borderWidth: 1,
            borderColor: colors.border,
          }}
          onPress={handleSignOut}
          activeOpacity={0.7}
        >
          <LogOut size={18} color={colors.foreground as string} />
          <Text className="text-base font-medium" style={{ color: colors.foreground }}>
            Sign Out
          </Text>
        </TouchableOpacity>
        
        {/* Danger Zone */}
        <View className="mb-6">
          <View className="flex-row items-center gap-2 px-4 mb-2">
            <Trash2 size={14} color={colors.destructive as string} />
            <Text 
              className="text-xs uppercase tracking-wider font-semibold"
              style={{ color: colors.destructive }}
            >
              Danger Zone
            </Text>
          </View>
          <TouchableOpacity
            className="flex-row items-center justify-center gap-2 py-3.5 rounded-xl"
            style={{ 
              backgroundColor: 'transparent',
              borderWidth: 1,
              borderColor: colors.destructive,
            }}
            onPress={handleDeleteAccount}
            activeOpacity={0.7}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color={colors.destructive as string} />
            ) : (
              <>
                <Trash2 size={18} color={colors.destructive as string} />
                <Text className="text-base font-medium" style={{ color: colors.destructive }}>
                  Delete Account
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
        
        {/* Saving indicator */}
        {isSaving && (
          <View className="flex-row items-center justify-center gap-2 py-2">
            <ActivityIndicator size="small" color={colors.mutedForeground as string} />
            <Text className="text-sm" style={{ color: colors.mutedForeground }}>
              Saving...
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

