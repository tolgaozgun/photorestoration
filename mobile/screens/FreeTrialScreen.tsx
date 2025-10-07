import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import { useTranslation } from 'react-i18next';
import { useAnalytics } from '../contexts/AnalyticsContext';
import { useUser } from '../contexts/UserContext';
import * as Haptics from 'expo-haptics';
import * as SecureStore from 'expo-secure-store';

type FreeTrialScreenNavigationProp = StackNavigationProp<RootStackParamList, 'FreeTrial'>;

interface Props {
  route: {
    params: {
      tierId: string;
      trialDays: number;
      price: string;
      period: string;
    };
  };
  navigation: FreeTrialScreenNavigationProp;
}

interface TrialFeature {
  icon: string;
  title: string;
  description: string;
}

export default function FreeTrialScreen({ route, navigation }: Props) {
  const { tierId, trialDays, price, period } = route.params;
  const { t } = useTranslation();
  const { trackEvent } = useAnalytics();
  const { refreshUser, forceRefreshUser } = useUser();
  const [isLoading, setIsLoading] = React.useState(false);

  const trialFeatures: TrialFeature[] = [
    {
      icon: 'checkmark-circle',
      title: 'Unlimited Access',
      description: 'All premium features unlocked during trial'
    },
    {
      icon: 'checkmark-circle',
      title: 'No Watermarks',
      description: 'Clean, professional results'
    },
    {
      icon: 'checkmark-circle',
      title: 'HD Quality',
      description: 'Highest quality image enhancement'
    },
    {
      icon: 'checkmark-circle',
      title: 'Priority Processing',
      description: 'Faster results when you need them'
    },
    {
      icon: 'checkmark-circle',
      title: 'Cancel Anytime',
      description: 'No risk, cancel before trial ends'
    }
  ];

  const getTierName = () => {
    switch (tierId) {
      case 'monthly': return 'Monthly';
      case 'quarterly': return 'Quarterly';
      case 'yearly': return 'Annual';
      default: return 'Premium';
    }
  };

  const handleStartTrial = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    trackEvent('trial_start', { tierId, trialDays });

    setIsLoading(true);

    try {
      // Store trial information
      const trialStart = new Date().toISOString();
      const trialEnd = new Date(Date.now() + (trialDays * 24 * 60 * 60 * 1000)).toISOString();

      await SecureStore.setItemAsync('trialInfo', JSON.stringify({
        tierId,
        trialStart,
        trialEnd,
        price,
        period,
        reminderSent: false
      }));

      // Schedule reminder for day 5
      scheduleTrialReminder(trialDays);

      Alert.alert(
        '🎉 Trial Started!',
        `Your ${trialDays}-day free trial has begun!\n\nYou'll be charged ${price}${period} on ${new Date(trialEnd).toLocaleDateString()} unless you cancel.`,
        [
          { text: 'Got it!', style: 'default' }
        ]
      );

      forceRefreshUser();
      navigation.goBack();
    } catch (error) {
      console.error('Error starting trial:', error);
      Alert.alert('Error', 'Could not start trial. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const scheduleTrialReminder = (trialDays: number) => {
    // In a real app, this would use push notifications
    // For now, we'll store the reminder info to check in UserContext
    const reminderDate = new Date(Date.now() + (5 * 24 * 60 * 60 * 1000)); // Day 5

    SecureStore.setItemAsync('trialReminder', JSON.stringify({
      date: reminderDate.toISOString(),
      message: `Your free trial ends in 2 days! Continue enjoying unlimited access for just ${price}${period}.`
    }));
  };

  const handleViewTerms = () => {
    Linking.openURL('https://example.com/terms');
  };

  const renderFeatureItem = (feature: TrialFeature) => (
    <View key={feature.title} style={styles.featureItem}>
      <Ionicons name={feature.icon} size={24} color="#34C759" />
      <View style={styles.featureContent}>
        <Text style={styles.featureTitle}>{feature.title}</Text>
        <Text style={styles.featureDescription}>{feature.description}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Screen Title */}
      <View style={styles.titleSection}>
        <View style={styles.titleContainer}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.titleTextContainer}>
            <Text style={styles.screenTitle}>Start Free Trial</Text>
            <Text style={styles.screenSubtitle}>{getTierName()} • {trialDays} days free</Text>
          </View>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.trialBadge}>
            <Ionicons name="gift" size={20} color="#FFD700" />
            <Text style={styles.trialBadgeText}>FREE TRIAL</Text>
          </View>
          <Text style={styles.heroTitle}>
            Try {getTierName()}{'\n'}for {trialDays} Days
          </Text>
          <Text style={styles.heroSubtitle}>
            No credit card required • Cancel anytime
          </Text>
          <Text style={styles.heroPrice}>
            After trial: {price}
            <Text style={styles.heroPeriod}>{period}</Text>
          </Text>
        </View>

        {/* Features List */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>What you'll get:</Text>
          {trialFeatures.map(renderFeatureItem)}
        </View>

        {/* Reminder Notice */}
        <View style={styles.reminderSection}>
          <View style={styles.reminderCard}>
            <Ionicons name="notifications" size={24} color="#FFD700" />
            <View style={styles.reminderContent}>
              <Text style={styles.reminderTitle}>We'll remind you</Text>
              <Text style={styles.reminderText}>
                We'll send you a friendly reminder on day 5 before your trial ends, so you won't be surprised by the charge.
              </Text>
            </View>
          </View>
        </View>

        {/* Trust Section */}
        <View style={styles.trustSection}>
          <View style={styles.trustItem}>
            <Ionicons name="shield-checkmark" size={20} color="#34C759" />
            <Text style={styles.trustText}>Secure & Private</Text>
          </View>
          <View style={styles.trustItem}>
            <Ionicons name="close-circle" size={20} color="#34C759" />
            <Text style={styles.trustText}>Cancel Anytime</Text>
          </View>
          <View style={styles.trustItem}>
            <Ionicons name="headset" size={20} color="#34C759" />
            <Text style={styles.trustText}>24/7 Support</Text>
          </View>
        </View>

        {/* Terms */}
        <Text style={styles.termsText}>
          By starting your free trial, you agree to our{' '}
          <Text style={styles.termsLink} onPress={handleViewTerms}>
            Terms of Service
          </Text>
          {' '}and{' '}
          <Text style={styles.termsLink} onPress={() => Linking.openURL('https://example.com/privacy')}>
            Privacy Policy
          </Text>
        </Text>

        {/* CTA Button */}
        <TouchableOpacity
          style={[styles.startTrialButton, isLoading && styles.disabledButton]}
          onPress={handleStartTrial}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <View style={styles.loadingContent}>
              <Text style={styles.loadingText}>Starting Trial...</Text>
            </View>
          ) : (
            <View style={styles.buttonContent}>
              <Ionicons name="rocket" size={20} color="#FFFFFF" />
              <Text style={styles.startTrialButtonText}>
                Start {trialDays}-Day Free Trial
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Skip Option */}
        <TouchableOpacity style={styles.skipButton} onPress={() => navigation.goBack()}>
          <Text style={styles.skipText}>No thanks, I'll skip</Text>
        </TouchableOpacity>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },

  // Title Section Styles (matching History/Settings)
  titleSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  titleTextContainer: {
    flex: 1,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  screenSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
  },

  // Content Styles
  content: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    paddingHorizontal: 16,
  },

  // Hero Section
  heroSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  trialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  trialBadgeText: {
    fontSize: 12,
    color: '#FFD700',
    fontWeight: '700',
    marginLeft: 6,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 16,
  },
  heroPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8E8E93',
  },
  heroPeriod: {
    fontSize: 16,
    color: '#8E8E93',
  },

  // Features Section
  featuresSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    backgroundColor: '#1C1C1E',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  featureContent: {
    flex: 1,
    marginLeft: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#8E8E93',
  },

  // Reminder Section
  reminderSection: {
    marginBottom: 32,
  },
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  reminderContent: {
    flex: 1,
    marginLeft: 12,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFD700',
    marginBottom: 4,
  },
  reminderText: {
    fontSize: 14,
    color: '#8E8E93',
  },

  // Trust Section
  trustSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  trustItem: {
    alignItems: 'center',
  },
  trustText: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },

  // Terms
  termsText: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 18,
  },
  termsLink: {
    color: '#007AFF',
    textDecorationLine: 'underline',
  },

  // CTA Button
  startTrialButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  disabledButton: {
    backgroundColor: '#8E8E93',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  startTrialButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Skip Button
  skipButton: {
    alignItems: 'center',
    marginBottom: 32,
  },
  skipText: {
    fontSize: 16,
    color: '#8E8E93',
  },

  // Utility
  bottomSpacing: {
    height: 80,
  },
});