/**
 * Gluestack UI Provider
 * 
 * Wraps the app with gluestack-ui context for themed components.
 * Uses NativeWind for styling with Tailwind CSS classes.
 */

import React from 'react';
import { GluestackUIProvider as GSProvider } from '@gluestack-ui/themed';
import { config } from '@gluestack-ui/config';

interface GluestackProviderProps {
  children: React.ReactNode;
}

export const GluestackProvider: React.FC<GluestackProviderProps> = ({ children }) => {
  return (
    <GSProvider config={config}>
      {children}
    </GSProvider>
  );
};

