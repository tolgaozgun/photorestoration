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
import Slider from '@react-native-community/slider';
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
  const [quality, setQuality] = useState(0.5); // 0.0 for standard, 1.0 for HD

  useEffect(() => {
    processImage();
  }, []);

  const processImage = async () => {
    if (!user) {
      Alert.alert(t('restoration.error'), t('restoration.userNotInitialized'));
      return;
    }

    const resolution = quality > 0.5 ? 'hd' : 'standard';

    const hasCredits = resolution === 'hd' 
      ? (user.hdCredits > 0 || user.remainingTodayHd > 0)
      : (user.standardCredits > 0 || user.remainingTodayStandard > 0);

    if (!hasCredits) {
      Alert.alert(
        t('restoration.noCredits'),
        t('restoration.noCreditsMessage', { resolution: resolution.toUpperCase() }),
        [
          { text: t('restoration.cancel'), style: 'cancel' },
          { text: t('restoration.purchase'), onPress: () => { /* Navigate to purchase screen */ } },
        ]
      );
      return;
    }

    setIsProcessing(true);
    trackEvent(`restore_${resolution}`, { started: true, mode });

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
        type: 'image/jpeg',
        name: 'photo.jpg',
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

      updateCredits(
        enhanceResponse.data.remaining_standard_credits,
        enhanceResponse.data.remaining_hd_credits
      );

      trackEvent(`restore_${resolution}`, { 
        completed: true, 
        processing_time: enhanceResponse.data.processing_time,
        mode 
      });

    } catch (error) {
      console.error('Enhancement error:', error);
      Alert.alert(t('restoration.error'), t('restoration.enhanceFailed'));
      trackEvent(`restore_${resolution}`, { failed: true, error: error.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyEnhancement = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!enhancedImage) return;
    navigation.navigate('SaveAndShare', { imageUri, enhancedImageUri: enhancedImage });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          navigation.goBack();
        }}>
          <Text style={styles.backButton}>‹ {t('navigation.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('preview.title')}</Text>
      </View>
      <View style={styles.content}>
        {isProcessing ? (
          <ActivityIndicator size="large" color="#FF6B6B" />
        ) : (
          <Image source={{ uri: enhancedImage || imageUri }} style={styles.previewImage} />
        )}
      </View>
      <View style={styles.footer}>
        <View style={styles.sliderContainer}>
          <Text style={styles.sliderLabel}>{t('preview.quality.fast')}</Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={1}
            value={quality}
            onValueChange={setQuality}
            minimumTrackTintColor="#007AFF"
            maximumTrackTintColor="#3A3A3C"
            thumbTintColor="#007AFF"
          />
          <Text style={styles.sliderLabel}>{t('preview.quality.best')}</Text>
        </View>
        <Text style={styles.timeIndicator}>{t('preview.timeIndicator', { time: quality > 0.5 ? 90 : 30 })}</Text>
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
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sliderLabel: {
    fontFamily: 'SF Pro Text',
    fontSize: 14,
    color: '#8E8E93',
  },
  slider: {
    flex: 1,
    height: 40,
    marginHorizontal: 10,
  },
  timeIndicator: {
    fontFamily: 'SF Pro Text',
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 16,
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
