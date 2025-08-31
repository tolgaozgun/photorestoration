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
  const { imageUri } = route.params;
  const { user, updateCredits } = useUser();
  const { trackEvent } = useAnalytics();
  const [isProcessing, setIsProcessing] = useState(false);
  const [enhancedImage, setEnhancedImage] = useState<string | null>(null);
  const [selectedResolution, setSelectedResolution] = useState<'standard' | 'hd'>('standard');
  const [sliderValue, setSliderValue] = useState(0.5);
  const [watermark, setWatermark] = useState(false);

  const processImage = async () => {
    if (!user) {
      Alert.alert('Error', 'User not initialized');
      return;
    }

    const hasCredits = selectedResolution === 'hd' 
      ? (user.hdCredits > 0 || user.remainingTodayHd > 0)
      : (user.standardCredits > 0 || user.remainingTodayStandard > 0);

    if (!hasCredits) {
      Alert.alert(
        'No Credits',
        `You don't have any ${selectedResolution.toUpperCase()} credits left. Would you like to purchase more?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Purchase', onPress: () => navigation.navigate('Home') },
        ]
      );
      return;
    }

    setIsProcessing(true);
    trackEvent(`restore_${selectedResolution}`, { started: true });

    try {
      const userId = await SecureStore.getItemAsync('userId');
      
      const formData = new FormData();
      formData.append('user_id', userId!);
      formData.append('resolution', selectedResolution);
      
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
      setWatermark(enhanceResponse.data.watermark);

      updateCredits(
        enhanceResponse.data.remaining_standard_credits,
        enhanceResponse.data.remaining_hd_credits
      );

      trackEvent(`restore_${selectedResolution}`, { 
        completed: true, 
        processing_time: enhanceResponse.data.processing_time 
      });

    } catch (error) {
      console.error('Enhancement error:', error);
      Alert.alert('Error', 'Failed to enhance image. Please try again.');
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
              <Text style={styles.sliderLabel}>Before</Text>
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
              <Text style={styles.sliderLabel}>After</Text>
            </View>
          </>
        )}
      </View>

      {!enhancedImage && !isProcessing && (
        <View style={styles.resolutionContainer}>
          <Text style={styles.resolutionTitle}>Select Resolution</Text>
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
                Standard
              </Text>
              <Text style={styles.resolutionInfo}>~1024×1024</Text>
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
                HD
              </Text>
              <Text style={styles.resolutionInfo}>~2048×2048</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {isProcessing && (
        <View style={styles.processingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.processingText}>Enhancing your photo...</Text>
        </View>
      )}

      <View style={styles.buttonsContainer}>
        {!enhancedImage && !isProcessing && (
          <TouchableOpacity style={styles.primaryButton} onPress={processImage}>
            <Text style={styles.primaryButtonText}>Enhance Photo</Text>
          </TouchableOpacity>
        )}

        {enhancedImage && (
          <TouchableOpacity style={styles.primaryButton} onPress={handleExport}>
            <Text style={styles.primaryButtonText}>Export Photo</Text>
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
  resolutionContainer: {
    padding: 20,
    marginTop: 20,
  },
  resolutionTitle: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 15,
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