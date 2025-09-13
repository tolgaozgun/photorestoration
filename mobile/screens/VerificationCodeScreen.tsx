import * as React from 'react'
import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import { useAnalytics } from '../contexts/AnalyticsContext';

type VerificationCodeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'VerificationCode'>;
type VerificationCodeScreenRouteProp = RouteProp<RootStackParamList, 'VerificationCode'>;

export default function VerificationCodeScreen() {
  const navigation = useNavigation<VerificationCodeScreenNavigationProp>();
  const route = useRoute<VerificationCodeScreenRouteProp>();
  const { t } = useTranslation();
  const { trackEvent } = useAnalytics();
  
  const { email, deviceId, deviceName, deviceType } = route.params;
  
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  
  const inputRefs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    // Start countdown timer
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCodeChange = (value: string, index: number) => {
    if (value.length > 1) {
      // Handle paste
      const pastedCode = value.slice(0, 6).split('');
      const newCode = [...code];
      pastedCode.forEach((digit, i) => {
        if (i + index < 6) {
          newCode[i + index] = digit;
        }
      });
      setCode(newCode);
      
      // Focus last input or next empty one
      const nextIndex = Math.min(index + pastedCode.length, 5);
      inputRefs.current[nextIndex]?.focus();
    } else {
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);

      // Auto-focus next input
      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      Alert.alert(t('verification.invalidCodeTitle'), t('verification.invalidCodeMessage'));
      return;
    }

    if (timeLeft <= 0) {
      Alert.alert(t('verification.codeExpiredTitle'), t('verification.codeExpiredMessage'));
      navigation.goBack();
      return;
    }

    setIsVerifying(true);
    trackEvent('verification_attempted', { email });

    try {
      const response = await axios.post(
        `${API_BASE_URL}${API_ENDPOINTS.verifyCode}`,
        {
          email,
          device_id: deviceId,
          code: fullCode,
          device_type: deviceType,
        }
      );

      if (response.data.success) {
        // Save linked email
        await SecureStore.setItemAsync('linkedEmail', email);
        
        trackEvent('verification_successful', { email });
        
        Alert.alert(
          t('verification.successTitle'),
          t('verification.successMessage'),
          [
            {
              text: t('common.ok'),
              onPress: () => {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'MainTabs' }],
                });
              },
            },
          ]
        );
      }
    } catch (error: any) {
      trackEvent('verification_failed', { email, error: error.message });
      Alert.alert(
        t('verification.failedTitle'),
        error.response?.data?.detail || t('verification.failedMessage')
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    Alert.alert(
      t('verification.resendCodeTitle'),
      t('verification.resendCodeConfirmation'),
      [
        { text: t('restoration.cancel'), style: 'cancel' },
        {
          text: t('verification.resendButton'),
          onPress: async () => {
            try {
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
                setCode(['', '', '', '', '', '']);
                setTimeLeft(600);
                Alert.alert(t('verification.codeSentTitle'), t('verification.codeSentMessage'));
                trackEvent('verification_code_resent', { email });
              }
            } catch (error) {
              Alert.alert(t('restoration.error'), t('verification.resendFailedMessage'));
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{t('verification.title')}</Text>
          <Text style={styles.subtitle}>
            {t('verification.subtitle')}
          </Text>
          <Text style={styles.email}>{email}</Text>
        </View>

        <View style={styles.codeContainer}>
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                if (ref) {
                  inputRefs.current[index] = ref;
                }
              }}
              style={[
                styles.codeInput,
                digit ? styles.codeInputFilled : {},
              ]}
              value={digit}
              onChangeText={(value) => handleCodeChange(value, index)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              autoFocus={index === 0}
            />
          ))}
        </View>

        <View style={styles.timerContainer}>
          <Text style={styles.timerText}>
            {t('verification.codeExpiresIn')} {formatTime(timeLeft)}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.verifyButton, isVerifying && styles.buttonDisabled]}
          onPress={handleVerify}
          disabled={isVerifying}
        >
          {isVerifying ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.verifyButtonText}>{t('verification.verifyButton')}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.resendButton}
          onPress={handleResendCode}
          disabled={isVerifying}
        >
          <Text style={styles.resendButtonText}>{t('verification.resendButton')}</Text>
        </TouchableOpacity>

        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            {t('verification.infoText')}
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 4,
  },
  email: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: '600',
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
    gap: 12,
  },
  codeInput: {
    width: 50,
    height: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  codeInputFilled: {
    borderColor: '#007AFF',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  timerText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  verifyButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  verifyButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  resendButton: {
    alignItems: 'center',
    padding: 12,
  },
  resendButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  infoContainer: {
    marginTop: 40,
    paddingHorizontal: 20,
  },
  infoText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
    lineHeight: 20,
  },
});