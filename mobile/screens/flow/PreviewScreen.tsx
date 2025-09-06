import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  SafeAreaView,
  Animated,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Slider from '@react-native-community/slider';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { useUser } from '../../contexts/UserContext';
import { useAnalytics } from '../../contexts/AnalyticsContext';
import { API_BASE_URL, API_ENDPOINTS } from '../../config/api';

const { width: screenWidth } = Dimensions.get('window');

interface Props {
  navigation: StackNavigationProp<any>;
  route: RouteProp<any, 'Preview'>;
}

export default function PreviewScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { imageUri, selectedMode } = route.params as { imageUri: string; selectedMode: string; };
  const { user, updateCredits } = useUser();
  const { trackEvent } = useAnalytics();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [enhancedImage, setEnhancedImage] = useState<string | null>(null);
  const [comparisonSlider, setComparisonSlider] = useState(0.5);
  const [watermark, setWatermark] = useState(false);
  const [processingTime, setProcessingTime] = useState(0);
  const [qualityLevel, setQualityLevel] = useState(0.5); // Initial quality level

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const qualityInfo = useMemo(() => {
    if (qualityLevel <= 0.3) {
      return { text: 'Fast', time: '~10s', quality: 'standard' };
    } else if (qualityLevel >= 0.7) {
      return { text: 'Best', time: '~30s', quality: 'hd' };
    } else {
      return { text: 'Good', time: '~20s', quality: 'standard' };
    }
  }, [qualityLevel]);

  useEffect(() => {
    trackEvent('screen_view', { screen: 'preview', mode: selectedMode });
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const selectedResolution = 'standard'; // Default to standard quality

  const canProcess = () => {
    if (!user) return false;
    
    return user.credits > 0 || user.remainingToday > 0;
  };

  const processImage = async () => {
    if (!user) {
      Alert.alert(t('restoration.error'), t('restoration.userNotInitialized'));
      return;
    }

    if (!canProcess()) {
      Alert.alert(
        t('restoration.noCredits'),
        t('restoration.noCreditsMessage'),
        [
          { text: t('restoration.cancel'), style: 'cancel' },
          { text: t('restoration.purchase'), onPress: () => navigation.navigate('PhotoInput') },
        ]
      );
      return;
    }

    setIsProcessing(true);
    const startTime = Date.now();
    trackEvent(`restore_${selectedResolution}`, { 
      started: true, 
      mode: selectedMode,
      quality_level: qualityLevel 
    });

    try {
      const userId = await SecureStore.getItemAsync('userId');
      
      const formData = new FormData();
      formData.append('user_id', userId!);
      formData.append('resolution', selectedResolution);
      formData.append('mode', selectedMode);
      formData.append('quality_level', qualityLevel.toString());
      
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

      const processingDuration = Date.now() - startTime;
      setProcessingTime(processingDuration);

      const enhancedUrl = `${API_BASE_URL}${enhanceResponse.data.enhanced_url}`;
      setEnhancedImage(enhancedUrl);
      setWatermark(enhanceResponse.data.watermark);

      // Update credits using the unified response
      if (user) {
        updateCredits(enhanceResponse.data.remaining_credits);
      }

      trackEvent(`restore_${selectedResolution}`, { 
        completed: true, 
        processing_time: processingDuration,
        mode: selectedMode,
        quality_level: qualityLevel
      });

    } catch (error) {
      console.error('Enhancement error:', error);
      Alert.alert(t('restoration.error'), t('restoration.enhanceFailed'));
      trackEvent(`restore_${selectedResolution}`, { 
        failed: true, 
        error: error.message,
        mode: selectedMode 
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleContinue = () => {
    if (!enhancedImage) return;

    trackEvent('action', { type: 'continue_to_result', mode: selectedMode });
    navigation.navigate('Result', {
      originalUri: imageUri,
      enhancedUri: enhancedImage,
      enhancementId: Date.now().toString(),
      watermark,
      mode: selectedMode,
      processingTime,
    });
  };

  const renderImageComparison = () => {
    if (!enhancedImage) {
      return (
        <Image 
          source={{ uri: imageUri }} 
          style={styles.previewImage} 
          resizeMode="contain" 
        />
      );
    }

    return (
      <View style={styles.comparisonContainer}>
        <Image
          source={{ uri: imageUri }}
          style={[styles.previewImage, { opacity: 1 - comparisonSlider }]}
          resizeMode="contain"
        />
        <Image
          source={{ uri: enhancedImage }}
          style={[styles.previewImage, styles.overlayImage, { opacity: comparisonSlider }]}
          resizeMode="contain"
        />
        
        {/* Comparison Slider */}
        <View style={styles.comparisonSlider}>
          <Text style={styles.sliderLabel}>{t('restoration.before')}</Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={1}
            value={comparisonSlider}
            onValueChange={setComparisonSlider}
            minimumTrackTintColor="#FF6B6B"
            maximumTrackTintColor="rgba(255, 255, 255, 0.3)"
            thumbTintColor="#FF6B6B"
          />
          <Text style={styles.sliderLabel}>{t('restoration.after')}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Animated.View 
        style={[
          styles.header,
          { opacity: fadeAnim }
        ]}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('preview.title')}</Text>
        <View style={styles.placeholder} />
      </Animated.View>

      {/* Image Preview */}
      <Animated.View 
        style={[
          styles.imageContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        {renderImageComparison()}
      </Animated.View>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        {!enhancedImage && !isProcessing && (
          <Animated.View 
            style={[
              styles.qualityControls,
              { opacity: fadeAnim }
            ]}
          >
            <Text style={styles.controlTitle}>{t('preview.processingQuality')}</Text>
            <View style={styles.qualitySliderContainer}>
              <View style={styles.qualityLabels}>
                <Text style={styles.qualityLabel}>{t('preview.quality.fast')}</Text>
                <Text style={[styles.qualitySelected, { fontSize: 16, fontWeight: '600' }]}>
                  {t(`preview.quality.${qualityInfo.text.toLowerCase()}`)}
                </Text>
                <Text style={styles.qualityLabel}>{t('preview.quality.best')}</Text>
              </View>
              <Slider
                style={styles.qualitySlider}
                minimumValue={0}
                maximumValue={1}
                value={qualityLevel}
                onValueChange={setQualityLevel}
                minimumTrackTintColor="#FF6B6B"
                maximumTrackTintColor="rgba(255, 255, 255, 0.3)"
                thumbTintColor="#FF6B6B"
              />
              <Text style={styles.timeEstimate}>
                {t('preview.timeEstimate', { time: qualityInfo.time, quality: qualityInfo.quality.toUpperCase() })}
              </Text>
            </View>
          </Animated.View>
        )}

        {isProcessing && (
          <Animated.View 
            style={[
              styles.processingContainer,
              { opacity: fadeAnim }
            ]}
          >
            <ActivityIndicator size="large" color="#FF6B6B" />
            <Text style={styles.processingText}>{t('restoration.processing')}</Text>
            <Text style={styles.processingSubtext}>
              {t('restoration.processingSubtext', { mode: selectedMode, qualityText: qualityInfo.text })}
            </Text>
          </Animated.View>
        )}
      </View>

      {/* Action Button */}
      <Animated.View 
        style={[
          styles.footer,
          { opacity: fadeAnim }
        ]}
      >
        {!enhancedImage && !isProcessing && (
          <TouchableOpacity
            style={[
              styles.processButton,
              !canProcess() && styles.processButtonDisabled
            ]}
            onPress={processImage}
            disabled={!canProcess()}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={canProcess() ? ['#FF6B6B', '#FF8E53'] : ['#666', '#555']}
              style={styles.processGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.processText}>
                {canProcess() ? t('preview.apply') : t('preview.noCreditsAvailable')}
              </Text>
              {canProcess() && (
                <Text style={styles.processSubtext}>
                  {t('preview.usesCredit', { resolution: selectedResolution.toUpperCase() })}
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}

        {enhancedImage && !isProcessing && (
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#28A745', '#20C997']}
              style={styles.continueGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.continueText}>{t('preview.continueToSave')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </Animated.View>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  backArrow: {
    fontSize: 24,
    color: '#fff',
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginLeft: -40,
  },
  placeholder: {
    width: 40,
  },
  imageContainer: {
    flex: 1,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  comparisonContainer: {
    flex: 1,
    position: 'relative',
  },
  overlayImage: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  comparisonSlider: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 12,
    padding: 12,
  },
  slider: {
    flex: 1,
    height: 40,
    marginHorizontal: 12,
  },
  sliderLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '500',
  },
  processingContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  processingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
    fontWeight: '500',
  },
  processingSubtext: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    marginTop: 4,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  processButton: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  processButtonDisabled: {
    opacity: 0.6,
  },
  processGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  processText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  processSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginTop: 4,
  },
  continueButton: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  continueGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  continueText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});