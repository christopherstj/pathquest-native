/**
 * JournalContent
 * 
 * Profile Journal sub-tab - "The Summit Log"
 * 
 * Displays all user summits with the vintage journal aesthetic.
 * Uses the shared SummitCard component for each entry.
 */

import React, { useEffect, useState, useMemo } from 'react';
import { View, TouchableOpacity, ScrollView } from 'react-native';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useRouter } from "expo-router";
import { 
  BookOpen, 
  PenLine,
  MessageSquare,
  X,
} from 'lucide-react-native';
import { Text } from '@/src/components/ui';
import { SummitCard, StateFilterDropdown } from '@/src/components/shared';
import type { SummitCardData } from '@/src/components/shared/SummitCard';
import { useTheme } from '@/src/theme';
import { useUserJournal, useUserSummitStates } from '@/src/hooks';
import type { JournalEntry, JournalFilters } from '@/src/hooks';

interface JournalContentProps {
  initialEntries?: JournalEntry[];
  totalCount?: number;
  userId: string;
  onEntryPress?: (entry: JournalEntry) => void;
  onAddNotes?: (entry: JournalEntry) => void;
  onEditEntry?: (entry: JournalEntry) => void;
  isLoading?: boolean;
  /** When true, use BottomSheetScrollView; otherwise use regular ScrollView */
  inBottomSheet?: boolean;
}

/**
 * Convert JournalEntry to SummitCardData
 */
const toSummitCardData = (entry: JournalEntry): SummitCardData => ({
  id: entry.id,
  timestamp: entry.timestamp,
  peakName: entry.peakName,
  peakId: entry.peakId,
  elevation: entry.elevation,
  notes: entry.notes,
  difficulty: entry.difficulty as SummitCardData['difficulty'],
  experienceRating: entry.experienceRating as SummitCardData['experienceRating'],
  conditionTags: entry.conditionTags,
  customTags: entry.customTags,
  temperature: entry.temperature,
  cloudCover: entry.cloudCover,
  precipitation: entry.precipitation,
  weatherCode: entry.weatherCode,
  windSpeed: entry.windSpeed,
});

const JournalContent: React.FC<JournalContentProps> = ({
  initialEntries = [],
  totalCount = 0,
  userId,
  onEntryPress,
  onAddNotes,
  onEditEntry,
  isLoading = false,
  inBottomSheet = false,
}) => {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const ScrollContainer = inBottomSheet ? BottomSheetScrollView : ScrollView;
  const [showNotesOnly, setShowNotesOnly] = useState(false);
  const [stateFilter, setStateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [allEntries, setAllEntries] = useState<JournalEntry[]>(initialEntries);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // Fetch available states for filter dropdown
  const { data: availableStates = [], isLoading: statesLoading } = useUserSummitStates(userId);
  
  // Build filters object for API calls
  const filters: JournalFilters = useMemo(() => ({
    state: stateFilter || undefined,
  }), [stateFilter]);
  
  // Fetch first page with filters (used when filter changes)
  const firstPageQuery = useUserJournal(userId, 1, 30, filters);
  
  // Fetch more pages with same filters
  const nextPageQuery = useUserJournal(userId, currentPage + 1, 30, filters);
  
  // Update allEntries when initialEntries changes (only for unfiltered state)
  useEffect(() => {
    if (initialEntries.length > 0 && currentPage === 1 && !stateFilter) {
      setAllEntries(initialEntries);
    }
  }, [initialEntries, currentPage, stateFilter]);
  
  // When filter changes, reset to page 1 and use filtered data
  useEffect(() => {
    setCurrentPage(1);
    if (stateFilter && firstPageQuery.data) {
      setAllEntries(firstPageQuery.data.entries);
    } else if (!stateFilter) {
      setAllEntries(initialEntries);
    }
  }, [stateFilter, firstPageQuery.data, initialEntries]);
  
  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMore) return;
    
    setIsLoadingMore(true);
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
  };
  
  // When next page data arrives, append it
  useEffect(() => {
    if (nextPageQuery.data && currentPage > 1 && !nextPageQuery.isLoading) {
      setAllEntries(prev => {
        const existingIds = new Set(prev.map(e => e.id));
        const newEntries = nextPageQuery.data.entries.filter(e => !existingIds.has(e.id));
        return [...prev, ...newEntries];
      });
      setIsLoadingMore(false);
    }
  }, [nextPageQuery.data, currentPage, nextPageQuery.isLoading]);
  
  // Apply notes filter client-side (state filter is server-side)
  const filteredEntries = useMemo(() => {
    if (showNotesOnly) {
      return allEntries.filter(e => e.hasNotes);
    }
    return allEntries;
  }, [allEntries, showNotesOnly]);
  
  const entriesWithNotes = useMemo(() => allEntries.filter(e => e.hasNotes).length, [allEntries]);
  
  // Use server-side total count when filtered
  const filteredTotalCount = stateFilter && firstPageQuery.data 
    ? firstPageQuery.data.totalCount 
    : totalCount;
  const hasMore = allEntries.length < filteredTotalCount;
  const isFiltered = stateFilter !== '';
  
  const handleClearFilter = () => {
    setStateFilter('');
  };

  const handleDefaultEntryPress = (entry: JournalEntry) => {
    if (entry.activityId) {
      router.push({
        pathname: "/explore/activity/[activityId]",
        params: { activityId: entry.activityId },
      });
      return;
    }

    router.push({
      pathname: "/explore/peak/[peakId]",
      params: { peakId: entry.peakId },
    });
  };

  // Show loading state when initial load OR when filter changes
  const isFilterLoading = stateFilter && firstPageQuery.isLoading;
  
  if ((isLoading || isFilterLoading) && allEntries.length === 0) {
    return (
      <View className="p-4 gap-4">
        <View className="h-[160px] rounded-xl bg-muted animate-pulse" />
        <View className="h-[160px] rounded-xl bg-muted animate-pulse" />
      </View>
    );
  }

  if (totalCount === 0 && allEntries.length === 0) {
    return (
      <View className="flex-1 items-center justify-center p-8">
        <View 
          className="w-20 h-20 rounded-full items-center justify-center mb-4"
          style={{ backgroundColor: `${colors.summited}15` }}
        >
          <BookOpen size={36} color={colors.summited} />
        </View>
        <Text 
          className="text-xl font-semibold text-center"
          style={{ color: colors.foreground }}
        >
          Your Summit Log
        </Text>
        <Text 
          className="text-sm mt-3 text-center leading-6 max-w-[280px]"
          style={{ color: colors.mutedForeground }}
        >
          Every peak has a story. Add trip reports to your summits and create a journal of your mountain adventures.
        </Text>
        <View 
          className="flex-row items-center gap-2 mt-6 px-4 py-2 rounded-full"
          style={{ backgroundColor: `${colors.summited}10` }}
        >
          <PenLine size={14} color={colors.summited} />
          <Text 
            className="text-sm"
            style={{ color: colors.summited }}
          >
            Write your first entry
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollContainer
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16, paddingBottom: 24, gap: 16 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Journal header */}
      <View className="mb-3 px-1">
        <View className="flex-row items-center gap-2 mb-2">
          <BookOpen size={14} color={colors.summited} />
          <Text 
            className="text-xs uppercase tracking-widest"
            style={{ color: colors.mutedForeground }}
          >
            Summit Log
          </Text>
          <Text 
            className="text-xs"
            style={{ color: colors.mutedForeground }}
          >
            ({showNotesOnly ? filteredEntries.length : filteredTotalCount})
          </Text>
        </View>
        
        {/* Filter row */}
        <View className="flex-row items-center gap-2 flex-wrap">
          <StateFilterDropdown
            states={availableStates}
            selectedState={stateFilter}
            onStateChange={setStateFilter}
            isLoading={statesLoading}
            accentColor={colors.summited}
          />
          
          {/* Notes filter toggle */}
          {entriesWithNotes > 0 && (
            <TouchableOpacity
              className="flex-row items-center gap-1.5 px-2.5 py-1.5 rounded-full"
              style={{ 
                backgroundColor: showNotesOnly ? `${colors.summited}15` : 'transparent',
                borderWidth: 1,
                borderColor: showNotesOnly ? colors.summited : colors.border,
              }}
              onPress={() => setShowNotesOnly(!showNotesOnly)}
              activeOpacity={0.7}
            >
              <MessageSquare size={12} color={showNotesOnly ? colors.summited : colors.mutedForeground} />
              <Text 
                className="text-[11px]"
                style={{ color: showNotesOnly ? colors.summited : colors.mutedForeground }}
              >
                With notes ({entriesWithNotes})
              </Text>
            </TouchableOpacity>
          )}
          
          {/* Clear filters */}
          {isFiltered && (
            <TouchableOpacity
              onPress={handleClearFilter}
              className="flex-row items-center gap-1 px-2 py-1.5"
              activeOpacity={0.7}
            >
              <X size={12} color={colors.mutedForeground} />
              <Text 
                className="text-xs"
                style={{ color: colors.mutedForeground }}
              >
                Clear
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {filteredEntries.map((entry, index) => (
        <SummitCard
          key={entry.id}
          summit={toSummitCardData(entry)}
          showPeakInfo={true}
          accentColor={colors.summited}
          isOwned={true}
          onPress={onEntryPress ? () => onEntryPress(entry) : () => handleDefaultEntryPress(entry)}
          onAddNotes={onAddNotes ? () => onAddNotes(entry) : undefined}
          onEdit={onEditEntry ? () => onEditEntry(entry) : undefined}
          delay={Math.min(index * 60, 300)}
          animated={true}
        />
      ))}
      
      {/* Load More Button */}
      {hasMore && !showNotesOnly && (
        <TouchableOpacity
          className="flex-row items-center justify-center gap-2 py-4 mt-2 rounded-xl border"
          style={{ 
            borderColor: colors.border,
            backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)',
          }}
          onPress={handleLoadMore}
          disabled={isLoadingMore || nextPageQuery.isLoading}
          activeOpacity={0.7}
        >
          {(isLoadingMore || nextPageQuery.isLoading) ? (
            <Text 
              className="text-sm"
              style={{ color: colors.mutedForeground }}
            >
              Loading...
            </Text>
          ) : (
            <>
              <Text 
                className="text-sm font-medium"
                style={{ color: colors.summited }}
              >
                Load more
              </Text>
              <Text 
                className="text-xs"
                style={{ color: colors.mutedForeground }}
              >
                ({allEntries.length} of {filteredTotalCount})
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </ScrollContainer>
  );
};

export default JournalContent;
