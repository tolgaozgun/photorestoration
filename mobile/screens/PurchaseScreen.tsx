import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import { useTranslation } from 'react-i18next';
import { useAnalytics } from '../contexts/AnalyticsContext';
import { useUser } from '../contexts/UserContext';
import * as Haptics from 'expo-haptics';
import * as SecureStore from 'expo-secure-store';

type PurchaseScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Purchase'>;

interface Props {
  navigation: PurchaseScreenNavigationProp;
}

interface PricingTier {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  popular?: boolean;
  trialDays?: number;
  originalPrice?: string;
  discount?: string;
}

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: string;
  description: string;
  features: string[];
  bestValue?: boolean;
  bonus?: string;
}

export default function PurchaseScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { trackEvent } = useAnalytics();
  const { user, refreshUser, forceRefreshUser } = useUser();
  const [selectedTab, setSelectedTab] = React.useState<'subscriptions' | 'credits'>('subscriptions');

  const pricingTiers: PricingTier[] = [
    {
      id: 'monthly',
      name: 'Monthly',
      price: '$4.99',
      period: '/month',
      description: 'Perfect for casual users',
      features: [
        'Unlimited enhancements',
        'HD quality results',
        'Priority processing',
        'All AI features',
        'No watermarks'
      ],
      trialDays: 7
    },
    {
      id: 'quarterly',
      name: 'Quarterly',
      price: '$12.99',
      period: '/3 months',
      description: 'Save 13% with quarterly billing',
      features: [
        'Everything in Monthly',
        'Advanced AI models',
        'Batch processing',
        'Faster processing',
        'Export in multiple formats'
      ],
      originalPrice: '$14.97',
      discount: 'Save 13%',
      popular: true
    },
    {
      id: 'yearly',
      name: 'Annual',
      price: '$39.99',
      period: '/year',
      description: 'Best value - Save 33%',
      features: [
        'Everything in Quarterly',
        'Ultra HD quality',
        'API access',
        'Priority support',
        'Early access to new features'
      ],
      originalPrice: '$59.88',
      discount: 'Save 33%'
    }
  ];

  const creditPackages: CreditPackage[] = [
    {
      id: 'starter',
      name: 'Starter Pack',
      credits: 10,
      price: '$2.99',
      description: 'Perfect for trying out features',
      features: [
        '10 enhancements',
        'HD quality',
        'No watermarks',
        'Valid for 30 days'
      ]
    },
    {
      id: 'popular',
      name: 'Popular Pack',
      credits: 50,
      price: '$9.99',
      description: 'Most popular choice',
      features: [
        '50 enhancements',
        'HD quality',
        'No watermarks',
        'Valid for 60 days'
      ],
      bestValue: true,
      bonus: '+5 bonus credits'
    },
    {
      id: 'professional',
      name: 'Professional Pack',
      credits: 100,
      price: '$16.99',
      description: 'Best value for power users',
      features: [
        '100 enhancements',
        'HD quality',
        'No watermarks',
        'Valid for 90 days'
      ],
      originalPrice: '$19.99',
      discount: 'Save 15%',
      bonus: '+20 bonus credits'
    }
  ];

  const handleSubscriptionPurchase = async (tier: PricingTier) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    trackEvent('purchase_action', { type: 'subscription', tier: tier.id });

    if (tier.trialDays) {
      // Start free trial flow
      navigation.navigate('FreeTrial', {
        tierId: tier.id,
        trialDays: tier.trialDays,
        price: tier.price,
        period: tier.period
      });
    } else {
      Alert.alert(
        'Subscribe Now',
        `Start your ${tier.name} subscription for ${tier.price}${tier.period}`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Subscribe',
            style: 'default',
            onPress: () => {
              // In a real app, this would integrate with payment system
              Alert.alert('Success!', `${tier.name} subscription activated!`);
              forceRefreshUser();
            }
          }
        ]
      );
    }
  };

  const handleCreditPurchase = (pack: CreditPackage) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    trackEvent('purchase_action', { type: 'credits', package: pack.id });

    Alert.alert(
      'Purchase Credits',
      `Get ${pack.credits} credits for ${pack.price}${pack.bonus ? ` ${pack.bonus}` : ''}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Buy Now',
          style: 'default',
          onPress: () => {
            // In a real app, this would integrate with payment system
            Alert.alert('Success!', `${pack.credits} credits added to your account!`);
            forceRefreshUser();
          }
        }
      ]
    );
  };

  const renderPricingCard = (tier: PricingTier) => (
    <TouchableOpacity
      key={tier.id}
      style={[
        styles.pricingCard,
        tier.popular && styles.popularCard
      ]}
      onPress={() => handleSubscriptionPurchase(tier)}
      activeOpacity={0.8}
    >
      {tier.popular && (
        <View style={styles.popularBadge}>
          <Text style={styles.popularBadgeText}>Most Popular</Text>
        </View>
      )}

      <View style={styles.cardHeader}>
        <Text style={styles.cardName}>{tier.name}</Text>
        <View style={styles.priceContainer}>
          {tier.originalPrice && (
            <Text style={styles.originalPrice}>{tier.originalPrice}</Text>
          )}
          <Text style={styles.price}>{tier.price}</Text>
          <Text style={styles.period}>{tier.period}</Text>
        </View>
      </View>

      <Text style={styles.cardDescription}>{tier.description}</Text>

      {tier.trialDays && (
        <View style={styles.trialBadge}>
          <Ionicons name="gift" size={14} color="#FFD700" />
          <Text style={styles.trialText}>{tier.trialDays}-day free trial</Text>
        </View>
      )}

      {tier.discount && (
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>{tier.discount}</Text>
        </View>
      )}

      <View style={styles.featuresList}>
        {tier.features.map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={16} color="#34C759" />
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.subscribeButton}>
        <Text style={styles.subscribeButtonText}>
          {tier.trialDays ? 'Start Free Trial' : 'Subscribe Now'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderCreditCard = (pack: CreditPackage) => (
    <TouchableOpacity
      key={pack.id}
      style={[
        styles.pricingCard,
        pack.bestValue && styles.popularCard
      ]}
      onPress={() => handleCreditPurchase(pack)}
      activeOpacity={0.8}
    >
      {pack.bestValue && (
        <View style={styles.popularBadge}>
          <Text style={styles.popularBadgeText}>Best Value</Text>
        </View>
      )}

      <View style={styles.cardHeader}>
        <Text style={styles.cardName}>{pack.name}</Text>
        <View style={styles.priceContainer}>
          {pack.originalPrice && (
            <Text style={styles.originalPrice}>{pack.originalPrice}</Text>
          )}
          <Text style={styles.price}>{pack.price}</Text>
        </View>
      </View>

      <Text style={styles.cardDescription}>{pack.description}</Text>

      <View style={styles.creditsBadge}>
        <Ionicons name="card" size={16} color="#007AFF" />
        <Text style={styles.creditsText}>{pack.credits} credits</Text>
      </View>

      {pack.bonus && (
        <View style={styles.bonusBadge}>
          <Ionicons name="gift" size={14} color="#FF3B30" />
          <Text style={styles.bonusText}>{pack.bonus}</Text>
        </View>
      )}

      {pack.discount && (
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>{pack.discount}</Text>
        </View>
      )}

      <View style={styles.featuresList}>
        {pack.features.map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={16} color="#34C759" />
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.subscribeButton}>
        <Text style={styles.subscribeButtonText}>Buy Now</Text>
      </TouchableOpacity>
    </TouchableOpacity>
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
            <Text style={styles.screenTitle}>Get More Credits</Text>
            <Text style={styles.screenSubtitle}>Unlock unlimited possibilities</Text>
          </View>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'subscriptions' && styles.activeTab]}
          onPress={() => setSelectedTab('subscriptions')}
        >
          <Text style={[styles.tabText, selectedTab === 'subscriptions' && styles.activeTabText]}>
            Subscriptions
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'credits' && styles.activeTab]}
          onPress={() => setSelectedTab('credits')}
        >
          <Text style={[styles.tabText, selectedTab === 'credits' && styles.activeTabText]}>
            Credit Packs
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {selectedTab === 'subscriptions' ? (
          <>
            <Text style={styles.sectionTitle}>Choose Your Plan</Text>
            {pricingTiers.map(renderPricingCard)}

            {/* Trust Badges */}
            <View style={styles.trustSection}>
              <Text style={styles.trustTitle}>Why choose our premium plan?</Text>
              <View style={styles.trustBadges}>
                <View style={styles.trustBadge}>
                  <Ionicons name="shield-checkmark" size={24} color="#34C759" />
                  <Text style={styles.trustBadgeText}>Secure Payment</Text>
                </View>
                <View style={styles.trustBadge}>
                  <Ionicons name="close-circle" size={24} color="#34C759" />
                  <Text style={styles.trustBadgeText}>Cancel Anytime</Text>
                </View>
                <View style={styles.trustBadge}>
                  <Ionicons name="headset" size={24} color="#34C759" />
                  <Text style={styles.trustBadgeText}>24/7 Support</Text>
                </View>
              </View>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Credit Packages</Text>
            {creditPackages.map(renderCreditCard)}

            {/* Current Status */}
            {user && (
              <View style={styles.currentStatus}>
                <Text style={styles.currentStatusTitle}>Your Current Balance</Text>
                <View style={styles.balanceCard}>
                  <Ionicons name="wallet" size={32} color="#007AFF" />
                  <Text style={styles.balanceText}>{user.credits || 0} credits</Text>
                  {user.remainingToday !== undefined && (
                    <Text style={styles.dailyLimitText}>
                      {user.remainingToday} remaining today
                    </Text>
                  )}
                </View>
              </View>
            )}
          </>
        )}

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

  // Tab Styles
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#FF3B30',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
  },
  activeTabText: {
    color: '#FFFFFF',
  },

  // Content Styles
  content: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },

  // Pricing Card Styles
  pricingCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  popularCard: {
    borderColor: '#FF3B30',
    borderWidth: 2,
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    left: 20,
    backgroundColor: '#FF3B30',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularBadgeText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  originalPrice: {
    fontSize: 14,
    color: '#8E8E93',
    textDecorationLine: 'line-through',
    marginRight: 4,
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  period: {
    fontSize: 14,
    color: '#8E8E93',
    marginLeft: 2,
  },
  cardDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 12,
  },
  trialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  trialText: {
    fontSize: 12,
    color: '#FFD700',
    fontWeight: '600',
    marginLeft: 4,
  },
  discountBadge: {
    backgroundColor: '#34C759',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  discountText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  creditsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  creditsText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
    marginLeft: 4,
  },
  bonusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  bonusText: {
    fontSize: 12,
    color: '#FF3B30',
    fontWeight: '600',
    marginLeft: 4,
  },
  featuresList: {
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 8,
  },
  subscribeButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  subscribeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Trust Section
  trustSection: {
    marginTop: 32,
    marginBottom: 32,
  },
  trustTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  trustBadges: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  trustBadge: {
    alignItems: 'center',
  },
  trustBadgeText: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
    textAlign: 'center',
  },

  // Current Status
  currentStatus: {
    marginTop: 32,
    marginBottom: 32,
  },
  currentStatusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  balanceCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  balanceText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    marginTop: 8,
  },
  dailyLimitText: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },

  // Utility
  bottomSpacing: {
    height: 80,
  },
});