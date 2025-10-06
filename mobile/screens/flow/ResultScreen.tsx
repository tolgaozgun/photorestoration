import * as React from 'react'
import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useAnalytics } from '../../contexts/AnalyticsContext';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');

interface Props {
  navigation: StackNavigationProp<any>;
  route: RouteProp<any, 'Result'>;
}

export default function ResultScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const params = route.params as {
    originalUri: string;
    enhancedUri: string;
    enhancementId: string;
    watermark: boolean;
    mode: string;
    processingTime: number;
  };
  const {
    originalUri,
    enhancedUri,
    enhancementId,
    watermark,
    mode,
    processingTime
  } = params;
  const { trackEvent } = useAnalytics();

  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccessfully, setSavedSuccessfully] = useState(false);
  const [showBefore, setShowBefore] = useState(false);
  const [comparisonPosition] = useState(50); // percentage for slider

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const successAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    trackEvent('screen_view', {
      screen: 'result',
      mode,
      processing_time: processingTime,
      has_watermark: watermark
    });

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const saveToGallery = async () => {
    try {
      setIsSaving(true);
      trackEvent('action', { type: 'save_to_gallery', mode });

      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('home.permissionRequired'), t('home.galleryPermission'));
        return;
      }

      const fileUri = FileSystem.documentDirectory + `restored_photo_${enhancementId}.png`;
      await FileSystem.downloadAsync(enhancedUri, fileUri);

      await MediaLibrary.saveToLibraryAsync(fileUri);

      setSavedSuccessfully(true);

      Animated.spring(successAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start(() => {
        setTimeout(() => {
          Animated.timing(successAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start(() => setSavedSuccessfully(false));
        }, 1500);
      });

      trackEvent('action', { type: 'save_success', mode });
      await FileSystem.deleteAsync(fileUri, { idempotent: true });

    } catch (error) {
      console.error('Save error:', error);
      Alert.alert(t('restoration.error'), t('result.saveErrorMessage'));
      trackEvent('action', { type: 'save_failed', mode, error: (error as Error)?.message });
    } finally {
      setIsSaving(false);
    }
  };

  const shareImage = async () => {
    try {
      trackEvent('action', { type: 'share_image', mode });

      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert(t('restoration.error'), t('result.shareNotAvailableMessage'));
        return;
      }

      const fileUri = FileSystem.documentDirectory + `restored_photo_${enhancementId}.png`;
      await FileSystem.downloadAsync(enhancedUri, fileUri);

      await Sharing.shareAsync(fileUri, {
        mimeType: 'image/jpeg',
        dialogTitle: 'Share Restored Photo',
      });

      trackEvent('action', { type: 'share_success', mode });
      await FileSystem.deleteAsync(fileUri, { idempotent: true });

    } catch (error) {
      console.error('Share error:', error);
      Alert.alert(t('restoration.error'), t('result.shareErrorMessage'));
      trackEvent('action', { type: 'share_failed', mode, error: (error as Error)?.message });
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      {/* Full-screen Image */}
      <View style={styles.imageContainer}>
        {/* Before/After Comparison Slider */}
        {showBefore ? (
          <View style={styles.comparisonContainer}>
            {/* After Image (background) */}
            <Image
              source={{ uri: enhancedUri }}
              style={styles.fullImage}
              resizeMode="contain"
            />

            {/* Before Image (clipped) */}
            <View
              style={[
                styles.beforeImageContainer,
                { width: `${comparisonPosition}%` }
              ]}
            >
              <Image
                source={{ uri: originalUri }}
                style={[
                  styles.fullImage,
                  { width: screenWidth }
                ]}
                resizeMode="contain"
              />
            </View>

            {/* Slider Line */}
            <View
              style={[
                styles.sliderLine,
                { left: `${comparisonPosition}%` }
              ]}
            >
              <View style={styles.sliderHandle}>
                <Ionicons name="swap-horizontal" size={24} color="#FFFFFF" />
              </View>
            </View>

            {/* Labels */}
            <View style={styles.comparisonLabels}>
              <View style={styles.labelBadge}>
                <Text style={styles.labelText}>{t('result.before')}</Text>
              </View>
              <View style={styles.labelBadge}>
                <Text style={styles.labelText}>{t('result.after')}</Text>
              </View>
            </View>
          </View>
        ) : (
          <Image
            source={{ uri: enhancedUri }}
            style={styles.fullImage}
            resizeMode="contain"
          />
        )}

        {watermark && !showBefore && (
          <View style={styles.watermarkBadge}>
            <Text style={styles.watermarkText}>{t('result.watermarkText')}</Text>
          </View>
        )}

        {/* Success Overlay */}
        {savedSuccessfully && (
          <Animated.View
            style={[
              styles.successOverlay,
              {
                opacity: successAnim,
                transform: [{ scale: successAnim }]
              }
            ]}
          >
            <View style={styles.successCircle}>
              <Ionicons name="checkmark" size={48} color="#FFFFFF" />
            </View>
            <Text style={styles.successText}>{t('result.savedToPhotos')}</Text>
          </Animated.View>
        )}
      </View>

      {/* Minimal Top Bar */}
      <Animated.View style={[styles.topBar, { opacity: fadeAnim }]}>
        <View style={styles.topBarContent}>
          <TouchableOpacity onPress={handleBack} style={styles.topBarButton}>
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.topBarActions}>
            <TouchableOpacity
              onPress={() => {
                setShowBefore(!showBefore);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              style={styles.topBarButton}
            >
              <Ionicons
                name={showBefore ? "images" : "images-outline"}
                size={24}
                color="#FFFFFF"
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={shareImage}
              style={styles.topBarButton}
            >
              <Ionicons name="share-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={saveToGallery}
              style={styles.topBarButton}
              disabled={isSaving}
            >
              {isSaving ? (
                <Ionicons name="hourglass-outline" size={24} color="#FFFFFF" />
              ) : savedSuccessfully ? (
                <Ionicons name="checkmark-circle" size={24} color="#28A745" />
              ) : (
                <Ionicons name="download-outline" size={24} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  imageContainer: {
    flex: 1,
    position: 'relative',
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
  comparisonContainer: {
    flex: 1,
    position: 'relative',
  },
  beforeImageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  sliderLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: '#FFFFFF',
    transform: [{ translateX: -1.5 }],
  },
  sliderHandle: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 48,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ translateX: -24 }, { translateY: -24 }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  comparisonLabels: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 100 : 80,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  labelBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  labelText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  watermarkBadge: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 100 : 80,
    right: 20,
    backgroundColor: '#FF3B30',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  watermarkText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  successOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successCircle: {
    width: 100,
    height: 100,
    backgroundColor: '#28A745',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
  },
  topBarContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  topBarButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
