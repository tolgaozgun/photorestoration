import * as React from 'react'
import { useState, useRef, useEffect } from 'react';
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
  StatusBar,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
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
  const [watermark, setWatermark] = useState(false);
  const [processingTime, setProcessingTime] = useState(0);

  // Fixed quality settings
  const selectedResolution = 'standard';
  const qualityLevel = 0.5; // Fixed to good quality

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

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

  const renderImageDisplay = () => {
    return (
      <View style={styles.imageContainer}>
        {isProcessing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF6B6B" />
            <Text style={styles.loadingText}>Enhancing your photo...</Text>
          </View>
        ) : (
          <Image
            source={{ uri: enhancedImage || imageUri }}
            style={styles.previewImage}
            resizeMode="cover"
          />
        )}
        {enhancedImage && !isProcessing && (
          <Text style={styles.enhancedLabel}>Enhanced Photo</Text>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" />

      {/* Screen Title */}
      <View style={styles.titleSection}>
        <View style={styles.titleContainer}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={styles.titleTextContainer}>
            <Text style={styles.screenTitle}>Confirm Enhancement</Text>
            <Text style={styles.screenSubtitle}>Review your enhanced photo</Text>
          </View>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {renderImageDisplay()}
      </View>

      {/* Action Button */}
      <View style={styles.footer}>
        {!enhancedImage && !isProcessing && (
          <TouchableOpacity
            style={[
              styles.processButton,
              !canProcess() && styles.processButtonDisabled
            ]}
            onPress={processImage}
            disabled={!canProcess()}
          >
            <Text style={styles.processButtonText}>
              {canProcess() ? 'Enhance Photo' : 'No Credits Available'}
            </Text>
            {canProcess() && (
              <Text style={styles.processSubtext}>
                Uses 1 credit
              </Text>
            )}
          </TouchableOpacity>
        )}

        {enhancedImage && !isProcessing && (
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
          >
            <Text style={styles.continueButtonText}>Continue to Results</Text>
          </TouchableOpacity>
        )}
      </View>
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },

  // Image Container Styles
  imageContainer: {
    width: '100%',
    alignItems: 'center',
  },
  previewImage: {
    width: screenWidth * 0.85,
    height: screenWidth * 0.85 * 0.75,
    borderRadius: 16,
    resizeMode: 'cover',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: screenWidth * 0.85 * 0.75,
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 16,
    textAlign: 'center',
  },
  enhancedLabel: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 16,
    textAlign: 'center',
  },

  // Footer Styles
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#1C1C1E',
  },

  // Button Styles
  processButton: {
    backgroundColor: '#007AFF',
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  processButtonDisabled: {
    backgroundColor: '#2C2C2E',
  },
  processButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  processSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  continueButton: {
    backgroundColor: '#28A745',
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});