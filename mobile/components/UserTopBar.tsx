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

  const getPlanDisplay = () => {
    if (!user) return 'Loading...';

    if (user.subscriptionType && user.subscriptionExpires) {
      const now = new Date();
      const expires = new Date(user.subscriptionExpires);
      if (expires > now) {
        return user.subscriptionType.toUpperCase();
      }
    }

    if (user.credits > 0) {
      return `${user.credits} credits`;
    }

    // For free users, show remaining daily usage
    if (user.remainingToday > 0) {
      return `${user.remainingToday} left today`;
    }

    return 'Free Plan';
  };

  const getPlanColor = () => {
    if (!user) return '#8E8E93';

    if (user.subscriptionType && user.subscriptionExpires) {
      const now = new Date();
      const expires = new Date(user.subscriptionExpires);
      if (expires > now) {
        return '#FFD700'; // Gold for premium
      }
    }

    if (user.credits > 0) {
      return '#007AFF'; // Blue for credits
    }

    // For free users with remaining daily usage, use green
    if (user.remainingToday > 0) {
      return '#34C759'; // Green for remaining usage
    }

    return '#8E8E93'; // Gray for free tier
  };

  const handlePlanPress = () => {
    navigation.navigate('Purchase');
  };

  return (
    <View style={styles.container}>
      {/* Status bar is handled by SafeAreaView in parent */}

      <View style={styles.titleSection}>
        <View style={styles.titleContainer}>
          <View style={styles.titleTextContainer}>
            <View style={styles.planRow}>
              <Text style={styles.planText}>
                {user && user.subscriptionType && user.subscriptionExpires ? (
                  <Ionicons name="star" size={14} color={getPlanColor()} />
                ) : user && user.credits > 0 ? (
                  <Ionicons name="card" size={14} color={getPlanColor()} />
                ) : user && user.remainingToday > 0 ? (
                  <Ionicons name="time" size={14} color={getPlanColor()} />
                ) : (
                  <Ionicons name="person" size={14} color={getPlanColor()} />
                )}
                {' '}
                <Text
                  style={[
                    styles.planText,
                    { color: getPlanColor() }
                  ]}
                >
                  {getPlanDisplay()}
                </Text>
              </Text>
              <TouchableOpacity
                style={styles.buyMoreButton}
                onPress={() => navigation.navigate('Purchase')}
              >
                <Text style={styles.buyMoreText}>Buy More</Text>
              </TouchableOpacity>
            </View>
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
  titleTextContainer: {
    flex: 1,
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planText: {
    fontSize: 14,
    fontWeight: '600',
    flexDirection: 'row',
    alignItems: 'center',
  },
  buyMoreButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 12,
  },
  buyMoreText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});