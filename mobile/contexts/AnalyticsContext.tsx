import * as React from 'react'
import { createContext, useContext } from 'react';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';

interface AnalyticsContextType {
  trackEvent: (eventType: string, eventData: Record<string, unknown>) => void;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

export const AnalyticsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const trackEvent = async (eventType: string, eventData: Record<string, unknown>) => {
    try {
      const userId = await SecureStore.getItemAsync('userId');
      if (!userId) return;

      await axios.post(`${API_BASE_URL}${API_ENDPOINTS.analytics}`, {
        user_id: userId,
        event_type: eventType,
        event_data: eventData,
        platform: 'mobile',
        app_version: '1.0.0',
      });
    } catch (error) {
      console.error('Analytics error:', error);
    }
  };

  return (
    <AnalyticsContext.Provider value={{ trackEvent }}>
      {children}
    </AnalyticsContext.Provider>
  );
};

export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
};