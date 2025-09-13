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
  StatusBar,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useUser } from '../contexts/UserContext';
import { useAnalytics } from '../contexts/AnalyticsContext';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';

import { useTranslation } from 'react-i18next';

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

  const renderUserSection = () => (
    <View style={styles.userSection}>
      <View style={styles.userCard}>
        <View style={styles.userIconContainer}>
          <Text style={styles.userIcon}>👤</Text>
        </View>
        {linkedEmail ? (
          <View style={styles.userInfo}>
            <Text style={styles.userEmail}>{linkedEmail}</Text>
            <Text style={styles.userStatus}>Signed in</Text>
          </View>
        ) : (
          <View style={styles.userInfo}>
            <Text style={styles.userStatus}>Not signed in</Text>
            <Text style={styles.userSubtitle}>Sign in to sync across devices</Text>
          </View>
        )}
      </View>
    </View>
  );

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
    rightElement,
    disabled = false
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    showArrow?: boolean;
    rightElement?: React.ReactNode;
    disabled?: boolean;
  }) => (
    <TouchableOpacity
      style={[
        styles.settingItem,
        disabled && styles.settingItemDisabled
      ]}
      onPress={onPress}
      activeOpacity={onPress && !disabled ? 0.7 : 1}
      disabled={disabled || !onPress}
    >
      <View style={styles.settingItemLeft}>
        <Text style={styles.settingIcon}>{icon}</Text>
        <View style={styles.settingTextContainer}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {rightElement || (showArrow && onPress && !disabled && (
        <Text style={styles.settingArrow}>›</Text>
      ))}
    </TouchableOpacity>
  );

  const handleBackPress = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" />

      {/* Screen Title */}
      <View style={styles.titleSection}>
        <View style={styles.titleContainer}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={styles.titleTextContainer}>
            <Text style={styles.screenTitle}>Settings</Text>
            <Text style={styles.screenSubtitle}>Manage your preferences</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* User Section */}
        {renderUserSection()}

        {/* Premium Section */}
        {renderPremiumSection()}

        {/* Sync Section */}
        <Animated.View
          style={[
            styles.section,
            { opacity: fadeAnim },
          ]}
        >
          <Text style={styles.sectionTitle}>Sync</Text>
          <View style={styles.sectionContent}>
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
            <SettingItem
              icon="📧"
              title="Manage Devices"
              subtitle={linkedEmail ? 'View and manage connected devices' : 'Sign in to manage devices'}
              onPress={linkedEmail ? () => navigation.navigate('EmailSync') : undefined}
              disabled={!linkedEmail}
            />
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
    backgroundColor: '#000000',
  },

  // Title Section Styles
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
    marginRight: 16,
  },
  backIcon: {
    fontSize: 24,
    color: '#FFFFFF',
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
    paddingBottom: 100,
  },
  premiumSection: {
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 32,
  },
  premiumCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3A3A3C',
  },
  crownContainer: {
    marginBottom: 24,
  },
  crownIcon: {
    fontSize: 64,
  },
  premiumTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  premiumSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 24,
    textAlign: 'center',
  },
  featureList: {
    width: '100%',
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureCheck: {
    fontSize: 18,
    color: '#4CAF50',
    marginRight: 16,
    fontWeight: 'bold',
  },
  featureText: {
    fontSize: 16,
    color: '#FFFFFF',
    flex: 1,
  },
  tryProButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  tryProButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  section: {
    marginTop: 32,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
    marginLeft: 4,
  },
  sectionContent: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#3A3A3C',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A3C',
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    fontSize: 24,
    marginRight: 24,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
  },
  settingArrow: {
    fontSize: 24,
    color: '#8E8E93',
  },
  settingItemDisabled: {
    opacity: 0.5,
  },
  appInfo: {
    alignItems: 'center',
    marginTop: 80,
    marginBottom: 48,
  },
  appVersion: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 8,
  },
  appCopyright: {
    fontSize: 14,
    color: '#666666',
  },

  // User Section Styles
  userSection: {
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 32,
  },
  userCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#3A3A3C',
    flexDirection: 'row',
    alignItems: 'center',
  },
  userIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2C2C2E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  userIcon: {
    fontSize: 32,
  },
  userInfo: {
    flex: 1,
  },
  userEmail: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  userStatus: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 2,
  },
  userSubtitle: {
    fontSize: 14,
    color: '#666666',
  },
});