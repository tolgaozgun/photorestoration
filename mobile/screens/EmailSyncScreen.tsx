import * as React from 'react'
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  TextStyle,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { useTranslation } from 'react-i18next';
import * as Device from 'expo-device';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import { useAnalytics } from '../contexts/AnalyticsContext';
import { colors, spacing, borderRadius, typography } from '../theme';

type EmailSyncScreenNavigationProp = StackNavigationProp<RootStackParamList, 'EmailSync'>;

export default function EmailSyncScreen() {
  const navigation = useNavigation<EmailSyncScreenNavigationProp>();
  const { t } = useTranslation();
  const { trackEvent } = useAnalytics();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [linkedEmail, setLinkedEmail] = useState<string | null>(null);
  const [linkedDevices, setLinkedDevices] = useState<any[]>([]);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);

  useEffect(() => {
    checkSyncStatus();
  }, []);

  const checkSyncStatus = async () => {
    try {
      const storedEmail = await SecureStore.getItemAsync('linkedEmail');
      if (storedEmail) {
        setLinkedEmail(storedEmail);
        await loadLinkedDevices(storedEmail);
      }
    } catch (error) {
      console.error('Error checking sync status:', error);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const loadLinkedDevices = async (email: string) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}${API_ENDPOINTS.getDevices}/${email}`
      );
      setLinkedDevices(response.data.devices);
    } catch (error) {
      console.error('Error loading devices:', error);
    }
  };

  const getDeviceName = () => {
    return Device.deviceName || `${Device.modelName || 'Unknown Device'}`;
  };

  const handleSendVerification = async () => {
    if (!email || !email.includes('@')) {
      Alert.alert(t('emailSync.invalidEmailTitle'), t('emailSync.invalidEmailMessage'));
      return;
    }

    setIsLoading(true);
    trackEvent('email_sync_initiated', { email });

    try {
      const deviceId = await SecureStore.getItemAsync('userId');
      const deviceName = getDeviceName();
      const deviceType = Platform.OS;

      const response = await axios.post(
        `${API_BASE_URL}${API_ENDPOINTS.sendVerification}`,
        {
          email,
          device_id: deviceId,
          device_name: deviceName,
          device_type: deviceType,
        }
      );

      if (response.data.success) {
        navigation.navigate('VerificationCode', { 
          email, 
          deviceId: deviceId!, 
          deviceName,
          deviceType,
        });
      } else if (response.data.message === 'Device already linked') {
        Alert.alert(
          t('emailSync.deviceAlreadyLinkedTitle'),
          t('emailSync.deviceAlreadyLinkedMessage', { email: response.data.linked_email }),
          [{ text: t('common.ok') }]
        );
      }
    } catch (error: any) {
      Alert.alert(
        t('restoration.error'),
        error.response?.data?.detail || t('emailSync.sendCodeFailed')
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveDevice = async (deviceIdToRemove: string, deviceName: string) => {
    Alert.alert(
      t('emailSync.removeDeviceTitle'),
      t('emailSync.removeDeviceConfirmation', { deviceName }),
      [
        { text: t('restoration.cancel'), style: 'cancel' },
        {
          text: t('emailSync.removeButton'),
          style: 'destructive',
          onPress: async () => {
            try {
              const deviceId = await SecureStore.getItemAsync('userId');
              await axios.post(
                `${API_BASE_URL}${API_ENDPOINTS.removeDevice}`,
                {
                  email: linkedEmail,
                  device_id_to_remove: deviceIdToRemove,
                  requesting_device_id: deviceId,
                }
              );
              
              trackEvent('device_removed', { removed_device: deviceName });
              
              // Reload devices
              await loadLinkedDevices(linkedEmail!);
              
              // If we removed ourselves, clear sync status
              if (deviceIdToRemove === deviceId) {
                await SecureStore.deleteItemAsync('linkedEmail');
                setLinkedEmail(null);
                setLinkedDevices([]);
              }
            } catch (error: any) {
              Alert.alert(
                t('restoration.error'),
                error.response?.data?.detail || t('emailSync.removeDeviceFailed')
              );
            }
          },
        },
      ]
    );
  };

  const handleUnlinkEmail = async () => {
    Alert.alert(
      t('emailSync.unlinkEmailTitle'),
      t('emailSync.unlinkEmailConfirmation'),
      [
        { text: t('restoration.cancel'), style: 'cancel' },
        {
          text: t('emailSync.unlinkButton'),
          style: 'destructive',
          onPress: async () => {
            const deviceId = await SecureStore.getItemAsync('userId');
            await handleRemoveDevice(deviceId!, getDeviceName());
          },
        },
      ]
    );
  };

  if (isCheckingStatus) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('emailSync.title')}</Text>
          <Text style={styles.subtitle}>
            {t('emailSync.subtitle')}
          </Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>ℹ️</Text>
          <Text style={styles.infoText}>
            {t('emailSync.infoText')}
          </Text>
        </View>

        {!linkedEmail ? (
          <View style={styles.linkSection}>
            <Text style={styles.sectionTitle}>{t('emailSync.linkEmailSectionTitle')}</Text>
            <Text style={styles.description}>
              {t('emailSync.linkEmailDescription')}
            </Text>
            
            <TextInput
              style={styles.input}
              placeholder={t('emailSync.emailPlaceholder')}
              placeholderTextColor="#666"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleSendVerification}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>{t('emailSync.sendVerificationCodeButton')}</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.linkedSection}>
            <View style={styles.linkedHeader}>
              <Text style={styles.sectionTitle}>{t('emailSync.linkedEmailSectionTitle')}</Text>
              <TouchableOpacity onPress={handleUnlinkEmail}>
                <Text style={styles.unlinkText}>{t('emailSync.unlinkButton')}</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.emailCard}>
              <Text style={styles.linkedEmail}>{linkedEmail}</Text>
            </View>

            <Text style={styles.devicesTitle}>{t('emailSync.linkedDevicesSectionTitle', { count: linkedDevices.length })}</Text>
            
            {linkedDevices.map((device) => {
              const deviceId = SecureStore.getItemAsync('userId');
              const isCurrentDevice = device.device_id === deviceId;
              
              return (
                <View key={device.device_id} style={styles.deviceCard}>
                  <View style={styles.deviceInfo}>
                    <Text style={styles.deviceName}>
                      {device.device_name} {isCurrentDevice && t('emailSync.thisDeviceLabel')}
                    </Text>
                    <Text style={styles.deviceDetails}>
                      {t('emailSync.linkedLabel')} {new Date(device.linked_at).toLocaleDateString()}
                    </Text>
                  </View>
                  
                  {!isCurrentDevice && (
                    <TouchableOpacity
                      onPress={() => handleRemoveDevice(device.device_id, device.device_name)}
                      style={styles.removeButton}
                    >
                      <Text style={styles.removeButtonText}>{t('emailSync.removeButton')}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {t('emailSync.footerText')}
          </Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: spacing.xlLegacy,
  },
  header: {
    marginBottom: spacing.xlLegacy,
  },
  title: {
    fontSize: typography.fontSize['6xl'],
    fontWeight: typography.fontWeight.bold as TextStyle['fontWeight'],
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  subtitle: {
    fontSize: typography.fontSize.xl,
    color: colors.text.secondary,
  },
  infoCard: {
    backgroundColor: `${colors.primary}33`,
    borderRadius: borderRadius.largeLegacy,
    padding: spacing.xlLegacy,
    flexDirection: 'row',
    marginBottom: spacing['5xl'],
    borderWidth: 1,
    borderColor: `${colors.primary}33`,
  },
  infoIcon: {
    fontSize: typography.fontSize['5xl'],
    marginRight: spacing.lg,
  },
  infoText: {
    flex: 1,
    fontSize: typography.fontSize.lg,
    color: colors.text.primary,
    lineHeight: typography.lineHeight.normal,
  },
  linkSection: {
    marginBottom: spacing['5xl'],
  },
  sectionTitle: {
    fontSize: typography.fontSize['5xl'],
    fontWeight: typography.fontWeight.semibold as TextStyle['fontWeight'],
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  description: {
    fontSize: typography.fontSize.lg,
    color: colors.text.secondary,
    marginBottom: spacing.xlLegacy,
    lineHeight: typography.lineHeight.normal,
  },
  input: {
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.largeLegacy,
    padding: spacing.xlLegacy,
    fontSize: typography.fontSize.xl,
    color: colors.text.primary,
    marginBottom: spacing.xlLegacy,
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.largeLegacy,
    padding: spacing.xlLegacy,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold as TextStyle['fontWeight'],
    color: colors.text.primary,
  },
  linkedSection: {
    marginBottom: spacing['5xl'],
  },
  linkedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xlLegacy,
  },
  unlinkText: {
    fontSize: typography.fontSize.xl,
    color: colors.text.error,
    fontWeight: typography.fontWeight.medium as TextStyle['fontWeight'],
  },
  emailCard: {
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.largeLegacy,
    padding: spacing.xlLegacy,
    marginBottom: spacing['5xl'],
  },
  linkedEmail: {
    fontSize: typography.fontSize.xl,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium as TextStyle['fontWeight'],
  },
  devicesTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold as TextStyle['fontWeight'],
    color: colors.text.primary,
    marginBottom: spacing.xlLegacy,
  },
  deviceCard: {
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.largeLegacy,
    padding: spacing.xlLegacy,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.medium as TextStyle['fontWeight'],
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  deviceDetails: {
    fontSize: typography.fontSize.lg,
    color: colors.text.secondary,
  },
  removeButton: {
    paddingHorizontal: spacing.xlLegacy,
    paddingVertical: spacing.sm,
  },
  removeButtonText: {
    fontSize: typography.fontSize.lg,
    color: colors.text.error,
    fontWeight: typography.fontWeight.medium as TextStyle['fontWeight'],
  },
  footer: {
    marginTop: spacing.xlLegacy,
    paddingTop: spacing.xlLegacy,
    borderTopWidth: 1,
    borderTopColor: colors.border.borderSecondary,
  },
  footerText: {
    fontSize: typography.fontSize.base,
    color: colors.text.tertiary,
    textAlign: 'center',
    lineHeight: typography.lineHeight.normal,
  },
});