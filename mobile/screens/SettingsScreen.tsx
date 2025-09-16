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
import i18n from '../i18n';
import LanguageModal from '../components/LanguageModal';

const { width: screenWidth } = Dimensions.get('window');

type SettingsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Settings'>;

export default function SettingsScreen() {
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const { t, i18n: i18nInstance } = useTranslation();
  const { user, refreshUser } = useUser();
  const { trackEvent } = useAnalytics();
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [linkedEmail, setLinkedEmail] = useState<string | null>(null);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    loadLinkedEmail();

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

  const loadLinkedEmail = async () => {
    try {
      const email = await SecureStore.getItemAsync('linkedEmail');
      if (email) {
        setLinkedEmail(email);
      }
    } catch (error) {
      console.error('Error loading linked email:', error);
    }
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
        message: t('settings.shareAppMessage'),
        url: 'https://example.com', // Replace with actual app URL
      });
    } catch (error) {
      console.error('Error sharing app:', error);
    }
  };

  const handleLanguageChange = async (language: string) => {
    try {
      await i18nInstance.changeLanguage(language);
      await SecureStore.setItemAsync('appLanguage', language);
      trackEvent('settings_action', { type: 'language_change', language });
      setShowLanguageModal(false);
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  const handleRelaunchOnboarding = () => {
    Alert.alert(
      t('settings.relaunchOnboardingTitle'),
      t('settings.relaunchOnboardingMessage'),
      [
        { text: t('settings.cancel'), style: 'cancel' },
        {
          text: t('settings.continue'),
          style: 'destructive',
          onPress: async () => {
            try {
              await SecureStore.deleteItemAsync('hasSeenOnboarding');
              trackEvent('settings_action', { type: 'relaunch_onboarding' });
              // Get the root navigator and reset to onboarding
              const rootNavigator = navigation.getParent()?.getParent();
              if (rootNavigator) {
                rootNavigator.reset({
                  index: 0,
                  routes: [{ name: 'Onboarding' }],
                });
              } else {
                // Fallback: navigate directly if we can't get root navigator
                navigation.replace('Onboarding');
              }
            } catch (error) {
              console.error('Error relaunching onboarding:', error);
            }
          },
        },
      ]
    );
  };

  const getCurrentLanguageName = () => {
    const currentLang = i18nInstance.language;
    const languages = {
      en: 'English',
      tr: 'Türkçe',
      de: 'Deutsch',
      es: 'Español',
      zh: '中文',
    };
    return languages[currentLang as keyof typeof languages] || 'English';
  };


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
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >


        {/* Social Section */}
        <Animated.View
          style={[
            styles.section,
            styles.firstSection,
            { opacity: fadeAnim },
          ]}
        >
          <Text style={styles.sectionTitle}>Social</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="📤"
              title="Share App"
              onPress={handleShareApp}
              showArrow={false}
              rightElement={<Text style={styles.externalIcon}>↗</Text>}
            />
            <SettingItem
              icon="📷"
              title="Instagram"
              onPress={() => {
                trackEvent('settings_action', { type: 'open_instagram' });
                Linking.openURL('https://instagram.com');
              }}
              showArrow={false}
              rightElement={<Text style={styles.externalIcon}>↗</Text>}
            />
            <SettingItem
              icon="📘"
              title="Facebook"
              onPress={() => {
                trackEvent('settings_action', { type: 'open_facebook' });
                Linking.openURL('https://facebook.com');
              }}
              showArrow={false}
              rightElement={<Text style={styles.externalIcon}>↗</Text>}
            />
            <SettingItem
              icon="🎵"
              title="TikTok"
              onPress={() => {
                trackEvent('settings_action', { type: 'open_tiktok' });
                Linking.openURL('https://tiktok.com');
              }}
              showArrow={false}
              rightElement={<Text style={styles.externalIcon}>↗</Text>}
            />
          </View>
        </Animated.View>

        {/* Help Section */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: Animated.multiply(slideAnim, 0.8) }],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>Help</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="❓"
              title="Help Center"
              onPress={() => {
                trackEvent('settings_action', { type: 'open_help_center' });
                Linking.openURL('https://help.photorestoration.app');
              }}
              showArrow={false}
              rightElement={<Text style={styles.externalIcon}>↗</Text>}
            />
            <SettingItem
              icon="💬"
              title="Contact Support"
              onPress={contactSupport}
              showArrow={false}
              rightElement={<Text style={styles.externalIcon}>↗</Text>}
            />
            <SettingItem
              icon="📄"
              title="Subscription Info"
              onPress={() => {
                trackEvent('settings_action', { type: 'subscription_info' });
                navigation.navigate('Purchase');
              }}
            />
            <SettingItem
              icon="💡"
              title="Suggest A Feature"
              onPress={() => {
                trackEvent('settings_action', { type: 'suggest_feature' });
                Linking.openURL('mailto:support@photorestoration.app?subject=Feature Suggestion');
              }}
            />
            <SettingItem
              icon="💳"
              title="Manage Subscription"
              onPress={() => {
                trackEvent('settings_action', { type: 'manage_subscription' });
                const url = Platform.OS === 'ios'
                  ? 'https://apps.apple.com/account/subscriptions'
                  : 'https://play.google.com/store/account/subscriptions';
                Linking.openURL(url);
              }}
            />
            <SettingItem
              icon="🎯"
              title="How do I use it?"
              subtitle="See the app tutorial again"
              onPress={handleRelaunchOnboarding}
            />
          </View>
        </Animated.View>

        {/* General Section */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: Animated.multiply(slideAnim, 0.6) }],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>General</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="👤"
              title={linkedEmail ? "Manage Devices" : "Sign In"}
              subtitle={linkedEmail ? `Signed in as ${linkedEmail}` : "Sign in to sync across devices"}
              onPress={() => {
                trackEvent('settings_action', { type: linkedEmail ? 'manage_devices' : 'sign_in' });
                navigation.navigate('EmailSync');
              }}
            />
            <SettingItem
              icon="🔒"
              title="Photos Permissions"
              onPress={() => {
                trackEvent('settings_action', { type: 'photos_permissions' });
                Alert.alert('Photos Permissions', 'Manage photo access permissions in your device settings.');
              }}
            />
            <SettingItem
              icon="⚙️"
              title="Enhancement Preferences"
              onPress={() => {
                trackEvent('settings_action', { type: 'enhancement_preferences' });
                Alert.alert('Enhancement Preferences', 'Customize your photo enhancement settings.');
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
              transform: [{ translateY: Animated.multiply(slideAnim, 0.4) }],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>Legal</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="📋"
              title="Terms of Service"
              onPress={openTerms}
              showArrow={false}
              rightElement={<Text style={styles.externalIcon}>↗</Text>}
            />
            <SettingItem
              icon="🔒"
              title="Privacy Policy"
              onPress={openPrivacy}
            />
            <SettingItem
              icon="🛡️"
              title="Privacy Preferences"
              onPress={() => {
                trackEvent('settings_action', { type: 'privacy_preferences' });
                Alert.alert('Privacy Preferences', 'Manage your privacy settings and data preferences.');
              }}
            />
            <SettingItem
              icon="📚"
              title="Open Source Libraries"
              onPress={() => {
                trackEvent('settings_action', { type: 'open_source_libraries' });
                Alert.alert('Open Source Libraries', 'View acknowledgments for open source libraries used in this app.');
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

        {/* Language Modal */}
        <LanguageModal
          isVisible={showLanguageModal}
          onClose={() => setShowLanguageModal(false)}
          onLanguageChange={handleLanguageChange}
        />
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
  section: {
    marginTop: 32,
    paddingHorizontal: 16,
  },
  firstSection: {
    marginTop: 16,
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
  externalIcon: {
    fontSize: 16,
    color: '#8E8E93',
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
});