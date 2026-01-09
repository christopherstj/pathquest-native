/**
 * LoginPrompt
 * 
 * Modal that prompts unauthenticated users to sign in when they try
 * to perform an auth-gated action. Shows context-aware messaging
 * based on what the user was trying to do.
 */

import React, { useCallback } from 'react';
import { View, TouchableOpacity, Modal, Pressable } from 'react-native';
import { LogIn, X, Mountain, Star, Trophy, FileText, Flag } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useTheme } from '@/src/theme';
import { Text, CardFrame } from '@/src/components/ui';
import { startStravaAuth } from '@/src/lib/auth/strava';
import { 
  useLoginPromptStore, 
  LOGIN_PROMPT_MESSAGES,
  type LoginPromptContext,
} from '@/src/store/loginPromptStore';

// Map context to icon
const CONTEXT_ICONS: Record<LoginPromptContext, LucideIcon> = {
  favorite_peak: Star,
  favorite_challenge: Trophy,
  add_report: FileText,
  manual_summit: Flag,
  track_progress: Trophy,
  view_your_logs: Mountain,
  generic: Mountain,
};

const LoginPrompt: React.FC = () => {
  const { colors, isDark } = useTheme();
  const isVisible = useLoginPromptStore((s) => s.isVisible);
  const context = useLoginPromptStore((s) => s.context);
  const hidePrompt = useLoginPromptStore((s) => s.hidePrompt);

  const message = LOGIN_PROMPT_MESSAGES[context];
  const Icon = CONTEXT_ICONS[context];

  const handleLogin = useCallback(async () => {
    hidePrompt();
    // Small delay to let modal close before OAuth flow
    setTimeout(() => {
      startStravaAuth();
    }, 300);
  }, [hidePrompt]);

  const handleClose = useCallback(() => {
    hidePrompt();
  }, [hidePrompt]);

  if (!isVisible) {
    return null;
  }

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <Pressable 
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 24,
        }}
        onPress={handleClose}
      >
        <Pressable onPress={(e) => e.stopPropagation()}>
          <CardFrame 
            topo="full" 
            seed={`login-prompt:${context}`}
            style={{ 
              width: 320,
              maxWidth: '100%',
              padding: 0,
              overflow: 'hidden',
            }}
          >
            {/* Accent wash */}
            <View 
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 100,
                backgroundColor: colors.primary,
                opacity: isDark ? 0.1 : 0.08,
              }}
            />

            {/* Close button */}
            <TouchableOpacity
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                zIndex: 10,
                padding: 8,
                borderRadius: 20,
                backgroundColor: `${colors.foreground}10`,
              }}
              onPress={handleClose}
              activeOpacity={0.7}
            >
              <X size={18} color={colors.mutedForeground} />
            </TouchableOpacity>

            <View style={{ padding: 24, paddingTop: 32 }}>
              {/* Icon */}
              <View 
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  backgroundColor: `${colors.primary}20`,
                  alignItems: 'center',
                  justifyContent: 'center',
                  alignSelf: 'center',
                  marginBottom: 16,
                }}
              >
                <Icon size={28} color={colors.primary} />
              </View>

              {/* Title */}
              <Text 
                style={{ 
                  color: colors.foreground,
                  fontSize: 20,
                  fontWeight: '700',
                  textAlign: 'center',
                  marginBottom: 8,
                }}
              >
                {message.title}
              </Text>

              {/* Description */}
              <Text 
                style={{ 
                  color: colors.mutedForeground,
                  fontSize: 14,
                  textAlign: 'center',
                  lineHeight: 20,
                  marginBottom: 24,
                }}
              >
                {message.description}
              </Text>

              {/* Login CTA */}
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  paddingVertical: 14,
                  paddingHorizontal: 24,
                  borderRadius: 12,
                  backgroundColor: '#FC4C02', // Strava orange
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
                <Text style={{ color: 'white', fontWeight: '600', fontSize: 15 }}>
                  Connect with Strava
                </Text>
              </TouchableOpacity>

              {/* Skip link */}
              <TouchableOpacity
                style={{
                  alignSelf: 'center',
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  marginTop: 8,
                }}
                onPress={handleClose}
                activeOpacity={0.7}
              >
                <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>
                  Maybe later
                </Text>
              </TouchableOpacity>
            </View>
          </CardFrame>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default LoginPrompt;

