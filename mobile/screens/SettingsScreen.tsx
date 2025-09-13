import * as React from 'react'
import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
  Platform,
  Linking,
  Switch,
  SafeAreaView,
  TextStyle,
  Dimensions,
  Share,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '../contexts/UserContext';
import { useAnalytics } from '../contexts/AnalyticsContext';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';

import { useTranslation } from 'react-i18next';
import { colors, spacing, borderRadius, typography, shadows } from '../theme';

const { width: screenWidth } = Dimensions.get('window');

type SettingsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Settings'>;

export default function SettingsScreen() {
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const { t } = useTranslation();
  const { user, refreshUser } = useUser();
  const { trackEvent } = useAnalytics();
  const [userId, setUserId] = useState<string>('');
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [linkedEmail, setLinkedEmail] = useState<string | null>(null);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    loadUserId();
    loadSyncSettings();
    
    // Entry animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        delay: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const loadUserId = async () => {
    try {
      const id = await SecureStore.getItemAsync('userId');
      if (id) setUserId(id);
    } catch (error) {
      console.error('Error loading user ID:', error);
    }
  };

  const loadSyncSettings = async () => {
    try {
      // Check if email is linked
      const email = await SecureStore.getItemAsync('linkedEmail');
      if (email) {
        setLinkedEmail(email);
        setSyncEnabled(true);
      }
    } catch (error) {
      console.error('Error loading sync settings:', error);
    }
  };

  const handleRestorePurchases = async () => {
    trackEvent('settings_action', { type: 'restore_purchases' });
    Alert.alert(
      t('settings.restorePurchasesAlertTitle'),
      t('settings.restorePurchasesAlertMessage'),
      [
        { text: t('restoration.cancel'), style: 'cancel' },
        {
          text: t('settings.restore'),
          onPress: () => {
            // TODO: Implement IAP restore
            Alert.alert(t('settings.success'), t('settings.purchasesRestored'));
          },
        },
      ]
    );
  };

  const handleSyncToggle = async (value: boolean) => {
    trackEvent('settings_action', { type: 'sync_toggle', value });
    
    if (value && !linkedEmail) {
      // Navigate to email sync screen
      navigation.navigate('EmailSync');
    } else if (!value && linkedEmail) {
      // Show confirmation to unlink
      Alert.alert(
        t('settings.disableSyncTitle'),
        t('settings.disableSyncMessage'),
        [
          { text: t('restoration.cancel'), style: 'cancel' },
          {
            text: t('settings.disable'),
            style: 'destructive',
            onPress: async () => {
              await SecureStore.deleteItemAsync('linkedEmail');
              setLinkedEmail(null);
              setSyncEnabled(false);
            },
          },
        ]
      );
    }
  };

  const copyUserId = () => {
    // Note: React Native doesn't have built-in clipboard, would need expo-clipboard
    Alert.alert(t('settings.userIdTitle'), t('settings.userIdMessage', { userId }));
    trackEvent('settings_action', { type: 'copy_user_id' });
  };

  const openTerms = () => {
    trackEvent('settings_action', { type: 'open_terms' });
    Linking.openURL('https://example.com/terms'); // Replace with actual URL
  };

  const openPrivacy = () => {
    trackEvent('settings_action', { type: 'open_privacy' });
    Linking.openURL('https://example.com/privacy'); // Replace with actual URL
  };

  const contactSupport = () => {
    trackEvent('settings_action', { type: 'contact_support' });
    Linking.openURL('mailto:support@photorestoration.app');
  };

  const handleShareApp = async () => {
    try {
      await Share.share({
        message: 'Check out this amazing photo restoration app!',
        url: 'https://example.com', // Replace with actual app URL
      });
    } catch (error) {
      console.error('Error sharing app:', error);
    }
  };

  const renderPremiumSection = () => (
    <View style={styles.premiumSection}>
      <View style={styles.premiumCard}>
        {/* Crown Illustration */}
        <View style={styles.crownContainer}>
          <Text style={styles.crownIcon}>👑</Text>
        </View>
        
        <Text style={styles.premiumTitle}>Go Pro</Text>
        <Text style={styles.premiumSubtitle}>Unlock all premium features</Text>
        
        {/* Feature List */}
        <View style={styles.featureList}>
          <View style={styles.featureItem}>
            <Text style={styles.featureCheck}>✓</Text>
            <Text style={styles.featureText}>Unlimited AI generations</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureCheck}>✓</Text>
            <Text style={styles.featureText}>HD quality outputs</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureCheck}>✓</Text>
            <Text style={styles.featureText}>Priority processing</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureCheck}>✓</Text>
            <Text style={styles.featureText}>All premium filters</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureCheck}>✓</Text>
            <Text style={styles.featureText}>No watermarks</Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.tryProButton}
          onPress={() => navigation.navigate('Purchase')}
        >
          <Text style={styles.tryProButtonText}>Try Pro Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const SettingItem = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    showArrow = true,
    rightElement 
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    showArrow?: boolean;
    rightElement?: React.ReactNode;
  }) => (
    <TouchableOpacity 
      style={styles.settingItem}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <View style={styles.settingItemLeft}>
        <Text style={styles.settingIcon}>{icon}</Text>
        <View style={styles.settingTextContainer}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {rightElement || (showArrow && onPress && (
        <Text style={styles.settingArrow}>›</Text>
      ))}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Background gradient */}
      <LinearGradient
        colors={['#1a0f1f', '#2a1a3a', '#1a0f1f']}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View 
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.headerTitle}>Settings</Text>
        </Animated.View>

        {/* Premium Section */}
        {renderPremiumSection()}

        {/* User Section */}
        <Animated.View 
          style={[
            styles.section,
            { opacity: fadeAnim },
          ]}
        >
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="🔑"
              title="Your Unique ID"
              subtitle={userId ? `${userId.substring(0, 8)}...` : 'Loading...'}
              onPress={copyUserId}
            />
            <SettingItem
              icon="☁️"
              title="Sync Across Devices"
              subtitle={linkedEmail ? `Synced to ${linkedEmail}` : 'Sync your history'}
              rightElement={
                <Switch
                  value={syncEnabled}
                  onValueChange={handleSyncToggle}
                  trackColor={{ false: '#3a3a3a', true: '#FF6B6B' }}
                  thumbColor="#fff"
                />
              }
            />
            {linkedEmail && (
              <SettingItem
                icon="📧"
                title={t('settings.manageDevices')}
                subtitle={t('settings.manageDevicesSubtitle')}
                onPress={() => navigation.navigate('EmailSync')}
              />
            )}
          </View>
        </Animated.View>

        {/* Purchases Section */}
        <Animated.View 
          style={[
            styles.section,
            { 
              opacity: fadeAnim,
              transform: [{ translateY: Animated.multiply(slideAnim, 0.8) }],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>Purchases</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="🔄"
              title={t('settings.restorePurchases')}
              subtitle={t('settings.restorePurchasesSubtitle')}
              onPress={handleRestorePurchases}
            />
            <SettingItem
              icon="📱"
              title={t('settings.purchaseHistory')}
              subtitle={t('settings.purchaseHistorySubtitle')}
              onPress={() => {
                trackEvent('settings_action', { type: 'view_purchase_history' });
                Alert.alert(t('settings.purchaseHistory'), t('settings.noPurchasesFound'));
              }}
            />
            <SettingItem
              icon="💎"
              title="Get More Credits"
              subtitle="Purchase additional credits"
              onPress={() => {
                trackEvent('settings_action', { type: 'get_credits_settings' });
                navigation.navigate('Purchase');
              }}
            />
          </View>
        </Animated.View>

        {/* Legal Section */}
        <Animated.View 
          style={[
            styles.section,
            { 
              opacity: fadeAnim,
              transform: [{ translateY: Animated.multiply(slideAnim, 0.6) }],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>Legal</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="📄"
              title="Terms of Service"
              onPress={openTerms}
            />
            <SettingItem
              icon="🔒"
              title="Privacy Policy"
              onPress={openPrivacy}
            />
          </View>
        </Animated.View>

        {/* Support Section */}
        <Animated.View 
          style={[
            styles.section,
            { 
              opacity: fadeAnim,
              transform: [{ translateY: Animated.multiply(slideAnim, 0.4) }],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="💬"
              title="Contact Support"
              subtitle="Get help with the app"
              onPress={contactSupport}
            />
            <SettingItem
              icon="⭐"
              title="Rate App"
              subtitle="Share your feedback"
              onPress={() => {
                trackEvent('settings_action', { type: 'rate_app' });
                const url = Platform.OS === 'ios' 
                  ? 'https://apps.apple.com/app/id...' 
                  : 'https://play.google.com/store/apps/details?id=...';
                Linking.openURL(url);
              }}
            />
            <SettingItem
              icon="📤"
              title="Share App"
              subtitle="Tell friends about us"
              onPress={handleShareApp}
            />
          </View>
        </Animated.View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
          <Text style={styles.appCopyright}>© 2024 Photo Restoration App</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: typography.fontSize['6xl'],
    fontWeight: typography.fontWeight.bold as TextStyle['fontWeight'],
    color: colors.text.primary,
    letterSpacing: typography.letterSpacing.tight,
    textAlign: 'center',
  },
  premiumSection: {
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  premiumCard: {
    backgroundColor: colors.text.inverse,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadows.xl,
  },
  crownContainer: {
    marginBottom: spacing.lg,
  },
  crownIcon: {
    fontSize: 64,
  },
  premiumTitle: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold as TextStyle['fontWeight'],
    color: '#000000',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  premiumSubtitle: {
    fontSize: typography.fontSize.lg,
    color: '#666666',
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  featureList: {
    width: '100%',
    marginBottom: spacing.xl,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  featureCheck: {
    fontSize: typography.fontSize.lg,
    color: '#4CAF50',
    marginRight: spacing.md,
    fontWeight: 'bold',
  },
  featureText: {
    fontSize: typography.fontSize.base,
    color: '#333333',
    flex: 1,
  },
  tryProButton: {
    backgroundColor: colors.accent.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    width: '100%',
    alignItems: 'center',
  },
  tryProButtonText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold as TextStyle['fontWeight'],
    color: '#FFFFFF',
  },
  section: {
    marginTop: spacing['3xl'],
    paddingHorizontal: spacing.xlLegacy,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold as TextStyle['fontWeight'],
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.wide,
    marginBottom: spacing.lg,
    marginLeft: spacing.sm,
  },
  sectionContent: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.xlLegacy,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.xlLegacy,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.borderSecondary,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    fontSize: typography.fontSize['3xl'],
    marginRight: spacing.xlLegacy,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.medium as TextStyle['fontWeight'],
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  settingSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.muted,
  },
  settingArrow: {
    fontSize: typography.fontSize['3xl'],
    color: colors.text.muted,
  },
  appInfo: {
    alignItems: 'center',
    marginTop: spacing['5xl'],
    marginBottom: spacing['3xl'],
  },
  appVersion: {
    fontSize: typography.fontSize.lg,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  appCopyright: {
    fontSize: typography.fontSize.base,
    color: colors.text.tertiary,
  },
});