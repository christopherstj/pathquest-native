/**
 * PeakDetail
 * 
 * Shows detailed information about a peak including:
 * - Header with name, elevation, location
 * - Stats grid (elevation, prominence, etc.)
 * - Sub-tabs: Community, Journal, Details
 */

import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { MapPin, ArrowUp, Flag, Users, Trophy, Heart, X, BookOpen, Info } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import type { Peak } from '@pathquest/shared';
import { getElevationString } from '@pathquest/shared';
import { Text } from '@/src/components/ui';

type PeakDetailTab = 'community' | 'journal' | 'details';

interface PeakDetailProps {
  peak: Peak;
  onClose?: () => void;
  onFavoriteToggle?: () => void;
  isFavorited?: boolean;
}

interface StatCardProps {
  label: string;
  value: string | number;
  Icon?: LucideIcon;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, Icon }) => {
  return (
    <View className="flex-1 min-w-[45%] p-3 rounded-lg bg-card border border-border items-center">
      {Icon && (
        <Icon size={14} color="#A9A196" style={{ marginBottom: 4 }} />
      )}
      <Text className="text-foreground text-lg font-bold">{value}</Text>
      <Text className="text-muted-foreground text-[11px] mt-0.5">{label}</Text>
    </View>
  );
};

const PeakDetail: React.FC<PeakDetailProps> = ({
  peak,
  onClose,
  onFavoriteToggle,
  isFavorited = false,
}) => {
  const [activeTab, setActiveTab] = useState<PeakDetailTab>('community');

  // Format location string
  const locationParts = [peak.county, peak.state, peak.country].filter(Boolean);
  const locationString = locationParts.join(', ');

  // Summit counts
  const userSummits = peak.summits ?? 0;
  const publicSummits = peak.public_summits ?? 0;

  return (
    <View className="flex-1">
      {/* Header */}
      <View className="flex-row p-4 border-b border-border">
        <View className="flex-1">
          {/* Badge */}
          <View className="flex-row items-center gap-1 bg-muted px-2 py-1 rounded-xl self-start mb-2">
            <MapPin size={10} color="#A9A196" />
            <Text className="text-muted-foreground text-[10px] font-semibold tracking-wider">PEAK</Text>
          </View>
          
          {/* Title */}
          <Text className="text-foreground text-[22px] font-bold mb-1" numberOfLines={2}>
            {peak.name || 'Unknown Peak'}
          </Text>
          
          {/* Location */}
          {locationString && (
            <Text className="text-muted-foreground text-sm">
              {locationString}
            </Text>
          )}
        </View>

        {/* Actions */}
        <View className="flex-row gap-2 ml-3">
          {onFavoriteToggle && (
            <TouchableOpacity 
              className="w-10 h-10 rounded-lg border border-border items-center justify-center"
              onPress={onFavoriteToggle}
              activeOpacity={0.7}
            >
              <Heart
                size={18} 
                color={isFavorited ? '#C44536' : '#A9A196'}
                fill={isFavorited ? '#C44536' : 'transparent'}
              />
            </TouchableOpacity>
          )}
          {onClose && (
            <TouchableOpacity 
              className="w-10 h-10 rounded-lg border border-border items-center justify-center"
              onPress={onClose}
              activeOpacity={0.7}
            >
              <X size={18} color="#A9A196" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Stats Grid */}
      <View className="flex-row flex-wrap p-3 gap-2">
        {peak.elevation !== undefined && (
          <StatCard 
            label="Elevation" 
            value={getElevationString(peak.elevation, 'imperial')} 
            Icon={ArrowUp}
          />
        )}
        <StatCard 
          label="Your Summits" 
          value={userSummits} 
          Icon={Flag}
        />
        <StatCard 
          label="Community" 
          value={publicSummits} 
          Icon={Users}
        />
        {peak.num_challenges !== undefined && peak.num_challenges > 0 && (
          <StatCard 
            label="Challenges" 
            value={peak.num_challenges} 
            Icon={Trophy}
          />
        )}
      </View>

      {/* Sub-tabs */}
      <View className="flex-row mx-4 mt-2 mb-3 p-1 rounded-lg bg-muted gap-1">
        <TouchableOpacity
          className={`flex-1 items-center justify-center py-2 px-3 rounded-lg ${
            activeTab === 'community' ? 'bg-background' : ''
          }`}
          onPress={() => setActiveTab('community')}
          activeOpacity={0.7}
        >
          <Text className={`text-[13px] font-medium ${
            activeTab === 'community' ? 'text-foreground' : 'text-muted-foreground'
          }`}>
            Community
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          className={`flex-1 items-center justify-center py-2 px-3 rounded-lg ${
            activeTab === 'journal' ? 'bg-background' : ''
          }`}
          onPress={() => setActiveTab('journal')}
          activeOpacity={0.7}
        >
          <Text className={`text-[13px] font-medium ${
            activeTab === 'journal' ? 'text-foreground' : 'text-muted-foreground'
          }`}>
            Journal
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          className={`flex-1 items-center justify-center py-2 px-3 rounded-lg ${
            activeTab === 'details' ? 'bg-background' : ''
          }`}
          onPress={() => setActiveTab('details')}
          activeOpacity={0.7}
        >
          <Text className={`text-[13px] font-medium ${
            activeTab === 'details' ? 'text-foreground' : 'text-muted-foreground'
          }`}>
            Details
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <ScrollView 
        className="flex-1"
        contentContainerClassName="p-4 pb-8"
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'community' && (
          <View className="items-center justify-center p-8">
            <Users size={24} color="#A9A196" />
            <Text className="text-muted-foreground text-sm mt-3 text-center">
              Community summit history will appear here
            </Text>
          </View>
        )}
        
        {activeTab === 'journal' && (
          <View className="items-center justify-center p-8">
            <BookOpen size={24} color="#A9A196" />
            <Text className="text-muted-foreground text-sm mt-3 text-center">
              Your summit journal entries will appear here
            </Text>
          </View>
        )}
        
        {activeTab === 'details' && (
          <View className="items-center justify-center p-8">
            <Info size={24} color="#A9A196" />
            <Text className="text-muted-foreground text-sm mt-3 text-center">
              Peak details and challenges will appear here
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default PeakDetail;
