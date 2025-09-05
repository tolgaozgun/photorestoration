import React, { useState, useEffect } from 'react';
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
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  infoCard: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.2)',
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
  },
  linkSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 20,
    lineHeight: 20,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  linkedSection: {
    marginBottom: 32,
  },
  linkedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  unlinkText: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '500',
  },
  emailCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
  },
  linkedEmail: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '500',
  },
  devicesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  deviceCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 4,
  },
  deviceDetails: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  removeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  removeButtonText: {
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: '500',
  },
  footer: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
    lineHeight: 18,
  },
});