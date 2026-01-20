/**
 * GuestWelcomeHero
 * 
 * Engaging hero section for guest users with value proposition and CTA.
 * Shows the PathQuest brand and key benefits.
 */

import React, { useState, useCallback } from 'react';
import { View, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { LogIn, Compass, Trophy, Flag, Key } from 'lucide-react-native';
import { useTheme } from '@/src/theme';
import { Text, CardFrame, TopoPattern } from '@/src/components/ui';
import { Logo } from '@/src/components/brand';
import { demoLogin } from '@/src/lib/auth/strava';

interface GuestWelcomeHeroProps {
  onLoginPress: () => void;
  onExplorePress?: () => void;
}

const GuestWelcomeHero: React.FC<GuestWelcomeHeroProps> = ({
  onLoginPress,
  onExplorePress,
}) => {
  const { colors, isDark } = useTheme();
  
  // Demo login state (hidden feature for Google Play reviewers)
  const [showDemoLogin, setShowDemoLogin] = useState(false);
  const [demoPassword, setDemoPassword] = useState('');
  const [demoLoading, setDemoLoading] = useState(false);
  const [logoTapCount, setLogoTapCount] = useState(0);

  // Hidden demo login trigger - tap the logo 5 times
  const handleLogoTap = useCallback(() => {
    const newCount = logoTapCount + 1;
    setLogoTapCount(newCount);
    if (newCount >= 5) {
      setShowDemoLogin(true);
      setLogoTapCount(0);
    }
  }, [logoTapCount]);

  const handleDemoLogin = useCallback(async () => {
    if (!demoPassword.trim()) {
      Alert.alert('Error', 'Please enter the demo password');
      return;
    }
    
    setDemoLoading(true);
    const success = await demoLogin(demoPassword.trim());
    setDemoLoading(false);
    
    if (success) {
      setShowDemoLogin(false);
      setDemoPassword('');
    } else {
      Alert.alert('Error', 'Invalid demo credentials');
    }
  }, [demoPassword]);

  return (
    <View className="px-4">
      <CardFrame 
        topo="full" 
        seed="guest-hero"
        style={{ padding: 0, overflow: 'hidden' }}
      >
        {/* Accent wash overlay */}
        <View 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 120,
            backgroundColor: colors.primary,
            opacity: isDark ? 0.08 : 0.06,
          }}
        />
        
        <View className="p-5">
          {/* Logo/Brand - tappable for hidden demo login */}
          <TouchableOpacity 
            className="flex-row items-center gap-3 mb-4"
            onPress={handleLogoTap}
            activeOpacity={0.9}
          >
            <View 
              className="w-12 h-12 rounded-xl items-center justify-center"
              style={{ backgroundColor: `${colors.primary}20` }}
            >
              <Logo size={24} />
            </View>
            <View>
              <Text 
                className="text-xl font-bold" 
                style={{ color: colors.foreground }}
              >
                PathQuest
              </Text>
              <Text 
                className="text-xs" 
                style={{ color: colors.mutedForeground }}
              >
                Track your mountain adventures
              </Text>
            </View>
          </TouchableOpacity>
          
          {/* Demo Login Form (hidden by default) */}
          {showDemoLogin ? (
            <View className="mb-4">
              <Text 
                className="text-base font-semibold text-center mb-2"
                style={{ color: colors.foreground }}
              >
                Demo Login
              </Text>
              <Text 
                className="text-xs text-center mb-4"
                style={{ color: colors.mutedForeground }}
              >
                For app reviewers only
              </Text>
              
              <TextInput
                style={{
                  backgroundColor: `${colors.foreground}10`,
                  borderRadius: 10,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  fontSize: 15,
                  color: colors.foreground,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: `${colors.foreground}20`,
                }}
                placeholder="Enter demo password"
                placeholderTextColor={colors.mutedForeground}
                value={demoPassword}
                onChangeText={setDemoPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />

              <View className="gap-2">
                <TouchableOpacity
                  className="flex-row items-center justify-center gap-2 py-3 rounded-xl"
                  style={{ 
                    backgroundColor: colors.primary,
                    opacity: demoLoading ? 0.7 : 1,
                  }}
                  onPress={handleDemoLogin}
                  disabled={demoLoading}
                  activeOpacity={0.8}
                >
                  {demoLoading ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <>
                      <Key size={16} color="white" />
                      <Text className="text-white font-semibold">Sign In</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  className="py-2"
                  onPress={() => setShowDemoLogin(false)}
                  activeOpacity={0.7}
                >
                  <Text 
                    className="text-center text-sm"
                    style={{ color: colors.mutedForeground }}
                  >
                    Back to Strava login
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              {/* Value props */}
              <View className="gap-3 mb-5">
                <ValueProp 
                  icon={<Flag size={14} color={colors.primary} />}
                  text="Auto-detect summits from Strava activities"
                  colors={colors}
                />
                <ValueProp 
                  icon={<Trophy size={14} color={colors.statGold} />}
                  text="Complete challenges like the 14ers or ADK 46"
                  colors={colors}
                />
                <ValueProp 
                  icon={<Compass size={14} color={colors.summited} />}
                  text="Discover new peaks and plan adventures"
                  colors={colors}
                />
              </View>
              
              {/* CTAs */}
              <View className="gap-3">
                {/* Primary CTA */}
                <TouchableOpacity
                  className="flex-row items-center justify-center gap-2 py-3.5 rounded-xl"
                  style={{ 
                    backgroundColor: '#FC4C02', // Strava orange
                    shadowColor: '#FC4C02',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                  onPress={onLoginPress}
                  activeOpacity={0.8}
                >
                  <LogIn size={18} color="white" />
                  <Text className="text-white font-semibold">
                    Connect with Strava
                  </Text>
                </TouchableOpacity>
                
                {/* Secondary CTA */}
                {onExplorePress && (
                  <TouchableOpacity
                    className="flex-row items-center justify-center gap-2 py-3 rounded-xl"
                    style={{ 
                      backgroundColor: `${colors.primary}15`,
                      borderWidth: 1,
                      borderColor: `${colors.primary}30`,
                    }}
                    onPress={onExplorePress}
                    activeOpacity={0.7}
                  >
                    <Compass size={16} color={colors.primary} />
                    <Text className="font-medium" style={{ color: colors.primary }}>
                      Explore Peaks & Challenges
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}
        </View>
      </CardFrame>
    </View>
  );
};

interface ValuePropProps {
  icon: React.ReactNode;
  text: string;
  colors: any;
}

const ValueProp: React.FC<ValuePropProps> = ({ icon, text, colors }) => (
  <View className="flex-row items-center gap-2.5">
    <View 
      className="w-6 h-6 rounded-md items-center justify-center"
      style={{ backgroundColor: `${colors.foreground}08` }}
    >
      {icon}
    </View>
    <Text 
      className="text-sm flex-1" 
      style={{ color: colors.mutedForeground }}
    >
      {text}
    </Text>
  </View>
);

export default GuestWelcomeHero;

