import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { RootStackParamList } from '../App';
import { useUser } from '../contexts/UserContext';
import { useAnalytics } from '../contexts/AnalyticsContext';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import { useTranslation } from 'react-i18next';
import Slider from '@react-native-community/slider';

type RestorationPreviewScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'RestorationPreview'
>;
type RestorationPreviewScreenRouteProp = RouteProp<RootStackParamList, 'RestorationPreview'>;

interface Props {
  navigation: RestorationPreviewScreenNavigationProp;
  route: RestorationPreviewScreenRouteProp;
}

const { width: screenWidth } = Dimensions.get('window');

export default function RestorationPreviewScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { imageUri } = route.params;
  const { user, updateCredits } = useUser();
  const { trackEvent } = useAnalytics();
  const [isProcessing, setIsProcessing] = useState(false);
  const [enhancedImage, setEnhancedImage] = useState<string | null>(null);
  const [selectedResolution, setSelectedResolution] = useState<'standard' | 'hd'>('standard');
  const [selectedMode, setSelectedMode] = useState<'enhance' | 'colorize' | 'de-scratch' | 'enlighten' | 'recreate' | 'combine'>('enhance');
  const [sliderValue, setSliderValue] = useState(0.5);
  const [watermark, setWatermark] = useState(false);

  const processImage = async () => {
    if (!user) {
      Alert.alert(t('restoration.error'), t('restoration.userNotInitialized'));
      return;
    }

    const hasCredits = selectedResolution === 'hd' 
      ? (user.hdCredits > 0 || user.remainingTodayHd > 0)
      : (user.standardCredits > 0 || user.remainingTodayStandard > 0);

    if (!hasCredits) {
      Alert.alert(
        t('restoration.noCredits'),
        t('restoration.noCreditsMessage', { resolution: selectedResolution.toUpperCase() }),
        [
          { text: t('restoration.cancel'), style: 'cancel' },
          { text: t('restoration.purchase'), onPress: () => navigation.navigate('Home') },
        ]
      );
      return;
    }

    setIsProcessing(true);
    trackEvent(`restore_${selectedResolution}`, { started: true, mode: selectedMode });

    try {
      const userId = await SecureStore.getItemAsync('userId');
      
      const formData = new FormData();
      formData.append('user_id', userId!);
      formData.append('resolution', selectedResolution);
      formData.append('mode', selectedMode);
      
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
      setWatermark(enhanceResponse.data.watermark);

      updateCredits(
        enhanceResponse.data.remaining_standard_credits,
        enhanceResponse.data.remaining_hd_credits
      );

      trackEvent(`restore_${selectedResolution}`, { 
        completed: true, 
        processing_time: enhanceResponse.data.processing_time,
        mode: selectedMode 
      });

    } catch (error) {
      console.error('Enhancement error:', error);
      Alert.alert(t('restoration.error'), t('restoration.enhanceFailed'));
      trackEvent(`restore_${selectedResolution}`, { failed: true, error: error.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExport = () => {
    if (!enhancedImage) return;

    navigation.navigate('Export', {
      originalUri: imageUri,
      enhancedUri: enhancedImage,
      enhancementId: Date.now().toString(),
      watermark,
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.imageContainer}>
        {!enhancedImage ? (
          <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />
        ) : (
          <>
            <View style={styles.comparisonContainer}>
              <Image
                source={{ uri: imageUri }}
                style={[styles.image, { opacity: 1 - sliderValue }]}
                resizeMode="contain"
              />
              <Image
                source={{ uri: enhancedImage }}
                style={[styles.image, styles.overlayImage, { opacity: sliderValue }]}
                resizeMode="contain"
              />
            </View>
            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLabel}>{t('restoration.before')}</Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={1}
                value={sliderValue}
                onValueChange={setSliderValue}
                minimumTrackTintColor="#007AFF"
                maximumTrackTintColor="#333"
                thumbTintColor="#007AFF"
              />
              <Text style={styles.sliderLabel}>{t('restoration.after')}</Text>
            </View>
          </>
        )}
      </View>

      {!enhancedImage && !isProcessing && (
        <>
          <View style={styles.modeContainer}>
            <Text style={styles.sectionTitle}>{t('restoration.selectEnhancementMode')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modeScroll}>
              <TouchableOpacity
                style={[
                  styles.modeButton,
                  selectedMode === 'enhance' && styles.modeButtonActive,
                ]}
                onPress={() => setSelectedMode('enhance')}
              >
                <Text style={styles.modeIcon}>✨</Text>
                <Text style={[
                  styles.modeButtonText,
                  selectedMode === 'enhance' && styles.modeButtonTextActive,
                ]}>
                  {t('modes.enhance.title')}
                </Text>
                <Text style={styles.modeDescription}>{t('modes.enhance.description')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modeButton,
                  selectedMode === 'colorize' && styles.modeButtonActive,
                ]}
                onPress={() => setSelectedMode('colorize')}
              >
                <Text style={styles.modeIcon}>🎨</Text>
                <Text style={[
                  styles.modeButtonText,
                  selectedMode === 'colorize' && styles.modeButtonTextActive,
                ]}>
                  {t('modes.colorize.title')}
                </Text>
                <Text style={styles.modeDescription}>{t('modes.colorize.description')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modeButton,
                  selectedMode === 'de-scratch' && styles.modeButtonActive,
                ]}
                onPress={() => setSelectedMode('de-scratch')}
              >
                <Text style={styles.modeIcon}>🧹</Text>
                <Text style={[
                  styles.modeButtonText,
                  selectedMode === 'de-scratch' && styles.modeButtonTextActive,
                ]}>
                  {t('modes.scratch.title')}
                </Text>
                <Text style={styles.modeDescription}>{t('modes.scratch.description')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modeButton,
                  selectedMode === 'enlighten' && styles.modeButtonActive,
                ]}
                onPress={() => setSelectedMode('enlighten')}
              >
                <Text style={styles.modeIcon}>💡</Text>
                <Text style={[
                  styles.modeButtonText,
                  selectedMode === 'enlighten' && styles.modeButtonTextActive,
                ]}>
                  {t('modes.enlighten.title')}
                </Text>
                <Text style={styles.modeDescription}>{t('modes.enlighten.description')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modeButton,
                  selectedMode === 'recreate' && styles.modeButtonActive,
                ]}
                onPress={() => setSelectedMode('recreate')}
              >
                <Text style={styles.modeIcon}>🖼️</Text>
                <Text style={[
                  styles.modeButtonText,
                  selectedMode === 'recreate' && styles.modeButtonTextActive,
                ]}>
                  {t('modes.recreate.title')}
                </Text>
                <Text style={styles.modeDescription}>{t('modes.recreate.description')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modeButton,
                  selectedMode === 'combine' && styles.modeButtonActive,
                ]}
                onPress={() => setSelectedMode('combine')}
              >
                <Text style={styles.modeIcon}>👥</Text>
                <Text style={[
                  styles.modeButtonText,
                  selectedMode === 'combine' && styles.modeButtonTextActive,
                ]}>
                  {t('modes.combine.title')}
                </Text>
                <Text style={styles.modeDescription}>{t('modes.combine.description')}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          <View style={styles.resolutionContainer}>
            <Text style={styles.sectionTitle}>{t('restoration.selectResolution')}</Text>
            <View style={styles.resolutionButtons}>
            <TouchableOpacity
              style={[
                styles.resolutionButton,
                selectedResolution === 'standard' && styles.resolutionButtonActive,
              ]}
              onPress={() => setSelectedResolution('standard')}
            >
              <Text style={[
                styles.resolutionButtonText,
                selectedResolution === 'standard' && styles.resolutionButtonTextActive,
              ]}>
                {t('restoration.standard')}
              </Text>
              <Text style={styles.resolutionInfo}>{t('restoration.standardResolution')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.resolutionButton,
                selectedResolution === 'hd' && styles.resolutionButtonActive,
              ]}
              onPress={() => setSelectedResolution('hd')}
            >
              <Text style={[
                styles.resolutionButtonText,
                selectedResolution === 'hd' && styles.resolutionButtonTextActive,
              ]}>
                {t('restoration.hd')}
              </Text>
              <Text style={styles.resolutionInfo}>{t('restoration.hdResolution')}</Text>
            </TouchableOpacity>
          </View>
          </View>
        </>
      )}

      {isProcessing && (
        <View style={styles.processingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.processingText}>{t('restoration.processing')}</Text>
        </View>
      )}

      <View style={styles.buttonsContainer}>
        {!enhancedImage && !isProcessing && (
          <TouchableOpacity style={styles.primaryButton} onPress={processImage}>
            <Text style={styles.primaryButtonText}>{t('restoration.enhancePhoto')}</Text>
          </TouchableOpacity>
        )}

        {enhancedImage && (
          <TouchableOpacity style={styles.primaryButton} onPress={handleExport}>
            <Text style={styles.primaryButtonText}>{t('restoration.exportPhoto')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  imageContainer: {
    width: screenWidth,
    height: screenWidth,
    backgroundColor: '#1a1a1a',
    marginTop: 20,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  comparisonContainer: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  overlayImage: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  slider: {
    flex: 1,
    height: 40,
    marginHorizontal: 10,
  },
  sliderLabel: {
    color: '#888',
    fontSize: 14,
  },
  modeContainer: {
    marginTop: 20,
    paddingLeft: 20,
  },
  modeScroll: {
    marginTop: 15,
  },
  modeButton: {
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 12,
    width: 120,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  modeButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#003366',
  },
  modeIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  modeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  modeButtonTextActive: {
    color: '#007AFF',
  },
  modeDescription: {
    color: '#666',
    fontSize: 11,
    textAlign: 'center',
  },
  resolutionContainer: {
    padding: 20,
    marginTop: 10,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 5,
    fontWeight: '600',
  },
  resolutionButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  resolutionButton: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  resolutionButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#003366',
  },
  resolutionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  resolutionButtonTextActive: {
    color: '#007AFF',
  },
  resolutionInfo: {
    color: '#666',
    fontSize: 12,
  },
  processingContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  processingText: {
    color: '#fff',
    marginTop: 15,
    fontSize: 16,
  },
  buttonsContainer: {
    padding: 20,
    marginTop: 20,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});