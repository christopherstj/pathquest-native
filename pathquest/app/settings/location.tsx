/**
 * Location Select Route
 * 
 * Route for the location selection screen.
 */

import React from 'react';
import { Stack } from 'expo-router';
import LocationSelectScreen from '@/src/components/settings/LocationSelectScreen';

export default function LocationSelectRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <LocationSelectScreen />
    </>
  );
}

