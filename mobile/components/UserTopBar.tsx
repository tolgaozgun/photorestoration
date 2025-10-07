import * as React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  StatusBar,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../contexts/UserContext';
import { useTranslation } from 'react-i18next';
import { colors } from '../theme';

export default function UserTopBar() {
  const { user, refreshUser } = useUser();
  const navigation = useNavigation();
  const { t } = useTranslation();

  const getPlanDisplay = () => {
    if (!user) return 'Loading...';

    if (user.subscriptionType && user.subscriptionExpires) {
      const now = new Date();
      const expires = new Date(user.subscriptionExpires);
      if (expires > now) {
        return `⭐ ${user.subscriptionType.toUpperCase()}`;
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
    if (!user) return colors.text.secondary;

    if (user.subscriptionType && user.subscriptionExpires) {
      const now = new Date();
      const expires = new Date(user.subscriptionExpires);
      if (expires > now) {
        return colors.accent.gold;
      }
    }

    if (user.credits > 0) {
      return colors.accent.blue;
    }

    // For free users with remaining daily usage, use green
    if (user.remainingToday > 0) {
      return colors.interactive.success;
    }

    return colors.text.secondary;
  };

  const handlePlanPress = () => {
    navigation.navigate('Purchase');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.content}>
        <TouchableOpacity
          style={styles.planContainer}
          onPress={handlePlanPress}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.planText,
              { color: getPlanColor() }
            ]}
            numberOfLines={1}
          >
            {getPlanDisplay()}
          </Text>
          <Text style={styles.planLabel}>
            {user?.subscriptionType ? 'SUBSCRIPTION' : 'CREDITS'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={refreshUser}
          activeOpacity={0.6}
        >
          <Text style={styles.refreshIcon}>🔄</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    zIndex: 1000,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 24,
    paddingBottom: 8,
    minHeight: Platform.OS === 'ios' ? 88 : 64,
  },
  planContainer: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  planText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 2,
  },
  planLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshIcon: {
    fontSize: 16,
  },
});