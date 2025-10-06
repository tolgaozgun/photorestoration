import * as React from 'react';
import { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Dimensions,
  Text,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { StackNavigationProp } from '@react-navigation/stack';
import { MainTabParamList } from '../App';

// Define nested stack params
interface EnhanceStackParamList {
  EnhanceHome: undefined;
  ModeSelection: { imageUri: string };
  PhotoInput: undefined;
  RestorationPreview: { imageUri: string };
  Preview: { originalUri: string; enhancedUri: string };
  Result: {
    originalUri: string;
    enhancedUri: string;
    enhancementId: string;
    watermark: boolean;
    mode: string;
    processingTime: number;
  };
}

type EnhanceScreenNavigationProp = StackNavigationProp<EnhanceStackParamList> & BottomTabNavigationProp<MainTabParamList, 'Enhance'>;

import { useUser } from '../../contexts/UserContext';
import { useAnalytics } from '../../contexts/AnalyticsContext';
import { useTranslation } from 'react-i18next';

const { width: screenWidth } = Dimensions.get('window');
const cardSize = (screenWidth - 32 - 16) / 3; // 3 columns with margins

export default function EnhanceScreen() {
  const navigation = useNavigation<EnhanceScreenNavigationProp>();
  const { t } = useTranslation();
  const { refreshUser } = useUser();
  const { trackEvent } = useAnalytics();
  const [hasGalleryPermission, setHasGalleryPermission] = useState<boolean | null>(null);
  const [recentPhotos, setRecentPhotos] = useState<Array<{ id: string; uri: string }>>([]);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(false);
  const [photosError, setPhotosError] = useState<string | null>(null);

  useEffect(() => {
    trackEvent('screen_view', { screen: 'enhance' });
    refreshUser();
    requestPermissions();
  }, []);

  useEffect(() => {
    if (hasGalleryPermission) {
      loadRecentPhotos();
    } else if (hasGalleryPermission === false) {
      setPhotosError(t('tabs.enhance.galleryPermissionDenied'));
    }
  }, [hasGalleryPermission]);

  const requestPermissions = async () => {
    const galleryStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
    setHasGalleryPermission(galleryStatus.status === 'granted');
  };

  const loadRecentPhotos = async () => {
    if (!hasGalleryPermission) return;

    setIsLoadingPhotos(true);
    setPhotosError(null);

    try {
      // Request MediaLibrary permission
      const mediaPermission = await MediaLibrary.requestPermissionsAsync();

      if (mediaPermission.status !== 'granted') {
        setPhotosError(t('tabs.enhance.mediaLibraryPermissionRequired'));
        return;
      }

      // Get recent photos from library
      const { assets } = await MediaLibrary.getAssetsAsync({
        mediaType: 'photo',
        first: 9, // Get first 9 photos
        sortBy: MediaLibrary.SortBy.creationTime,
      });

      // Filter out any problematic URIs and get proper accessible URIs
      const photos = [];
      for (const asset of assets) {
        try {
          // Get a proper URI that React Native can handle
          const photoInfo = await MediaLibrary.getAssetInfoAsync(asset.id);
          if (photoInfo && photoInfo.localUri) {
            photos.push({
              id: asset.id,
              uri: photoInfo.localUri,
            });
          }
        } catch (uriError) {
          console.warn('Skipping problematic photo:', asset.id, uriError);
        }
      }

      setRecentPhotos(photos);
    } catch (error) {
      console.error('Error loading recent photos:', error);
      setPhotosError(t('tabs.enhance.failedToLoadRecentPhotos'));
    } finally {
      setIsLoadingPhotos(false);
    }
  };

  const pickImageFromSource = async (source: 'camera' | 'gallery') => {
    if (!hasGalleryPermission && source === 'gallery') {
      Alert.alert(t('common.permissionRequired'), t('tabs.enhance.pleaseGrantGalleryPermission'));
      return;
    }

    trackEvent('action', { type: source === 'camera' ? 'camera_open' : 'gallery_open' });

    try {
      let result;
      if (source === 'camera') {
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: false,
          quality: 1,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: false,
          quality: 1,
        });
      }

      if (!result.canceled) {
        trackEvent('action', { type: `image_selected_${source}` });
        // Navigate directly to processing screen
        navigation.navigate('ModeSelection', { imageUri: result.assets[0].uri });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert(t('common.error'), t('tabs.enhance.failedToPickImage'));
    }
  };

  const handleSettingsPress = () => {
    navigation.navigate('Settings');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" />

      {/* Screen Title */}
      <View style={styles.titleSection}>
        <View style={styles.titleContainer}>
          <View style={styles.titleTextContainer}>
            <Text style={styles.screenTitle}>{t('tabs.enhance.title')}</Text>
            <Text style={styles.screenSubtitle}>{t('tabs.enhance.subtitle')}</Text>
          </View>
          <TouchableOpacity style={styles.settingsButton} onPress={handleSettingsPress}>
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Photo Upload Section */}
        <TouchableOpacity
          style={styles.uploadSection}
          onPress={() => pickImageFromSource('gallery')}
          activeOpacity={0.8}
        >
          <View style={styles.uploadArea}>
            <Text style={styles.cameraIcon}>📷</Text>
            <Text style={styles.uploadTitle}>{t('tabs.enhance.selectPhotoToEnhance')}</Text>
            <Text style={styles.uploadSubtitle}>{t('tabs.enhance.tapToChooseFromGalleryOrCamera')}</Text>
          </View>
        </TouchableOpacity>

        {/* Recent Photos Grid */}
        <View style={styles.recentSection}>
          <Text style={styles.recentTitle}>{t('tabs.enhance.recentPhotos')}</Text>
          {photosError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorIcon}>📱</Text>
              <Text style={styles.errorText}>{photosError}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={requestPermissions}
              >
                <Text style={styles.retryButtonText}>{t('common.grantPermission')}</Text>
              </TouchableOpacity>
            </View>
          ) : isLoadingPhotos ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FF6B6B" />
              <Text style={styles.loadingText}>{t('tabs.enhance.loadingRecentPhotos')}</Text>
            </View>
          ) : recentPhotos.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📷</Text>
              <Text style={styles.emptyText}>{t('tabs.enhance.noRecentPhotosFound')}</Text>
              <Text style={styles.emptySubtitle}>{t('tabs.enhance.takeSomePhotosToSeeThemHere')}</Text>
            </View>
          ) : (
            <View style={styles.photosGrid}>
              {recentPhotos.map((photo) => (
                <TouchableOpacity
                  key={photo.id}
                  style={styles.photoCard}
                  onPress={() => navigation.navigate('ModeSelection', { imageUri: photo.uri })}
                  activeOpacity={0.8}
                >
                  <Image
                    source={{ uri: photo.uri }}
                    style={styles.photoImage}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                    transition={200}
                    placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Bottom spacing for tab bar */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },

  // Content Styles
  content: {
    flex: 1,
    backgroundColor: '#000000',
  },

  scrollContent: {
    paddingTop: 8,
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
    justifyContent: 'space-between',
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
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsIcon: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  
  // Upload Section Styles
  uploadSection: {
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 32,
  },
  uploadArea: {
    width: 280,
    height: 200,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderStyle: 'dashed',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  cameraIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  uploadTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  uploadSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
  
  // Recent Photos Styles
  recentSection: {
    marginHorizontal: 16,
  },

  // Utility Styles
  bottomSpacing: {
    height: 80, // Space for bottom tab bar
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4, // Negative margin to account for card margins
  },
  photoCard: {
    width: cardSize,
    height: cardSize,
    margin: 4,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#1C1C1E',
  },
  photoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  // Loading, Error, and Empty States
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 12,
  },
  errorContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#FF6B6B',
    textAlign: 'center',
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  errorSubtext: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  retryButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
});