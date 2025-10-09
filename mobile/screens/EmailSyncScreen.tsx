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
  StatusBar,
  BackHandler,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { useTranslation } from 'react-i18next';
import * as Device from 'expo-device';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import { useAnalytics } from '../contexts/AnalyticsContext';
import { useNavigationDebugger } from '../hooks/useNavigationDebugger';

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

  // Use navigation debugging hook
  const { logNavigationState } = useNavigationDebugger('EmailSyncScreen');

  useEffect(() => {
    console.log('🚀 [EmailSyncScreen] Component mounted');
    logNavigationState();
    checkSyncStatus();
  }, [logNavigationState]);

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

  const handleBackPress = () => {
    console.log('🔙 [EmailSyncScreen] handleBackPress called');
    logNavigationState();
    navigation.goBack();
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
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" />

      {/* Screen Title */}
      <View style={styles.titleSection}>
        <View style={styles.titleContainer}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={styles.titleTextContainer}>
            <Text style={styles.screenTitle}>{t('emailSync.title')}</Text>
            <Text style={styles.screenSubtitle}>{t('emailSync.subtitle')}</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={24} color="#8E8E93" style={styles.infoIcon} />
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
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  infoCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#3A3A3C',
  },
  infoIcon: {
    marginRight: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 24,
  },
  linkSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 24,
    lineHeight: 24,
  },
  input: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 24,
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#3A3A3C',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  linkedSection: {
    marginBottom: 32,
  },
  linkedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  unlinkText: {
    fontSize: 16,
    color: '#FF6B6B',
    fontWeight: '500',
  },
  emailCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#3A3A3C',
  },
  linkedEmail: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  devicesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  deviceCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#3A3A3C',
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  deviceDetails: {
    fontSize: 14,
    color: '#8E8E93',
  },
  removeButton: {
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  removeButtonText: {
    fontSize: 14,
    color: '#FF6B6B',
    fontWeight: '500',
  },
  footer: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#3A3A3C',
  },
  footerText: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 18,
  },
});