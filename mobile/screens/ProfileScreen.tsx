import * as React from 'react'
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
  Platform,
  TextStyle,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import { useTranslation } from 'react-i18next';
import { useUser } from '../contexts/UserContext';
import { useAnalytics } from '../contexts/AnalyticsContext';
import * as SecureStore from 'expo-secure-store';
import LanguageModal from '../components/LanguageModal';
import * as Haptics from 'expo-haptics';
import { colors, spacing, borderRadius, typography } from '../theme';

type ProfileScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Profile'
>;

interface Props {
  navigation: ProfileScreenNavigationProp;
}

export default function ProfileScreen({ navigation }: Props) {
  const { t, i18n } = useTranslation();
  const { user, refreshUser } = useUser();
  const { trackEvent } = useAnalytics();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [linkedEmail, setLinkedEmail] = useState<string | null>(null);
  const [isLanguageModalVisible, setLanguageModalVisible] = useState(false);

  React.useEffect(() => {
    loadSyncSettings();
  }, []);

  const loadSyncSettings = async () => {
    try {
      const email = await SecureStore.getItemAsync('linkedEmail');
      if (email) {
        setLinkedEmail(email);
        setIsLoggedIn(true);
      }
    } catch (error) {
      console.error('Error loading sync settings:', error);
    }
  };

  const handleRestorePurchases = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    trackEvent('settings_action', { type: 'restore_purchases' });
    Alert.alert(
      t('settings.restorePurchasesAlertTitle'),
      t('settings.restorePurchasesAlertMessage'),
      [
        { text: t('settings.cancel'), style: 'cancel' },
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

  const openTerms = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    trackEvent('settings_action', { type: 'open_terms' });
    Linking.openURL('https://example.com/terms'); // Replace with actual URL
  };

  const openPrivacy = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    trackEvent('settings_action', { type: 'open_privacy' });
    Linking.openURL('https://example.com/privacy'); // Replace with actual URL
  };

  const contactSupport = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    trackEvent('settings_action', { type: 'contact_support' });
    Linking.openURL('mailto:support@photorestoration.app');
  };

  const rateApp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    trackEvent('settings_action', { type: 'rate_app' });
    const url = Platform.OS === 'ios' 
      ? 'https://apps.apple.com/app/id...' 
      : 'https://play.google.com/store/apps/details?id=...';
    Linking.openURL(url);
  };

  const SettingItem = ({ 
    title, 
    subtitle, 
    onPress,
    value,
  }: {
    title: string;
    subtitle?: string;
    onPress?: () => void;
    value?: string;
  }) => (
    <TouchableOpacity 
      style={styles.settingItem}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <View style={styles.settingTextContainer}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {value && <Text style={styles.settingValue}>{value}</Text>}
      {onPress && <Text style={styles.settingArrow}>›</Text>}
    </TouchableOpacity>
  );

  const LANGUAGES = [
    { code: 'en', label: t('settings.languageNames.en') },
    { code: 'tr', label: t('settings.languageNames.tr') },
    { code: 'de', label: t('settings.languageNames.de') },
    { code: 'zh', label: t('settings.languageNames.zh') },
  ];

  const currentLanguageLabel = LANGUAGES.find(lang => lang.code === i18n.language)?.label || t('settings.languageNames.en');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View />
        <Text style={styles.title}></Text>
      </View>
      <ScrollView style={styles.scrollView}>
        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.account')}</Text>
          <View style={styles.sectionContent}>
            {!isLoggedIn ? (
              <SettingItem
                title={t('settings.notLoggedIn')}
                subtitle={t('settings.notLoggedInSubtitle')}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  navigation.navigate('EmailSync');
                }}
              />
            ) : (
              <>
                <SettingItem
                  title={t('settings.loggedIn')}
                  subtitle={linkedEmail || ''}
                />
                <SettingItem
                  title={t('settings.manageDevices')}
                  subtitle={t('settings.manageDevicesSubtitle')}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    navigation.navigate('EmailSync');
                  }}
                />
              </>
            )}
          </View>
        </View>

        {/* Purchases Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.purchases')}</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              title={t('settings.getMoreCredits')}
              subtitle={t('settings.getMoreCreditsSubtitle')}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate('Purchase');
              }}
            />
            <SettingItem
              title={t('settings.restorePurchases')}
              subtitle={t('settings.restorePurchasesSubtitle')}
              onPress={handleRestorePurchases}
            />
            <SettingItem
              title={t('settings.purchaseHistory')}
              subtitle={t('settings.purchaseHistorySubtitle')}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                Alert.alert(t('settings.purchaseHistory'), t('settings.noPurchasesFound'));
              }}
            />
          </View>
        </View>

        {/* Language Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.language')}</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              title={t('settings.language')}
              value={currentLanguageLabel}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setLanguageModalVisible(true);
              }}
            />
          </View>
        </View>

        {/* Legal Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.legal')}</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              title={t('settings.terms')}
              onPress={openTerms}
            />
            <SettingItem
              title={t('settings.privacy')}
              onPress={openPrivacy}
            />
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.support')}</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              title={t('settings.contactSupport')}
              subtitle={t('settings.contactSupportSubtitle')}
              onPress={contactSupport}
            />
            <SettingItem
              title={t('settings.rateApp')}
              subtitle={t('settings.rateAppSubtitle')}
              onPress={rateApp}
            />
          </View>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appVersion}>{t('settings.version')}</Text>
          <Text style={styles.appCopyright}>{t('settings.copyright')}</Text>
        </View>
      </ScrollView>
      <LanguageModal
        isVisible={isLanguageModalVisible}
        onClose={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setLanguageModalVisible(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.xlLegacy,
    paddingTop: spacing.lg,
  },
  backButton: {
    fontSize: typography.fontSize['3xl'],
    color: colors.primary,
    marginRight: spacing.lg,
  },
  title: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize['5xl'],
    fontWeight: typography.fontWeight.bold as TextStyle['fontWeight'],
    color: colors.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontFamily: 'SF Pro Text',
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontFamily: 'SF Pro Text',
    fontSize: 13,
    color: '#8E8E93',
  },
  settingValue: {
    fontFamily: 'SF Pro Text',
    fontSize: 16,
    color: '#8E8E93',
    marginRight: 10,
  },
  settingArrow: {
    fontSize: 24,
    color: '#8E8E93',
  },
  appInfo: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  appVersion: {
    fontFamily: 'SF Pro Text',
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  appCopyright: {
    fontFamily: 'SF Pro Text',
    fontSize: 12,
    color: '#8E8E93',
  },
});