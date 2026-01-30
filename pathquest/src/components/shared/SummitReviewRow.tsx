/**
 * SummitReviewRow
 * 
 * A compact, reusable row component for reviewing unconfirmed summits.
 * Can be used in:
 * - Dashboard card (compact mode)
 * - Profile Review tab (full mode with links)
 * - Activity detail (showing summits that need confirmation)
 * - Peak detail (showing user's ascents that need confirmation)
 */

import React from 'react';
import { View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Check, X, Mountain, ExternalLink } from 'lucide-react-native';
import { formatDistanceToNowStrict, format } from 'date-fns';
import { Text } from '@/src/components/ui';
import { useTheme } from '@/src/theme';

export interface SummitReviewData {
  id: string;
  peakId: string;
  peakName: string;
  peakElevation: number; // meters
  activityId: string;
  timestamp: string;
  confidenceScore?: number;
}

interface SummitReviewRowProps {
  summit: SummitReviewData;
  /** Variant affects layout and information shown */
  variant?: 'compact' | 'full';
  /** Hide peak name (useful when already in peak context) */
  hidePeakName?: boolean;
  /** Show confidence score badge */
  showConfidence?: boolean;
  /** Callbacks */
  onConfirm: () => void;
  onDeny: () => void;
  onViewPeak?: () => void;
  onViewActivity?: () => void;
  /** Loading states */
  isConfirming?: boolean;
  isDenying?: boolean;
}

/**
 * Parse PostgreSQL timestamp format to Date
 */
const parseTimestamp = (ts: string): Date => {
  if (!ts) return new Date();
  let parsed = ts.replace(' ', 'T');
  if (/[+-]\d{2}$/.test(parsed)) {
    parsed = parsed + ':00';
  }
  return new Date(parsed);
};

export const SummitReviewRow: React.FC<SummitReviewRowProps> = ({
  summit,
  variant = 'compact',
  hidePeakName = false,
  showConfidence = false,
  onConfirm,
  onDeny,
  onViewPeak,
  onViewActivity,
  isConfirming = false,
  isDenying = false,
}) => {
  const { colors, isDark } = useTheme();
  
  const summitDate = parseTimestamp(summit.timestamp);
  const timeAgo = formatDistanceToNowStrict(summitDate, { addSuffix: true });
  const formattedDate = format(summitDate, 'MMM d, yyyy');
  const elevationFt = Math.round(summit.peakElevation * 3.28084);
  
  const isLoading = isConfirming || isDenying;
  
  // Confidence score color
  const confidencePercent = Math.round((summit.confidenceScore ?? 0) * 100);
  const confidenceColor = confidencePercent >= 70 
    ? colors.primary 
    : confidencePercent >= 50 
      ? colors.secondary 
      : colors.destructive;

  // Compact variant - used in dashboard cards
  if (variant === 'compact') {
    return (
      <View 
        style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          paddingHorizontal: 12,
          paddingVertical: 10,
          borderRadius: 8,
          backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
        }}
      >
        {/* Peak info */}
        <View style={{ flex: 1, marginRight: 8 }}>
          {!hidePeakName && (
            <Text 
              style={{ color: colors.foreground }} 
              className="text-[15px] font-semibold"
              numberOfLines={1}
            >
              {summit.peakName}
            </Text>
          )}
          <Text style={{ color: colors.mutedForeground }} className="text-xs mt-0.5">
            {hidePeakName ? formattedDate : `${elevationFt.toLocaleString()}ft • ${timeAgo}`}
          </Text>
        </View>
        
        {/* Confidence badge (optional) */}
        {showConfidence && summit.confidenceScore !== undefined && (
          <View 
            className="px-2 py-1 rounded-md mr-2"
            style={{ backgroundColor: `${confidenceColor}${isDark ? '20' : '15'}` }}
          >
            <Text 
              className="text-xs font-semibold"
              style={{ color: confidenceColor }}
            >
              {confidencePercent}%
            </Text>
          </View>
        )}
        
        {/* Action buttons */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {/* Deny button */}
          <TouchableOpacity
            onPress={onDeny}
            disabled={isLoading}
            activeOpacity={0.7}
            style={{ 
              width: 32,
              height: 32,
              borderRadius: 16,
              alignItems: 'center',
              justifyContent: 'center',
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
            style={{ 
              width: 32,
              height: 32,
              borderRadius: 16,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: isDark ? 'rgba(22, 163, 74, 0.2)' : 'rgba(4, 120, 87, 0.15)',
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
  }

  // Full variant - used in Profile Review tab with more details and navigation links
  return (
    <View 
      className="p-3 rounded-lg"
      style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}
    >
      {/* Top row: Peak info + confidence */}
      <View className="flex-row items-start mb-2">
        {!hidePeakName && (
          <View className="flex-1 mr-2">
            <Text 
              style={{ color: colors.foreground }} 
              className="text-[16px] font-semibold"
              numberOfLines={1}
            >
              {summit.peakName}
            </Text>
            <Text style={{ color: colors.mutedForeground }} className="text-sm mt-0.5">
              {elevationFt.toLocaleString()}ft • {formattedDate}
            </Text>
          </View>
        )}
        
        {hidePeakName && (
          <View className="flex-1 mr-2">
            <Text style={{ color: colors.foreground }} className="text-sm font-medium">
              {formattedDate}
            </Text>
            <Text style={{ color: colors.mutedForeground }} className="text-xs mt-0.5">
              {timeAgo}
            </Text>
          </View>
        )}
        
        {/* Confidence badge */}
        {showConfidence && summit.confidenceScore !== undefined && (
          <View 
            className="px-2 py-1 rounded-md"
            style={{ backgroundColor: `${confidenceColor}${isDark ? '20' : '15'}` }}
          >
            <Text 
              className="text-xs font-semibold"
              style={{ color: confidenceColor }}
            >
              {confidencePercent}%
            </Text>
          </View>
        )}
      </View>
      
      {/* Actions row */}
      <View className="flex-row items-center gap-2">
        {/* View links */}
        <View className="flex-row items-center gap-2 mr-auto">
          {/* View Peak link */}
          {onViewPeak && (
            <TouchableOpacity
              onPress={onViewPeak}
              activeOpacity={0.7}
              className="flex-row items-center px-2.5 py-1.5 rounded-md"
              style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}
            >
              <Mountain size={12} color={colors.mutedForeground} />
              <Text 
                className="text-xs ml-1"
                style={{ color: colors.mutedForeground }}
              >
                Peak
              </Text>
            </TouchableOpacity>
          )}
          
          {/* View Activity link */}
          {onViewActivity && (
            <TouchableOpacity
              onPress={onViewActivity}
              activeOpacity={0.7}
              className="flex-row items-center px-2.5 py-1.5 rounded-md"
              style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}
            >
              <ExternalLink size={12} color={colors.mutedForeground} />
              <Text 
                className="text-xs ml-1"
                style={{ color: colors.mutedForeground }}
              >
                Activity
              </Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Deny button */}
        <TouchableOpacity
          onPress={onDeny}
          disabled={isLoading}
          activeOpacity={0.7}
          className="flex-row items-center px-3 py-2 rounded-lg"
          style={{ 
            backgroundColor: isDark ? 'rgba(196, 69, 54, 0.12)' : 'rgba(196, 69, 54, 0.08)',
            opacity: isLoading ? 0.5 : 1,
          }}
        >
          {isDenying ? (
            <ActivityIndicator size="small" color={colors.destructive} />
          ) : (
            <>
              <X size={14} color={colors.destructive} />
              <Text 
                className="text-xs font-semibold ml-1"
                style={{ color: colors.destructive }}
              >
                Deny
              </Text>
            </>
          )}
        </TouchableOpacity>
        
        {/* Confirm button */}
        <TouchableOpacity
          onPress={onConfirm}
          disabled={isLoading}
          activeOpacity={0.7}
          className="flex-row items-center px-3 py-2 rounded-lg"
          style={{ 
            backgroundColor: colors.primary,
            opacity: isLoading ? 0.5 : 1,
          }}
        >
          {isConfirming ? (
            <ActivityIndicator size="small" color={colors.primaryForeground} />
          ) : (
            <>
              <Check size={14} color={colors.primaryForeground} />
              <Text 
                className="text-xs font-semibold ml-1"
                style={{ color: colors.primaryForeground }}
              >
                Confirm
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default SummitReviewRow;
