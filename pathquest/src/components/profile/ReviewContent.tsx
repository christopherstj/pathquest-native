/**
 * ReviewContent
 * 
 * Profile Review sub-tab for reviewing unconfirmed summits.
 * Shows a list of low-confidence summits that need user confirmation.
 * 
 * Features:
 * - Header with count and "Confirm All" button
 * - Full list of unconfirmed summits with details
 * - Confirm/deny actions for each summit
 * - Empty state when all caught up
 */

import React from 'react';
import { View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { 
  Check, 
  X, 
  CheckCheck, 
  Mountain,
  AlertTriangle,
  ExternalLink,
  Sparkles,
} from 'lucide-react-native';
import { format, formatDistanceToNowStrict } from 'date-fns';
import { Text, CardFrame, EmptyState } from '@/src/components/ui';
import { useTheme } from '@/src/theme';
import { useUnconfirmedSummits, useConfirmSummit, useDenySummit, useConfirmAllSummits } from '@/src/hooks';
import type { UnconfirmedSummit } from '@pathquest/shared';

interface ReviewContentProps {
  /** When true, use BottomSheetScrollView; otherwise use regular ScrollView */
  inBottomSheet?: boolean;
  /** Callback when "View Activity" is pressed */
  onViewActivity?: (activityId: string) => void;
}

const ReviewContent: React.FC<ReviewContentProps> = ({
  inBottomSheet = false,
  onViewActivity,
}) => {
  const { colors, isDark } = useTheme();
  
  // Fetch all unconfirmed summits
  const { data: summits, isLoading, isError, error, refetch } = useUnconfirmedSummits();
  
  // Debug logging
  if (isError) {
    console.error('[ReviewContent] Error loading unconfirmed summits:', error);
  }
  
  // Mutations
  const confirmMutation = useConfirmSummit();
  const denyMutation = useDenySummit();
  const confirmAllMutation = useConfirmAllSummits();
  
  // Amber/rust accent for warning theme
  const accentColor = colors.secondary;
  
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
  
  const handleConfirmAll = () => {
    confirmAllMutation.mutate();
  };
  
  const summitCount = summits?.length ?? 0;
  
  // Choose scroll component based on context
  const ScrollComponent = inBottomSheet ? BottomSheetScrollView : ScrollView;
  
  // Loading state
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center py-12">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.mutedForeground }} className="mt-3 text-sm">
          Loading summits to review...
        </Text>
      </View>
    );
  }
  
  // Error state
  if (isError) {
    return (
      <View className="flex-1 p-4">
        <EmptyState
          Icon={AlertTriangle}
          iconColor={colors.destructive}
          title="Failed to load summits"
          description="There was an error loading your unconfirmed summits. Please try again."
          primaryAction={{
            label: "Retry",
            onPress: () => refetch(),
          }}
          seed="review-error"
        />
      </View>
    );
  }
  
  // Empty state - all caught up!
  if (!summits || summits.length === 0) {
    return (
      <View className="flex-1 p-4">
        <EmptyState
          Icon={Sparkles}
          iconColor={colors.primary}
          title="All caught up!"
          description="You have no summits to review. New detections will appear here when we're not 100% confident about a summit."
          seed="review-empty"
        />
      </View>
    );
  }
  
  return (
    <ScrollComponent 
      className="flex-1"
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center">
          <AlertTriangle size={18} color={accentColor} />
          <Text 
            style={{ color: colors.foreground }} 
            className="text-lg font-bold ml-2"
          >
            {summitCount} summit{summitCount !== 1 ? 's' : ''} to review
          </Text>
        </View>
        
        {/* Confirm All button */}
        <TouchableOpacity
          onPress={handleConfirmAll}
          disabled={confirmAllMutation.isPending}
          activeOpacity={0.7}
          className="flex-row items-center px-3 py-2 rounded-lg"
          style={{ 
            backgroundColor: isDark ? 'rgba(91, 145, 103, 0.15)' : 'rgba(77, 122, 87, 0.12)',
            opacity: confirmAllMutation.isPending ? 0.6 : 1,
          }}
        >
          {confirmAllMutation.isPending ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <>
              <CheckCheck size={16} color={colors.primary} />
              <Text 
                className="text-sm font-semibold ml-1.5"
                style={{ color: colors.primary }}
              >
                Confirm All
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
      
      {/* Description */}
      <Text 
        style={{ color: colors.mutedForeground }} 
        className="text-sm mb-4 leading-5"
      >
        These summits were detected from your activities but have lower confidence scores. 
        Review each one to confirm or deny the detection.
      </Text>
      
      {/* Summit list */}
      <View className="gap-3">
        {summits.map((summit) => (
          <SummitReviewCard
            key={summit.id}
            summit={summit}
            onConfirm={() => handleConfirm(summit.id)}
            onDeny={() => handleDeny(summit.id)}
            onViewActivity={onViewActivity}
            isConfirming={confirmMutation.isPending && confirmMutation.variables === summit.id}
            isDenying={denyMutation.isPending && denyMutation.variables === summit.id}
            parseTimestamp={parseTimestamp}
          />
        ))}
      </View>
    </ScrollComponent>
  );
};

interface SummitReviewCardProps {
  summit: UnconfirmedSummit;
  onConfirm: () => void;
  onDeny: () => void;
  onViewActivity?: (activityId: string) => void;
  isConfirming: boolean;
  isDenying: boolean;
  parseTimestamp: (ts: string) => Date;
}

const SummitReviewCard: React.FC<SummitReviewCardProps> = ({
  summit,
  onConfirm,
  onDeny,
  onViewActivity,
  isConfirming,
  isDenying,
  parseTimestamp,
}) => {
  const { colors, isDark } = useTheme();
  
  const summitDate = parseTimestamp(summit.timestamp);
  const formattedDate = format(summitDate, 'MMM d, yyyy');
  const timeAgo = formatDistanceToNowStrict(summitDate, { addSuffix: true });
  const elevationFt = Math.round(summit.peakElevation * 3.28084);
  const distanceFt = Math.round(summit.distanceFromPeak * 3.28084);
  
  // Confidence score color
  const confidencePercent = Math.round(summit.confidenceScore * 100);
  const confidenceColor = confidencePercent >= 70 
    ? colors.primary 
    : confidencePercent >= 50 
      ? colors.secondary 
      : colors.destructive;
  
  const isLoading = isConfirming || isDenying;
  
  return (
    <CardFrame topo="corner" seed={`review-${summit.id}`}>
      <View className="p-4">
        {/* Peak info header */}
        <View className="flex-row items-start mb-3">
          {/* Icon */}
          <View 
            className="w-11 h-11 rounded-lg items-center justify-center mr-3"
            style={{ backgroundColor: `${colors.secondary}${isDark ? '18' : '12'}` }}
          >
            <Mountain size={20} color={colors.secondary} />
          </View>
          
          {/* Peak details */}
          <View className="flex-1">
            <Text 
              style={{ color: colors.foreground }} 
              className="text-[17px] font-bold"
              numberOfLines={1}
            >
              {summit.peakName}
            </Text>
            <Text style={{ color: colors.mutedForeground }} className="text-sm mt-0.5">
              {elevationFt.toLocaleString()}ft
            </Text>
          </View>
          
          {/* Confidence badge */}
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
        </View>
        
        {/* Details row */}
        <View 
          className="flex-row items-center px-3 py-2 rounded-lg mb-3"
          style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}
        >
          <View className="flex-1">
            <Text style={{ color: colors.mutedForeground }} className="text-xs uppercase tracking-wide">
              Date
            </Text>
            <Text style={{ color: colors.foreground }} className="text-sm font-medium">
              {formattedDate}
            </Text>
          </View>
          <View className="flex-1">
            <Text style={{ color: colors.mutedForeground }} className="text-xs uppercase tracking-wide">
              Distance
            </Text>
            <Text style={{ color: colors.foreground }} className="text-sm font-medium">
              {distanceFt < 100 ? `${distanceFt}ft` : `${Math.round(distanceFt / 5280 * 100) / 100}mi`} from peak
            </Text>
          </View>
        </View>
        
        {/* Actions row */}
        <View className="flex-row items-center gap-2">
          {/* View Activity link */}
          {onViewActivity && summit.activityId && (
            <TouchableOpacity
              onPress={() => onViewActivity(summit.activityId)}
              activeOpacity={0.7}
              className="flex-row items-center px-3 py-2 rounded-lg mr-auto"
              style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}
            >
              <ExternalLink size={14} color={colors.mutedForeground} />
              <Text 
                className="text-sm ml-1.5"
                style={{ color: colors.mutedForeground }}
              >
                View Activity
              </Text>
            </TouchableOpacity>
          )}
          
          {/* Spacer if no view activity */}
          {(!onViewActivity || !summit.activityId) && <View className="flex-1" />}
          
          {/* Deny button */}
          <TouchableOpacity
            onPress={onDeny}
            disabled={isLoading}
            activeOpacity={0.7}
            className="flex-row items-center px-4 py-2.5 rounded-lg"
            style={{ 
              backgroundColor: isDark ? 'rgba(196, 69, 54, 0.12)' : 'rgba(196, 69, 54, 0.08)',
              opacity: isLoading ? 0.5 : 1,
            }}
          >
            {isDenying ? (
              <ActivityIndicator size="small" color={colors.destructive} />
            ) : (
              <>
                <X size={16} color={colors.destructive} />
                <Text 
                  className="text-sm font-semibold ml-1.5"
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
            className="flex-row items-center px-4 py-2.5 rounded-lg"
            style={{ 
              backgroundColor: colors.primary,
              opacity: isLoading ? 0.5 : 1,
            }}
          >
            {isConfirming ? (
              <ActivityIndicator size="small" color={colors.primaryForeground} />
            ) : (
              <>
                <Check size={16} color={colors.primaryForeground} />
                <Text 
                  className="text-sm font-semibold ml-1.5"
                  style={{ color: colors.primaryForeground }}
                >
                  Confirm
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </CardFrame>
  );
};

export default ReviewContent;

