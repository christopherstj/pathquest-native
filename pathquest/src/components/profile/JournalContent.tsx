/**
 * JournalContent
 * 
 * Profile Journal sub-tab showing the user's summit journal entries.
 */

import React from 'react';
import { View, ScrollView } from 'react-native';
import { BookOpen } from 'lucide-react-native';
import { Text } from '@/src/components/ui';

interface JournalEntry {
  id: string;
  peakId: string;
  peakName: string;
  timestamp: string;
  notes?: string;
  difficulty?: string;
  experienceRating?: string;
}

interface JournalContentProps {
  entries?: JournalEntry[];
  onEntryPress?: (entry: JournalEntry) => void;
  isLoading?: boolean;
}

const JournalContent: React.FC<JournalContentProps> = ({
  entries = [],
  onEntryPress,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <View className="p-4 gap-3">
        <View className="h-[100px] rounded-xl bg-muted" />
        <View className="h-[100px] rounded-xl bg-muted" />
      </View>
    );
  }

  if (entries.length === 0) {
    return (
      <View className="flex-1 items-center justify-center p-8">
        <BookOpen size={32} color="#A9A196" />
        <Text className="text-foreground text-lg font-semibold mt-4 font-display">
          No journal entries yet
        </Text>
        <Text className="text-muted-foreground text-sm mt-2 text-center leading-5">
          Add trip reports to your summits to build your climbing journal.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView 
      className="flex-1"
      contentContainerClassName="p-4 gap-3 pb-8"
      showsVerticalScrollIndicator={false}
    >
      {entries.map((entry) => (
        <JournalEntryCard
          key={entry.id}
          entry={entry}
          onPress={() => onEntryPress?.(entry)}
        />
      ))}
    </ScrollView>
  );
};

interface JournalEntryCardProps {
  entry: JournalEntry;
  onPress?: () => void;
}

const JournalEntryCard: React.FC<JournalEntryCardProps> = ({ entry, onPress }) => {
  const date = new Date(entry.timestamp);
  const dateStr = date.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <View className="p-4 rounded-xl bg-card border border-border">
      <View className="flex-row justify-between items-start mb-2">
        <Text className="text-foreground text-base font-semibold flex-1 mr-2 font-display">
          {entry.peakName}
        </Text>
        <Text className="text-muted-foreground text-xs">
          {dateStr}
        </Text>
      </View>
      
      {entry.notes && (
        <Text 
          className="text-foreground text-sm leading-5 mb-3"
          numberOfLines={3}
        >
          {entry.notes}
        </Text>
      )}

      <View className="flex-row gap-2">
        {entry.difficulty && (
          <View className="px-2.5 py-1 rounded-xl bg-muted">
            <Text className="text-muted-foreground text-xs font-medium">
              {entry.difficulty}
            </Text>
          </View>
        )}
        {entry.experienceRating && (
          <View className="px-2.5 py-1 rounded-xl bg-muted">
            <Text className="text-muted-foreground text-xs font-medium">
              {entry.experienceRating}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default JournalContent;
