import React, { useState, useRef, useEffect } from 'react';
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
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '../contexts/UserContext';
import { useAnalytics } from '../contexts/AnalyticsContext';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';

import { useTranslation } from 'react-i18next';

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
          <Text style={styles.headerTitle}>{t('settings.title')}</Text>
        </Animated.View>

        {/* User Section */}
        <Animated.View 
          style={[
            styles.section,
            { opacity: fadeAnim },
          ]}
        >
          <Text style={styles.sectionTitle}>{t('profile.account')}</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="🔑"
              title={t('settings.yourUniqueId')}
              subtitle={userId ? `${userId.substring(0, 8)}...` : t('common.loading')}
              onPress={copyUserId}
            />
            <SettingItem
              icon="☁️"
              title={t('settings.syncAcrossDevices')}
              subtitle={linkedEmail ? t('settings.syncedTo', { email: linkedEmail }) : t('settings.syncYourHistory')}
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
          <Text style={styles.sectionTitle}>{t('settings.purchases')}</Text>
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
              title={t('settings.getMoreCredits')}
              subtitle={t('settings.getMoreCreditsSubtitle')}
              onPress={() => {
                trackEvent('settings_action', { type: 'get_credits_settings' });
                Alert.alert(t('purchase.title'), t('purchase.comingSoonMessage'));
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
          <Text style={styles.sectionTitle}>{t('settings.legal')}</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="📄"
              title={t('settings.terms')}
              onPress={openTerms}
            />
            <SettingItem
              icon="🔒"
              title={t('settings.privacy')}
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
          <Text style={styles.sectionTitle}>{t('settings.support')}</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="💬"
              title={t('settings.contactSupport')}
              subtitle={t('settings.contactSupportSubtitle')}
              onPress={contactSupport}
            />
            <SettingItem
              icon="⭐"
              title={t('settings.rateApp')}
              subtitle={t('settings.rateAppSubtitle')}
              onPress={() => {
                trackEvent('settings_action', { type: 'rate_app' });
                // Platform-specific app store links
                const url = Platform.OS === 'ios' 
                  ? 'https://apps.apple.com/app/id...' 
                  : 'https://play.google.com/store/apps/details?id=...';
                Linking.openURL(url);
              }}
            />
          </View>
        </Animated.View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appVersion}>{t('settings.version')}</Text>
          <Text style={styles.appCopyright}>{t('settings.copyright')}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
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
    fontSize: 34,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.5,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  sectionContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 13,
    color: '#888',
  },
  settingArrow: {
    fontSize: 24,
    color: '#888',
  },
  appInfo: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  appVersion: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  appCopyright: {
    fontSize: 12,
    color: '#555',
  },
});