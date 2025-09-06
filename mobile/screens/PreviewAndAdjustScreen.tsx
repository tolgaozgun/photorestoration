import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../App';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import { useUser } from '../contexts/UserContext';
import { useAnalytics } from '../contexts/AnalyticsContext';
import * as Haptics from 'expo-haptics';

const { width: screenWidth } = Dimensions.get('window');

type PreviewAndAdjustScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'PreviewAndAdjust'
>;
type PreviewAndAdjustScreenRouteProp = RouteProp<
  RootStackParamList,
  'PreviewAndAdjust'
>;

interface Props {
  navigation: PreviewAndAdjustScreenNavigationProp;
  route: PreviewAndAdjustScreenRouteProp;
}

export default function PreviewAndAdjustScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { imageUri, mode } = route.params;
  const { user, updateCredits } = useUser();
  const { trackEvent } = useAnalytics();
  const [isProcessing, setIsProcessing] = useState(false);
  const [enhancedImage, setEnhancedImage] = useState<string | null>(null);
  const [showBefore, setShowBefore] = useState(false); // true for before, false for after

  useEffect(() => {
    processImage();
  }, []);

  const processImage = async () => {
    if (!user) {
      Alert.alert(t('restoration.error'), t('restoration.userNotInitialized'));
      return;
    }

    const resolution = 'standard'; // Always use standard resolution

    const hasCredits = user.credits > 0 || user.remainingToday > 0;

    if (!hasCredits) {
      Alert.alert(
        t('restoration.noCredits'),
        t('restoration.noCreditsMessage'),
        [
          { text: t('restoration.cancel'), style: 'cancel' },
          { text: t('restoration.purchase'), onPress: () => { /* Navigate to purchase screen */ } },
        ]
      );
      return;
    }

    setIsProcessing(true);
    trackEvent('restore_standard', { started: true, mode });

    try {
      const userId = await SecureStore.getItemAsync('userId');
      
      const formData = new FormData();
      formData.append('user_id', userId!);
      formData.append('resolution', resolution);
      formData.append('mode', mode);
      
      const response = await fetch(imageUri);
      const blob = await response.blob();
      formData.append('file', {
        uri: imageUri,
        type: 'image/png',
        name: 'photo.png',
      } as any);

      const enhanceResponse = await axios.post(
        `${API_BASE_URL}${API_ENDPOINTS.enhance}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      const enhancedUrl = `${API_BASE_URL}${enhanceResponse.data.enhanced_url}`;
      setEnhancedImage(enhancedUrl);

      updateCredits(enhanceResponse.data.remaining_credits);

      trackEvent('restore_standard', { 
        completed: true, 
        processing_time: enhanceResponse.data.processing_time,
        mode 
      });

    } catch (error) {
      console.error('Enhancement error:', error);
      Alert.alert(t('restoration.error'), t('restoration.enhanceFailed'));
      trackEvent('restore_standard', { failed: true, error: error.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyEnhancement = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!enhancedImage) return;
    
    // Navigate to Result screen with proper parameters
    navigation.navigate('Result', { 
      originalUri: imageUri, 
      enhancedUri: enhancedImage,
      enhancementId: Date.now().toString(), // Use timestamp as ID
      watermark: false,
      mode: mode,
      processingTime: 30 // Approximate time
    });
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Go back to home screen instead of previous step
    navigation.replace('PhotoInput');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <Text style={styles.backButton}>‹ {t('navigation.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('preview.title')}</Text>
      </View>
      <View style={styles.content}>
        {isProcessing ? (
          <ActivityIndicator size="large" color="#FF6B6B" />
        ) : (
          <Image source={{ uri: showBefore ? imageUri : enhancedImage || imageUri }} style={styles.previewImage} />
        )}
      </View>
      <View style={styles.footer}>
        {/* Before/After Toggle Buttons */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity 
            style={[styles.toggleButton, showBefore && styles.toggleButtonActive]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowBefore(true);
            }}
          >
            <Text style={[styles.toggleText, showBefore && styles.toggleTextActive]}>
              {t('preview.before')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.toggleButton, !showBefore && styles.toggleButtonActive]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowBefore(false);
            }}
          >
            <Text style={[styles.toggleText, !showBefore && styles.toggleTextActive]}>
              {t('preview.after')}
            </Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity style={styles.button} onPress={handleApplyEnhancement}>
          <Text style={styles.buttonText}>{t('preview.apply')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 40,
  },
  backButton: {
    fontSize: 24,
    color: '#007AFF',
    marginRight: 10,
  },
  title: {
    fontFamily: 'SF Pro Display',
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: screenWidth * 0.9,
    height: screenWidth * 0.9 * 0.7, // Assuming 70% height of width for aspect ratio
    resizeMode: 'contain',
  },
  footer: {
    padding: 16,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  toggleButtonActive: {
    backgroundColor: '#007AFF',
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
