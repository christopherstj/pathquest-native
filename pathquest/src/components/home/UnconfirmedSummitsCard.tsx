/**
 * UnconfirmedSummitsCard
 * 
 * A dashboard card showing unconfirmed summits that need user review.
 * Styled with amber/rust warning theme to draw attention.
 * Shows up to 3 summits with quick confirm/deny actions.
 */

import React from 'react';
import { View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { AlertTriangle, Check, X, ChevronRight, Mountain } from 'lucide-react-native';
import { formatDistanceToNowStrict } from 'date-fns';
import { Text } from '@/src/components/ui';
import CardFrame from '@/src/components/ui/CardFrame';
import { useTheme } from '@/src/theme';
import { useUnconfirmedSummits, useConfirmSummit, useDenySummit } from '@/src/hooks';
import type { UnconfirmedSummit } from '@pathquest/shared';

interface UnconfirmedSummitsCardProps {
  /** Navigate to the Profile Review tab */
  onViewAll?: () => void;
  /** Max number of summits to show (default: 3) */
  maxSummits?: number;
}

const UnconfirmedSummitsCard: React.FC<UnconfirmedSummitsCardProps> = ({
  onViewAll,
  maxSummits = 3,
}) => {
  const { colors, isDark } = useTheme();
  
  // Fetch unconfirmed summits
  const { data: summits, isLoading } = useUnconfirmedSummits(maxSummits);
  
  // Mutations
  const confirmMutation = useConfirmSummit();
  const denyMutation = useDenySummit();
  
  // Amber/rust warning accent
  const accentColor = colors.secondary;
  const accentBg = `${colors.secondary}${isDark ? '20' : '15'}`;
  
  // Don't render if no unconfirmed summits
  if (!isLoading && (!summits || summits.length === 0)) {
    return null;
  }
  
  // Parse timestamp helper (handles PostgreSQL format)
  const parseTimestamp = (ts: string): Date => {
    if (!ts) return new Date();
    let parsed = ts.replace(' ', 'T');
    if (/[+-]\d{2}$/.test(parsed)) {
      parsed = parsed + ':00';
    }
    return new Date(parsed);
  };
  
  const handleConfirm = (summitId: string) => {
    confirmMutation.mutate(summitId);
  };
  
  const handleDeny = (summitId: string) => {
    denyMutation.mutate(summitId);
  };
  
  const summitCount = summits?.length ?? 0;
  
  return (
    <CardFrame
      variant="cta"
      topo="corner"
      ridge="bottom"
      seed="unconfirmed-summits"
      accentColor={accentColor}
    >
      {/* Top label bar */}
      <View className="px-4 pt-3 pb-2 flex-row items-center">
        <AlertTriangle size={12} color={accentColor} />
        <Text 
          className="text-[10px] font-bold ml-1.5 uppercase tracking-wider"
          style={{ color: accentColor }}
        >
          Needs Review
        </Text>
      </View>
      
      {/* Header */}
      <View className="px-4 pb-3">
        <View className="flex-row items-center mb-3">
          {/* Icon Container */}
          <View 
            className="w-12 h-12 rounded-lg items-center justify-center"
            style={{ backgroundColor: accentBg }}
          >
            <Mountain size={20} color={accentColor} />
          </View>
          
          {/* Content */}
          <View className="flex-1 ml-3">
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.mutedForeground} />
            ) : (
              <>
                <Text style={{ color: colors.foreground }} className="text-lg font-bold">
                  {summitCount} summit{summitCount !== 1 ? 's' : ''} to review
                </Text>
                <Text style={{ color: colors.mutedForeground }} className="text-sm mt-0.5">
                  Confirm or deny detected peaks
                </Text>
              </>
            )}
          </View>
        </View>
        
        {/* Summit list */}
        {!isLoading && summits && summits.length > 0 && (
          <View className="gap-2 mb-3">
            {summits.slice(0, maxSummits).map((summit) => (
              <SummitRow
                key={summit.id}
                summit={summit}
                onConfirm={() => handleConfirm(summit.id)}
                onDeny={() => handleDeny(summit.id)}
                isConfirming={confirmMutation.isPending && confirmMutation.variables === summit.id}
                isDenying={denyMutation.isPending && denyMutation.variables === summit.id}
                parseTimestamp={parseTimestamp}
              />
            ))}
          </View>
        )}
        
        {/* View all link */}
        {onViewAll && (
          <TouchableOpacity
            className="flex-row items-center justify-center py-2"
            onPress={onViewAll}
            activeOpacity={0.7}
          >
            <Text 
              className="text-sm font-semibold mr-1"
              style={{ color: accentColor }}
            >
              View all in Profile
            </Text>
            <ChevronRight size={14} color={accentColor} />
          </TouchableOpacity>
        )}
      </View>
      
      {/* Bottom accent line */}
      <View style={{ height: 2, backgroundColor: accentColor, opacity: 0.3 }} />
    </CardFrame>
  );
};

interface SummitRowProps {
  summit: UnconfirmedSummit;
  onConfirm: () => void;
  onDeny: () => void;
  isConfirming: boolean;
  isDenying: boolean;
  parseTimestamp: (ts: string) => Date;
}

const SummitRow: React.FC<SummitRowProps> = ({
  summit,
  onConfirm,
  onDeny,
  isConfirming,
  isDenying,
  parseTimestamp,
}) => {
  const { colors, isDark } = useTheme();
  
  const timeAgo = formatDistanceToNowStrict(parseTimestamp(summit.timestamp), { addSuffix: true });
  const elevationFt = Math.round(summit.peakElevation * 3.28084);
  
  const isLoading = isConfirming || isDenying;
  
  return (
    <View 
      className="flex-row items-center px-3 py-2.5 rounded-lg"
      style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}
    >
      {/* Peak info */}
      <View className="flex-1 mr-2">
        <Text 
          style={{ color: colors.foreground }} 
          className="text-[15px] font-semibold"
          numberOfLines={1}
        >
          {summit.peakName}
        </Text>
        <Text style={{ color: colors.mutedForeground }} className="text-xs mt-0.5">
          {elevationFt.toLocaleString()}ft • {timeAgo}
        </Text>
      </View>
      
      {/* Action buttons */}
      <View className="flex-row items-center gap-2">
        {/* Deny button */}
        <TouchableOpacity
          onPress={onDeny}
          disabled={isLoading}
          activeOpacity={0.7}
          className="w-8 h-8 rounded-full items-center justify-center"
          style={{ 
            backgroundColor: isDark ? 'rgba(196, 69, 54, 0.15)' : 'rgba(196, 69, 54, 0.1)',
            opacity: isLoading ? 0.5 : 1,
          }}
        >
          {isDenying ? (
            <ActivityIndicator size="small" color={colors.destructive} />
          ) : (
            <X size={16} color={colors.destructive} />
          )}
        </TouchableOpacity>
        
        {/* Confirm button */}
        <TouchableOpacity
          onPress={onConfirm}
          disabled={isLoading}
          activeOpacity={0.7}
          className="w-8 h-8 rounded-full items-center justify-center"
          style={{ 
            backgroundColor: isDark ? 'rgba(91, 145, 103, 0.2)' : 'rgba(77, 122, 87, 0.15)',
            opacity: isLoading ? 0.5 : 1,
          }}
        >
          {isConfirming ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Check size={16} color={colors.primary} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default UnconfirmedSummitsCard;




