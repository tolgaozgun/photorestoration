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
  route: RouteProp<any, 'FilterPreview'>;
}

export default function FilterPreviewScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { imageUri, filterType } = route.params as { imageUri: string; filterType: string; };
  const { user, updateCredits } = useUser();
  const { trackEvent } = useAnalytics();

  const [isProcessing, setIsProcessing] = useState(false);
  const [filteredImage, setFilteredImage] = useState<string | null>(null);
  const [watermark, setWatermark] = useState(false);
  const [processingTime, setProcessingTime] = useState(0);

  // Fixed quality settings
  const selectedResolution = 'standard';

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    trackEvent('screen_view', { screen: 'filter_preview', filter: filterType });

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
          { text: t('restoration.purchase'), onPress: () => navigation.navigate('Purchase') },
        ]
      );
      return;
    }

    setIsProcessing(true);
    const startTime = Date.now();
    trackEvent('filter_process', {
      started: true,
      filter: filterType,
      resolution: selectedResolution
    });

    try {
      const userId = await SecureStore.getItemAsync('userId');

      const formData = new FormData();
      formData.append('user_id', userId!);
      formData.append('resolution', selectedResolution);
      formData.append('filter_type', filterType);

      const response = await fetch(imageUri);
      const blob = await response.blob();
      formData.append('file', {
        uri: imageUri,
        type: 'image/png',
        name: 'photo.png',
      } as any);

      const filterResponse = await axios.post(
        `${API_BASE_URL}${API_ENDPOINTS.filter}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      const processingDuration = Date.now() - startTime;
      setProcessingTime(processingDuration);

      const filteredUrl = `${API_BASE_URL}${filterResponse.data.enhanced_url}`;
      setFilteredImage(filteredUrl);
      setWatermark(filterResponse.data.watermark);

      // Update credits using the unified response
      if (user) {
        updateCredits(filterResponse.data.remaining_credits);
      }

      trackEvent('filter_process', {
        completed: true,
        processing_time: processingDuration,
        filter: filterType,
        resolution: selectedResolution
      });

    } catch (error) {
      console.error('Filter error:', error);
      Alert.alert(t('restoration.error'), t('tabs.aiFilters.filterFailed'));
      trackEvent('filter_process', {
        failed: true,
        error: error.message,
        filter: filterType
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleContinue = () => {
    if (!filteredImage) return;

    trackEvent('action', { type: 'continue_to_result', filter: filterType });
    navigation.navigate('UniversalResult', {
      originalUri: imageUri,
      enhancedUri: filteredImage,
      enhancementId: Date.now().toString(),
      watermark,
      mode: 'filter',
      processingTime,
      processingType: filterType,
    });
  };

  const getFilterDisplayName = (filterId: string) => {
    const filterNames = {
      '3d-photos': '3D Photos',
      'muscles': 'Muscles',
      'flash': 'Flash',
      'fairy-toon': 'Fairy Toon',
      '90s-anime': '90s Anime',
      'chibi': 'Chibi',
      'pixel': 'Pixel Art',
      'animal-toon': 'Animal Toon',
      'animated': 'Animated',
      'caricature': 'Caricature',
      'mini-toys': 'Mini Toys',
      'doll': 'Doll',
    };
    return filterNames[filterId] || filterId;
  };

  const renderImageDisplay = () => {
    return (
      <View style={styles.imageContainer}>
        {isProcessing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF6B6B" />
            <Text style={styles.loadingText}>Applying {getFilterDisplayName(filterType)} filter...</Text>
          </View>
        ) : (
          <Image
            source={{ uri: filteredImage || imageUri }}
            style={styles.previewImage}
            resizeMode="cover"
          />
        )}
        {filteredImage && !isProcessing && (
          <Text style={styles.filteredLabel}>Filtered Photo</Text>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={['#000000', '#1a1a1a']}
        style={styles.gradient}
      >
        {/* Header */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{getFilterDisplayName(filterType)} Filter</Text>
          <View style={styles.placeholder} />
        </Animated.View>

        {/* Main Content */}
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {renderImageDisplay()}

          {/* Action Buttons */}
          <View style={styles.actionContainer}>
            {!filteredImage && !isProcessing ? (
              <TouchableOpacity
                style={[styles.processButton, !canProcess() && styles.disabledButton]}
                onPress={processImage}
                disabled={isProcessing || !canProcess()}
              >
                <Text style={[styles.processButtonText, !canProcess() && styles.disabledButtonText]}>
                  Apply Filter
                </Text>
              </TouchableOpacity>
            ) : filteredImage && !isProcessing ? (
              <TouchableOpacity
                style={styles.continueButton}
                onPress={handleContinue}
              >
                <Text style={styles.continueButtonText}>Continue</Text>
              </TouchableOpacity>
            ) : null}

            {!canProcess() && (
              <Text style={styles.creditsWarning}>
                No credits remaining. Purchase more to apply filter.
              </Text>
            )}
          </View>
        </Animated.View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 44,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  previewImage: {
    width: screenWidth - 40,
    height: screenWidth - 40,
    borderRadius: 16,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: screenWidth - 40,
    height: screenWidth - 40,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  filteredLabel: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  actionContainer: {
    paddingBottom: 40,
  },
  processButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  processButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  disabledButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  disabledButtonText: {
    color: 'rgba(0, 0, 0, 0.5)',
  },
  continueButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  creditsWarning: {
    fontSize: 14,
    color: '#FF6B6B',
    textAlign: 'center',
    marginTop: 16,
  },
});