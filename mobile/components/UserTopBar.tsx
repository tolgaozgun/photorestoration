import * as React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../contexts/UserContext';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';

export default function UserTopBar() {
  const { user, refreshUser } = useUser();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [lastRefresh, setLastRefresh] = React.useState(0);

  // Auto-refresh when screen comes into focus, but with aggressive rate limiting
  useFocusEffect(
    React.useCallback(() => {
      const now = Date.now();
      // Only refresh if it's been more than 2 minutes since last refresh
      if (now - lastRefresh > 2 * 60 * 1000) {
        refreshUser();
        setLastRefresh(now);
      }

      // Set up periodic refresh every 5 minutes when screen is focused
      const interval = setInterval(() => {
        refreshUser();
        setLastRefresh(Date.now());
      }, 5 * 60 * 1000); // 5 minutes

      return () => clearInterval(interval);
    }, [refreshUser, lastRefresh])
  );

  const getSubscriptionDisplay = () => {
    if (!user) return 'Loading...';

    if (user.subscriptionType && user.subscriptionExpires) {
      const now = new Date();
      const expires = new Date(user.subscriptionExpires);
      if (expires > now) {
        return user.subscriptionType.toUpperCase();
      }
    }

    return 'FREE PLAN';
  };

  const getCreditsDisplay = () => {
    if (!user) return 'Loading...';

    if (user.credits > 0) {
      return `${user.credits} credits`;
    }

    // For free users, show remaining daily usage
    if (user.remainingToday > 0) {
      return `${user.remainingToday} left`;
    }

    return '0 credits';
  };

  const getSubscriptionColor = () => {
    if (!user) return '#8E8E93';

    if (user.subscriptionType && user.subscriptionExpires) {
      const now = new Date();
      const expires = new Date(user.subscriptionExpires);
      if (expires > now) {
        return '#FFD700'; // Gold for premium
      }
    }

    return '#8E8E93'; // Gray for free tier
  };

  const getCreditsColor = () => {
    if (!user) return '#8E8E93';

    if (user.credits > 0) {
      return '#007AFF'; // Blue for credits
    }

    // For free users with remaining daily usage, use green
    if (user.remainingToday > 0) {
      return '#34C759'; // Green for remaining usage
    }

    return '#8E8E93'; // Gray for no credits
  };

  const handlePlanPress = () => {
    navigation.navigate('Purchase');
  };

  return (
    <View style={styles.container}>
      {/* Status bar is handled by SafeAreaView in parent */}

      <View style={styles.titleSection}>
        <View style={styles.titleContainer}>
          {/* Left side - Subscription Plan */}
          <View style={styles.planSection}>
            <View style={styles.planInfo}>
              <Ionicons
                name={user && user.subscriptionType && user.subscriptionExpires ? "star" : "person"}
                size={14}
                color={getSubscriptionColor()}
              />
              <Text style={[styles.planText, { color: getSubscriptionColor() }]}>
                {getSubscriptionDisplay()}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.getPlanButton}
              onPress={() => navigation.navigate('Purchase')}
            >
              <Text style={styles.buttonText}>GET PLAN</Text>
            </TouchableOpacity>
          </View>

          {/* Right side - Credits */}
          <View style={styles.creditsSection}>
            <View style={styles.creditsInfo}>
              <Ionicons
                name={user && user.credits > 0 ? "card" : "time"}
                size={14}
                color={getCreditsColor()}
              />
              <Text style={[styles.creditsText, { color: getCreditsColor() }]}>
                {getCreditsDisplay()}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.getCreditsButton}
              onPress={() => navigation.navigate('Purchase')}
            >
              <Text style={styles.buttonText}>GET CREDITS</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000000',
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C1E',
  },
  titleSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  // Plan section (left side)
  planSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
    marginRight: 8,
  },
  planInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  planText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  getPlanButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },

  // Credits section (right side)
  creditsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
    marginLeft: 8,
  },
  creditsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  creditsText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  getCreditsButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },

  // Shared button styles
  buttonText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});