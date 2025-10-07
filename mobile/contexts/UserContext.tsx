import * as React from 'react'
import { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';

interface UserData {
  userId: string;
  credits: number;
  subscriptionType: string | null;
  subscriptionExpires: Date | null;
  remainingToday: number;
}

interface UserContextType {
  user: UserData | null;
  refreshUser: () => Promise<void>;
  updateCredits: (credits: number) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userId = await SecureStore.getItemAsync('userId');
      if (!userId) return;

      // Fetch user data including current credits and subscription info
      const response = await axios.post(`${API_BASE_URL}${API_ENDPOINTS.restore}`, {
        user_id: userId,
        receipts: []
      });

      // If we have a user, fetch their current enhancement history to get real-time usage
      let remainingToday = 0;
      try {
        const enhancementsResponse = await axios.get(`${API_BASE_URL}/api/enhancements/${userId}`);
        const enhancements = enhancementsResponse.data || [];

        // Calculate remaining daily credits (if user has daily limits)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayEnhancements = enhancements.filter((enhancement: any) => {
          const enhancementDate = new Date(enhancement.created_at);
          return enhancementDate >= today;
        });

        // Assuming daily limit of 5 free enhancements for non-subscribers
        const dailyLimit = response.data.subscription_type ? 999 : 5;
        remainingToday = Math.max(0, dailyLimit - todayEnhancements.length);
      } catch (error) {
        console.log('Could not fetch enhancements, using default remainingToday');
        remainingToday = response.data.subscription_type ? 999 : 5;
      }

      setUser({
        userId,
        credits: response.data.credits,
        subscriptionType: response.data.subscription_type,
        subscriptionExpires: response.data.subscription_expires ? new Date(response.data.subscription_expires) : null,
        remainingToday: remainingToday,
      });
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const refreshUser = async () => {
    await loadUser();
  };

  const updateCredits = (credits: number) => {
    if (user) {
      setUser({
        ...user,
        credits: credits,
      });
    }
  };

  return (
    <UserContext.Provider value={{ user, refreshUser, updateCredits }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};