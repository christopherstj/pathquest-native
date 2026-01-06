/**
 * SummitCard
 * 
 * Redesigned summit entry card with three modes:
 * 1. Your Logs - No Content: Prominent CTA to add report
 * 2. With User Content: Full display with ratings, tags, notes
 * 3. Profile Journal: With peak name header
 * 
 * Features:
 * - DateStamp sidebar
 * - Weather conditions row (always present with descriptors)
 * - Difficulty/Experience ratings with intensity-scaled icons
 * - Condition tags
 * - Notes excerpt
 * - Prominent empty state CTA
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, TouchableOpacity, Animated } from 'react-native';
import { 
  // Weather icons
  Sun,
  CloudSun,
  Cloud,
  CloudFog,
  CloudRain,
  CloudSnow,
  Snowflake,
  CloudLightning,
  Wind,
  ThermometerSun,
  // Rating icons
  Mountain,
  Star,
  Smile,
  Zap,
  Flame,
  // Action icons
  PenLine,
  Pencil,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Tag,
  BookOpen,
} from 'lucide-react-native';
import { getElevationString } from '@pathquest/shared';
import { Text, CardFrame } from '@/src/components/ui';
import { useTheme } from '@/src/theme';
import type { LucideIcon } from 'lucide-react-native';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type Difficulty = 'easy' | 'moderate' | 'hard' | 'expert';
export type ExperienceRating = 'amazing' | 'good' | 'tough' | 'epic';

export interface SummitCardData {
  id: string;
  timestamp: string;
  peakName?: string;
  peakId?: string;
  elevation?: number; // in meters
  notes?: string;
  difficulty?: Difficulty;
  experienceRating?: ExperienceRating;
  conditionTags?: string[];
  customTags?: string[];
  // Weather data
  temperature?: number; // in Celsius
  cloudCover?: number;
  precipitation?: number; // in mm
  weatherCode?: number; // WMO code
  windSpeed?: number; // km/h
  // Community
  summiterName?: string;
}

export interface SummitCardProps {
  summit: SummitCardData;
  /** Whether to show peak name/elevation (profile journal) */
  showPeakInfo?: boolean;
  /** Accent color for the card */
  accentColor?: string;
  /** Whether this summit is owned by the current user */
  isOwned?: boolean;
  /** Called when the card is pressed */
  onPress?: () => void;
  /** Called when "Add report" is pressed */
  onAddNotes?: () => void;
  /** Called when edit is pressed */
  onEdit?: () => void;
  /** Animation delay in ms */
  delay?: number;
  /** Whether to animate the card entrance */
  animated?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// WEATHER UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

interface WeatherDescription {
  text: string;
  Icon: LucideIcon;
}

/**
 * WMO Weather Code to description mapper
 * Full list from Open-Meteo / web app
 */
const WEATHER_CODES: Record<number, WeatherDescription> = {
  0: { text: 'Clear', Icon: Sun },
  1: { text: 'Mainly clear', Icon: Sun },
  2: { text: 'Partly cloudy', Icon: CloudSun },
  3: { text: 'Overcast', Icon: Cloud },
  45: { text: 'Foggy', Icon: CloudFog },
  48: { text: 'Rime fog', Icon: CloudFog },
  51: { text: 'Light drizzle', Icon: CloudRain },
  53: { text: 'Drizzle', Icon: CloudRain },
  55: { text: 'Dense drizzle', Icon: CloudRain },
  61: { text: 'Light rain', Icon: CloudRain },
  63: { text: 'Rain', Icon: CloudRain },
  65: { text: 'Heavy rain', Icon: CloudRain },
  71: { text: 'Light snow', Icon: Snowflake },
  73: { text: 'Snow', Icon: CloudSnow },
  75: { text: 'Heavy snow', Icon: CloudSnow },
  77: { text: 'Snow grains', Icon: Snowflake },
  80: { text: 'Light showers', Icon: CloudRain },
  81: { text: 'Showers', Icon: CloudRain },
  82: { text: 'Heavy showers', Icon: CloudRain },
  85: { text: 'Light snow showers', Icon: CloudSnow },
  86: { text: 'Heavy snow showers', Icon: CloudSnow },
  95: { text: 'Thunderstorm', Icon: CloudLightning },
  96: { text: 'Thunderstorm with hail', Icon: CloudLightning },
};

const getWeatherDescription = (code: number | undefined): WeatherDescription | null => {
  if (code === undefined) return null;
  return WEATHER_CODES[code] ?? { text: 'Unknown', Icon: Cloud };
};

// Convert Celsius to Fahrenheit
const celsiusToFahrenheit = (celsius: number): number => Math.round((celsius * 9) / 5 + 32);

// Convert km/h to mph
const kmhToMph = (kmh: number): number => Math.round(kmh * 0.621371);

// ═══════════════════════════════════════════════════════════════════════════
// RATING UTILITIES (Icon-forward, consistent accent color)
// ═══════════════════════════════════════════════════════════════════════════

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Easy',
  moderate: 'Moderate',
  hard: 'Hard',
  expert: 'Expert',
};

// Each experience level has a unique expressive icon
const EXPERIENCE_CONFIG: Record<ExperienceRating, { label: string; Icon: LucideIcon }> = {
  good: { label: 'Good', Icon: Smile },
  amazing: { label: 'Amazing', Icon: Star },
  tough: { label: 'Tough', Icon: Zap },
  epic: { label: 'Epic', Icon: Flame },
};

// ═══════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * DateStamp - Vintage date stamp sidebar
 */
const DateStamp: React.FC<{ date: Date; color: string }> = ({ date, color }) => {
  const { colors } = useTheme();
  const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  const day = date.getDate();
  const year = date.getFullYear();
  const time = date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true,
  }).toLowerCase().replace(' ', '');
  
  return (
    <View className="items-center">
      <Text 
        className="text-[10px] font-bold tracking-wider"
        style={{ color: colors.foreground }}
      >
        {month}
      </Text>
      <Text 
        className="text-xl font-bold leading-none -mt-0.5"
        style={{ color: colors.foreground }}
      >
        {day}
      </Text>
      <Text 
        className="text-[9px] mt-0.5"
        style={{ color: colors.mutedForeground }}
      >
        {time}
      </Text>
      <Text 
        className="text-[9px] -mt-0.5"
        style={{ color: colors.mutedForeground }}
      >
        {year}
      </Text>
    </View>
  );
};

/**
 * WeatherRow - Prominent weather conditions display
 */
const WeatherRow: React.FC<{
  weatherCode?: number;
  temperature?: number;
  windSpeed?: number;
  cloudCover?: number;
}> = ({ weatherCode, temperature, windSpeed, cloudCover }) => {
  const { colors } = useTheme();
  const weather = getWeatherDescription(weatherCode);
  
  // If no weather data at all, show nothing
  if (!weather && temperature === undefined && windSpeed === undefined) {
    return null;
  }
  
  return (
    <View className="flex-row items-center flex-wrap gap-x-2 gap-y-1">
      {/* Weather description with icon */}
      {weather && (
        <View className="flex-row items-center gap-1">
          <weather.Icon size={14} color={colors.foreground} />
          <Text className="text-xs font-medium" style={{ color: colors.foreground }}>
            {weather.text}
          </Text>
        </View>
      )}
      
      {/* Temperature */}
      {temperature !== undefined && (
        <>
          {weather && <Text className="text-xs" style={{ color: colors.mutedForeground }}>·</Text>}
          <View className="flex-row items-center gap-0.5">
            <ThermometerSun size={12} color={colors.mutedForeground} />
            <Text className="text-xs" style={{ color: colors.foreground }}>
              {celsiusToFahrenheit(temperature)}°F
            </Text>
          </View>
        </>
      )}
      
      {/* Wind */}
      {windSpeed !== undefined && windSpeed > 0 && (
        <>
          <Text className="text-xs" style={{ color: colors.mutedForeground }}>·</Text>
          <View className="flex-row items-center gap-0.5">
            <Wind size={12} color={colors.mutedForeground} />
            <Text className="text-xs" style={{ color: colors.foreground }}>
              {kmhToMph(windSpeed)} mph
            </Text>
          </View>
        </>
      )}
    </View>
  );
};

/**
 * DifficultyBadge - Simple icon + label badge using accent color
 */
const DifficultyBadge: React.FC<{ difficulty: Difficulty; accentColor: string }> = ({ difficulty, accentColor }) => {
  const label = DIFFICULTY_LABELS[difficulty];
  
  return (
    <View 
      className="flex-row items-center gap-1.5 px-2.5 py-1 rounded-md"
      style={{ backgroundColor: `${accentColor}15` }}
    >
      <Mountain size={13} color={accentColor} />
      <Text 
        className="text-[11px] font-semibold"
        style={{ color: accentColor }}
      >
        {label}
      </Text>
    </View>
  );
};

/**
 * ExperienceBadge - Unique icon per experience type + label using accent color
 */
const ExperienceBadge: React.FC<{ experience: ExperienceRating; accentColor: string }> = ({ experience, accentColor }) => {
  const config = EXPERIENCE_CONFIG[experience];
  const IconComponent = config.Icon;
  
  return (
    <View 
      className="flex-row items-center gap-1.5 px-2.5 py-1 rounded-md"
      style={{ backgroundColor: `${accentColor}15` }}
    >
      <IconComponent size={13} color={accentColor} />
      <Text 
        className="text-[11px] font-semibold"
        style={{ color: accentColor }}
      >
        {config.label}
      </Text>
    </View>
  );
};

/**
 * ConditionTag - Small styled tag for conditions
 */
const ConditionTag: React.FC<{ tag: string; color: string; isCustom?: boolean }> = ({ tag, color, isCustom }) => {
  return (
    <View 
      className="px-1.5 py-px rounded flex-row items-center gap-0.5"
      style={{ backgroundColor: `${color}15` }}
    >
      {isCustom && <Tag size={8} color={color} />}
      <Text className="text-[9px] capitalize" style={{ color }}>
        {tag}
      </Text>
    </View>
  );
};

/**
 * EmptyStateCTA - Compact call-to-action for empty summit logs
 */
const EmptyStateCTA: React.FC<{ onPress: () => void; accentColor: string }> = ({ onPress, accentColor }) => {
  const { isDark } = useTheme();
  
  return (
    <TouchableOpacity 
      onPress={onPress}
      activeOpacity={0.8}
      className="mt-2"
    >
      <View 
        className="rounded-lg px-3 py-2.5 border flex-row items-center justify-center gap-2"
        style={{ 
          backgroundColor: isDark ? `${accentColor}10` : `${accentColor}08`,
          borderColor: `${accentColor}60`,
        }}
      >
        <PenLine size={14} color={accentColor} />
        <Text className="text-sm font-medium" style={{ color: accentColor }}>
          Add Report
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const SummitCard: React.FC<SummitCardProps> = ({ 
  summit, 
  showPeakInfo = true,
  accentColor,
  isOwned = false,
  onPress, 
  onAddNotes,
  onEdit,
  delay = 0,
  animated = true,
}) => {
  const { colors, isDark } = useTheme();
  const fadeAnim = useRef(new Animated.Value(animated ? 0 : 1)).current;
  const slideAnim = useRef(new Animated.Value(animated ? 12 : 0)).current;
  const [tagsExpanded, setTagsExpanded] = useState(false);
  
  const date = new Date(summit.timestamp);
  const color = accentColor ?? colors.summited;
  
  // Check if entry has user-generated content
  const hasUserContent = !!(
    summit.notes?.trim() ||
    summit.difficulty ||
    summit.experienceRating ||
    (summit.conditionTags && summit.conditionTags.length > 0) ||
    (summit.customTags && summit.customTags.length > 0)
  );
  
  // Combine tags
  const conditionTags = summit.conditionTags ?? [];
  const customTags = summit.customTags ?? [];
  const allTags = [...conditionTags, ...customTags.map(t => ({ tag: t, isCustom: true }))];
  const hasMoreTags = allTags.length > 4;
  const displayedTags = tagsExpanded ? allTags : allTags.slice(0, 4);
  
  // Header content
  const headerText = showPeakInfo && summit.peakName 
    ? summit.peakName 
    : summit.summiterName ?? null;
  const subText = showPeakInfo && summit.elevation 
    ? getElevationString(summit.elevation, 'imperial')
    : null;
  
  // Has weather data?
  const hasWeather = summit.weatherCode !== undefined || 
    summit.temperature !== undefined || 
    summit.windSpeed !== undefined;
  
  useEffect(() => {
    if (!animated) return;
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 350,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [animated, delay, fadeAnim, slideAnim]);

  const content = (
    <CardFrame 
      variant="default" 
      topo="corner" 
      seed={`summit-${summit.id}`}
      accentColor={color}
    >
      <View className="flex-row">
        {/* Date sidebar */}
        <View 
          className="w-14 py-3 items-center justify-start border-r"
          style={{ 
            borderColor: colors.border,
            backgroundColor: isDark ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.2)',
          }}
        >
          <DateStamp date={date} color={color} />
        </View>
        
        {/* Content area */}
        <View className="flex-1 py-2.5 px-3">
          {/* Row 1: Header + Edit button */}
          {(headerText || (isOwned && hasUserContent)) && (
            <View className="flex-row items-start justify-between mb-1.5">
              <View className="flex-1 mr-2">
                {headerText && (
                  <Text 
                    className="text-sm font-semibold leading-tight"
                    style={{ color: colors.foreground }}
                    numberOfLines={1}
                  >
                    {headerText}
                    {subText && (
                      <Text style={{ color: colors.mutedForeground, fontWeight: '400' }}>
                        {' · '}{subText}
                      </Text>
                    )}
                  </Text>
                )}
              </View>
              {isOwned && hasUserContent && onEdit && (
                <TouchableOpacity
                  className="p-1 -m-1"
                  onPress={onEdit}
                  activeOpacity={0.7}
                  hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                >
                  <Pencil size={14} color={colors.mutedForeground} />
                </TouchableOpacity>
              )}
            </View>
          )}
          
          {/* Row 2: Weather conditions (always shown if available) */}
          {hasWeather && (
            <View className="mb-2">
              <WeatherRow 
                weatherCode={summit.weatherCode}
                temperature={summit.temperature}
                windSpeed={summit.windSpeed}
                cloudCover={summit.cloudCover}
              />
            </View>
          )}
          
          {/* Divider if has user content */}
          {hasUserContent && (
            <View 
              className="h-px mb-2"
              style={{ backgroundColor: `${color}20` }}
            />
          )}
          
          {/* Row 3: Ratings (difficulty + experience) */}
          {(summit.difficulty || summit.experienceRating) && (
            <View className="flex-row items-center gap-2 mb-2">
              {summit.difficulty && (
                <DifficultyBadge difficulty={summit.difficulty} accentColor={color} />
              )}
              {summit.experienceRating && (
                <ExperienceBadge experience={summit.experienceRating} accentColor={color} />
              )}
            </View>
          )}
          
          {/* Row 4: Condition tags */}
          {allTags.length > 0 && (
            <View className="flex-row flex-wrap items-center gap-1 mb-2">
              {displayedTags.map((item, i) => {
                const isCustom = typeof item === 'object' && 'isCustom' in item;
                const tagText = isCustom ? item.tag : item as string;
                return (
                  <ConditionTag 
                    key={`${tagText}-${i}`}
                    tag={tagText} 
                    color={isCustom ? colors.primary : colors.mutedForeground}
                    isCustom={isCustom}
                  />
                );
              })}
              {hasMoreTags && (
                <TouchableOpacity
                  className="px-1"
                  onPress={() => setTagsExpanded(!tagsExpanded)}
                  hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                >
                  {tagsExpanded ? (
                    <ChevronUp size={12} color={colors.mutedForeground} />
                  ) : (
                    <Text className="text-[10px]" style={{ color: colors.mutedForeground }}>
                      +{allTags.length - 4}
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          )}
          
          {/* Row 5: Notes excerpt */}
          {summit.notes?.trim() && (
            <Text 
              className="text-[12px] leading-4"
              style={{ 
                color: colors.foreground,
                fontStyle: 'italic',
              }}
              numberOfLines={2}
            >
              "{summit.notes}"
            </Text>
          )}
          
          {/* Row 6: Empty state CTA (alternative to user content) */}
          {!hasUserContent && isOwned && onAddNotes && (
            <EmptyStateCTA onPress={onAddNotes} accentColor={color} />
          )}
        </View>
      </View>
    </CardFrame>
  );

  const animatedStyle = {
    opacity: fadeAnim,
    transform: [{ translateY: slideAnim }],
  };

  if (onPress) {
    return (
      <Animated.View style={animatedStyle}>
        <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
          {content}
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return <Animated.View style={animatedStyle}>{content}</Animated.View>;
};

export { SummitCard };
