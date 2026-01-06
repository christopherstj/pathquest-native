/**
 * PeaksContent
 * 
 * Profile Peaks sub-tab - "The Summit Collection"
 * 
 * Displays the user's conquered peaks as a vintage collector's catalog.
 * Features:
 * - Collection header with total count
 * - Elevation tiers grouped visually
 * - Filter/sort bar styled as catalog controls
 * - Rich peak cards with summit indicators
 */

import React, { useMemo, useRef, useEffect, useState } from 'react';
import { View, TouchableOpacity, Animated, LayoutAnimation, Platform, UIManager, ScrollView } from 'react-native';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { 
  ArrowUpDown, 
  Mountain,
  ChevronDown,
  ChevronUp,
  Flag,
  Layers,
  TreePine,
  X,
} from 'lucide-react-native';
import { getElevationString } from '@pathquest/shared';
import { Text } from '@/src/components/ui';
import { StateFilterDropdown } from '@/src/components/shared';
import { useTheme } from '@/src/theme';
import { useUserPeaks, useUserSummitStates } from '@/src/hooks';
import type { PeaksFilters } from '@/src/hooks';
import type { Peak, UserPeakWithSummitCount } from '@pathquest/shared';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface PeaksContentProps {
  initialPeaks?: UserPeakWithSummitCount[];
  totalCount?: number;
  totalSummitsCount?: number;
  userId: string;
  onPeakPress?: (peak: Peak) => void;
  isLoading?: boolean;
  /** When true, use BottomSheetScrollView; otherwise use regular ScrollView */
  inBottomSheet?: boolean;
}

type SortOption = 'elevation' | 'name' | 'recent' | 'summits';

// ═══════════════════════════════════════════════════════════════════════════
// DECORATIVE COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * SummitCountIcon - Left-side indicator showing summit count with flag
 */
const SummitCountIcon: React.FC<{ count: number }> = ({ count }) => {
  const { colors } = useTheme();
  
  return (
    <View 
      className="w-10 h-10 rounded-full items-center justify-center mr-3"
      style={{ backgroundColor: `${colors.summited}15` }}
    >
      <Flag size={14} color={colors.summited} />
      <Text 
        className="text-[10px] font-semibold -mt-0.5"
        style={{ color: colors.summited }}
      >
        {count}×
      </Text>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// ENHANCED PEAK ROW
// ═══════════════════════════════════════════════════════════════════════════

interface EnhancedPeakRowProps {
  peak: UserPeakWithSummitCount & { summits?: number };
  onPress?: (peak: Peak) => void;
  index: number;
}

const EnhancedPeakRow: React.FC<EnhancedPeakRowProps> = ({ peak, onPress, index }) => {
  const { colors } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;
  
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        delay: Math.min(index * 50, 500), // Cap delay at 500ms
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        delay: Math.min(index * 50, 500),
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, fadeAnim, slideAnim]);

  const summitCount = peak.summit_count ?? peak.summits ?? 0;
  const elevation = peak.elevation ?? 0;
  const publicLand = peak.publicLand;

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateX: slideAnim }],
      }}
    >
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onPress?.(peak as Peak)}
        className="flex-row items-center px-4 py-3 border-b"
        style={{ borderColor: colors.border }}
      >
        {/* Summit count indicator */}
        <SummitCountIcon count={summitCount} />
        
        {/* Peak info */}
        <View className="flex-1 mr-2">
          <Text 
            className="text-base font-semibold"
            style={{ color: colors.foreground }}
            numberOfLines={1}
          >
            {peak.name}
          </Text>
          
          <View className="flex-row items-center gap-2 mt-0.5">
            <Text 
              className="text-sm"
              style={{ color: colors.mutedForeground }}
            >
              {getElevationString(elevation, 'imperial')}
            </Text>
            {peak.state && (
              <>
                <View 
                  className="w-1 h-1 rounded-full"
                  style={{ backgroundColor: colors.mutedForeground }}
                />
                <Text 
                  className="text-xs"
                  style={{ color: colors.mutedForeground }}
                >
                  {peak.state}
                </Text>
              </>
            )}
          </View>
          
          {/* Public land */}
          {publicLand && (
            <View className="flex-row items-center gap-1 mt-1">
              <TreePine size={10} color={colors.primary} />
              <Text 
                className="text-[11px]"
                style={{ color: colors.primary }}
                numberOfLines={1}
              >
                {publicLand.name}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const PeaksContent: React.FC<PeaksContentProps> = ({
  initialPeaks = [],
  totalCount = 0,
  totalSummitsCount,
  userId,
  onPeakPress,
  isLoading = false,
  inBottomSheet = false,
}) => {
  const { colors, isDark } = useTheme();
  const ScrollContainer = inBottomSheet ? BottomSheetScrollView : ScrollView;
  const [sortBy, setSortBy] = useState<SortOption>('elevation');
  const [sortAsc, setSortAsc] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [allPeaks, setAllPeaks] = useState<UserPeakWithSummitCount[]>(initialPeaks);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [stateFilter, setStateFilter] = useState('');
  
  // Fetch available states for filter dropdown
  const { data: availableStates = [], isLoading: statesLoading } = useUserSummitStates(userId);
  
  // Build filters object
  const filters: PeaksFilters = useMemo(() => ({
    state: stateFilter || undefined,
    sortBy: sortBy as PeaksFilters['sortBy'],
  }), [stateFilter, sortBy]);
  
  // Update allPeaks when initialPeaks changes (only for unfiltered state)
  useEffect(() => {
    if (initialPeaks.length > 0 && currentPage === 1 && !stateFilter) {
      setAllPeaks(initialPeaks);
    }
  }, [initialPeaks, currentPage, stateFilter]);
  
  // Fetch first page when filter changes
  const firstPageQuery = useUserPeaks(userId, 1, 50, filters);
  
  // Fetch more pages
  const nextPageQuery = useUserPeaks(userId, currentPage + 1, 50, filters);
  
  // Update allPeaks when first page data arrives (for filtered results)
  useEffect(() => {
    if (firstPageQuery.data && stateFilter) {
      setAllPeaks(firstPageQuery.data.peaks);
      setCurrentPage(1);
    }
  }, [firstPageQuery.data, stateFilter]);
  
  // Reset pagination when filter changes
  useEffect(() => {
    setCurrentPage(1);
    if (stateFilter && firstPageQuery.data) {
      setAllPeaks(firstPageQuery.data.peaks);
    } else if (!stateFilter) {
      setAllPeaks(initialPeaks);
    }
  }, [stateFilter]);
  
  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMore) return;
    
    setIsLoadingMore(true);
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
  };
  
  // When next page data arrives, append it
  useEffect(() => {
    if (nextPageQuery.data && currentPage > 1 && !nextPageQuery.isLoading) {
      setAllPeaks(prev => {
        const existingIds = new Set(prev.map(e => e.id));
        const newPeaks = nextPageQuery.data.peaks.filter(e => !existingIds.has(e.id));
        return [...prev, ...newPeaks];
      });
      setIsLoadingMore(false);
    }
  }, [nextPageQuery.data, currentPage, nextPageQuery.isLoading]);
  
  // Determine total count (filtered or unfiltered)
  const filteredTotalCount = stateFilter && firstPageQuery.data 
    ? firstPageQuery.data.totalCount 
    : totalCount;
  const hasMore = allPeaks.length < filteredTotalCount;
  
  const handleClearFilter = () => {
    setStateFilter('');
  };
  
  // Map and sort peaks
  const sortedPeaks = useMemo(() => {
    const mapped = allPeaks.map(p => ({
      ...p,
      summits: p.summit_count ?? p.summits ?? 0,
    }));
    
    return [...mapped].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'elevation':
          comparison = (b.elevation ?? 0) - (a.elevation ?? 0);
          break;
        case 'name':
          comparison = (a.name ?? '').localeCompare(b.name ?? '');
          break;
        case 'summits':
          comparison = (b.summit_count ?? 0) - (a.summit_count ?? 0);
          break;
        default:
          comparison = (b.elevation ?? 0) - (a.elevation ?? 0);
      }
      return sortAsc ? -comparison : comparison;
    });
  }, [allPeaks, sortBy, sortAsc]);

  // Calculate fallback summit count if profile stats not provided
  const calculatedSummits = useMemo(() => {
    if (allPeaks.length === 0) return 0;
    return allPeaks.reduce((sum, p) => sum + (p.summit_count ?? 0), 0);
  }, [allPeaks]);
  
  // Use total count from props for display (or filtered count)
  const displayPeakCount = filteredTotalCount;
  const displaySummitCount = totalSummitsCount ?? calculatedSummits;
  const isFiltered = stateFilter !== '';

  const handleSortChange = (option: SortOption) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (sortBy === option) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(option);
      setSortAsc(false);
    }
  };

  if (isLoading && allPeaks.length === 0) {
    return (
      <View className="p-4 gap-3">
        <View className="h-[80px] rounded-xl bg-muted animate-pulse" />
        <View className="h-14 rounded-lg bg-muted animate-pulse" />
        <View className="h-14 rounded-lg bg-muted animate-pulse" />
        <View className="h-14 rounded-lg bg-muted animate-pulse" />
      </View>
    );
  }

  if (totalCount === 0 && sortedPeaks.length === 0) {
    return (
      <View className="flex-1 items-center justify-center p-8">
        <View 
          className="w-20 h-20 rounded-full items-center justify-center mb-4"
          style={{ backgroundColor: `${colors.primary}15` }}
        >
          <Mountain size={36} color={colors.primary} />
        </View>
        <Text 
          className="text-xl font-semibold text-center"
          style={{ color: colors.foreground }}
        >
          Your Summit Collection
        </Text>
        <Text 
          className="text-sm mt-3 text-center leading-6 max-w-[280px]"
          style={{ color: colors.mutedForeground }}
        >
          The peaks you conquer will appear here. Connect with Strava to automatically track your summit collection.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1">
      {/* Collection Header */}
      <View 
        className="px-4 py-3"
        style={{ 
          backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)',
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <View 
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: `${colors.summited}15` }}
            >
              <Layers size={18} color={colors.summited} />
            </View>
            <View>
              <View className="flex-row items-baseline gap-1.5">
                <Text 
                  className="text-2xl font-semibold"
                  style={{ color: colors.foreground }}
                >
                  {displayPeakCount}
                </Text>
                <Text 
                  className="text-sm"
                  style={{ color: colors.mutedForeground }}
                >
                  peaks
                </Text>
              </View>
              {displaySummitCount > 0 && (
                <Text 
                  className="text-xs"
                  style={{ color: colors.mutedForeground }}
                >
                  {displaySummitCount} total summits
                </Text>
              )}
            </View>
          </View>
        </View>
      </View>

      {/* Filter & Sort Bar */}
      <View 
        className="px-4 py-2 gap-2 border-b"
        style={{ borderColor: colors.border }}
      >
        {/* Filter Row */}
        <View className="flex-row items-center gap-2">
          <StateFilterDropdown
            states={availableStates}
            selectedState={stateFilter}
            onStateChange={setStateFilter}
            isLoading={statesLoading}
            accentColor={colors.summited}
          />
          
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
        
        {/* Sort Row */}
        <View className="flex-row items-center gap-3">
          <View className="flex-row items-center gap-1">
            <ArrowUpDown size={12} color={colors.mutedForeground} />
            <Text 
              className="text-[10px] uppercase tracking-wide"
              style={{ color: colors.mutedForeground }}
            >
              Sort:
            </Text>
          </View>
          
          {(['elevation', 'name', 'summits'] as SortOption[]).map((option) => (
            <TouchableOpacity
              key={option}
              onPress={() => handleSortChange(option)}
              className="flex-row items-center gap-1 px-2 py-1 rounded"
              style={{ 
                backgroundColor: sortBy === option 
                  ? `${colors.primary}15` 
                  : 'transparent',
              }}
            >
              <Text 
                className="text-xs capitalize"
                style={{ 
                  color: sortBy === option ? colors.primary : colors.mutedForeground,
                }}
              >
                {option}
              </Text>
              {sortBy === option && (
                sortAsc 
                  ? <ChevronUp size={12} color={colors.primary} />
                  : <ChevronDown size={12} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Peaks List */}
      <ScrollContainer
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {sortedPeaks.map((peak, index) => (
          <EnhancedPeakRow
            key={peak.id}
            peak={peak}
            onPress={onPeakPress}
            index={index}
          />
        ))}
        
        {/* Load More Button */}
        {hasMore && (
          <TouchableOpacity
            className="flex-row items-center justify-center gap-2 py-4 mx-4 mt-4 rounded-xl border"
            style={{ 
              borderColor: colors.border,
              backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)',
            }}
            onPress={handleLoadMore}
            disabled={isLoadingMore}
            activeOpacity={0.7}
          >
            {isLoadingMore ? (
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
                  ({allPeaks.length} of {totalCount})
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </ScrollContainer>
    </View>
  );
};

export default PeaksContent;
