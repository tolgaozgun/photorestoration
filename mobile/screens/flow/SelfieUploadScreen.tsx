import * as React from 'react'
import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  SafeAreaView,
  Animated,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useAnalytics } from '../../contexts/AnalyticsContext';

const { width: screenWidth } = Dimensions.get('window');

interface Props {
  navigation: StackNavigationProp<any>;
  route: RouteProp<any, 'SelfieUpload'>;
}

interface UploadedPhoto {
  id: string;
  uri: string;
  uploadedAt: Date;
}

export default function SelfieUploadScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { featureId, featureTitle, featureDescription } = route.params as {
    featureId: string;
    featureTitle: string;
    featureDescription: string;
  };
  const { trackEvent } = useAnalytics();
  const [uploadedPhotos, setUploadedPhotos] = useState<UploadedPhoto[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [hasGalleryPermission, setHasGalleryPermission] = useState<boolean | null>(null);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const MIN_PHOTOS = 8;
  const MAX_PHOTOS = 12;

  useEffect(() => {
    trackEvent('screen_view', { screen: 'selfie_upload', featureId });
    requestPermissions();
    
    // Entry animation
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

  const requestPermissions = async () => {
    const galleryStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
    setHasGalleryPermission(galleryStatus.status === 'granted');
  };

  const pickMultipleImages = async () => {
    if (!hasGalleryPermission) {
      Alert.alert('Permission Required', 'Please grant gallery permission to select photos');
      return;
    }

    try {
      setIsUploading(true);
      trackEvent('action', { type: 'gallery_open_multiple' });

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
        allowsMultipleSelection: true,
        selectionLimit: MAX_PHOTOS - uploadedPhotos.length,
      });

      if (!result.canceled && result.assets) {
        const newPhotos = result.assets.map((asset, index) => ({
          id: `photo_${Date.now()}_${index}`,
          uri: asset.uri,
          uploadedAt: new Date(),
        }));

        setUploadedPhotos(prev => [...prev, ...newPhotos].slice(0, MAX_PHOTOS));
        trackEvent('action', { 
          type: 'photos_uploaded', 
          count: newPhotos.length,
          featureId 
        });
      }
    } catch (error) {
      console.error('Error picking images:', error);
      Alert.alert('Error', 'Failed to select photos');
    } finally {
      setIsUploading(false);
    }
  };

  const takePhoto = async () => {
    try {
      setIsUploading(true);
      trackEvent('action', { type: 'camera_open' });

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 1,
        aspect: [1, 1],
      });

      if (!result.canceled && result.assets[0]) {
        const newPhoto = {
          id: `photo_${Date.now()}`,
          uri: result.assets[0].uri,
          uploadedAt: new Date(),
        };

        setUploadedPhotos(prev => [...prev, newPhoto].slice(0, MAX_PHOTOS));
        trackEvent('action', { type: 'photo_taken', featureId });
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    } finally {
      setIsUploading(false);
    }
  };

  const removePhoto = (photoId: string) => {
    setUploadedPhotos(prev => prev.filter(photo => photo.id !== photoId));
    trackEvent('action', { type: 'photo_removed', featureId });
  };

  const handleContinue = () => {
    if (uploadedPhotos.length < MIN_PHOTOS) {
      Alert.alert(
        'More Photos Needed',
        `Please upload at least ${MIN_PHOTOS} photos for best AI training results.`,
        [{ text: 'OK' }]
      );
      return;
    }

    trackEvent('action', { 
      type: 'selfie_upload_complete', 
      photoCount: uploadedPhotos.length,
      featureId 
    });

    navigation.navigate('AITraining', {
      featureId,
      featureTitle,
      featureDescription,
      photoUris: uploadedPhotos.map(p => p.uri),
    });
  };

  const renderPhotoGrid = () => {
    const totalSlots = Math.max(MIN_PHOTOS, uploadedPhotos.length + 1);
    const gridItems = [];

    // Render uploaded photos
    uploadedPhotos.forEach((photo, index) => (
      <View key={photo.id} style={styles.photoSlot}>
        <Image source={{ uri: photo.uri }} style={styles.photoImage} />
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => removePhoto(photo.id)}
        >
          <Text style={styles.removeText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.photoNumber}>{index + 1}</Text>
      </View>
    ));

    // Add upload button if not at max
    if (uploadedPhotos.length < MAX_PHOTOS) {
      gridItems.push(
        <TouchableOpacity
          key="upload_button"
          style={[styles.photoSlot, styles.uploadSlot]}
          onPress={pickMultipleImages}
          disabled={isUploading}
        >
          <View style={styles.uploadContent}>
            <Text style={styles.uploadIcon}>+</Text>
            <Text style={styles.uploadText}>Add Photos</Text>
          </View>
        </TouchableOpacity>
      );
    }

    // Fill empty slots
    while (gridItems.length < totalSlots) {
      gridItems.push(
        <View key={`empty_${gridItems.length}`} style={[styles.photoSlot, styles.emptySlot]} />
      );
    }

    return gridItems;
  };

  const canContinue = uploadedPhotos.length >= MIN_PHOTOS;
  const progress = (uploadedPhotos.length / MIN_PHOTOS) * 100;

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
        <Text style={styles.title}>{featureTitle}</Text>
        <View style={styles.placeholder} />
      </Animated.View>

      {/* Content */}
      <Animated.ScrollView
        style={[styles.content, { opacity: fadeAnim }]}
        showsVerticalScrollIndicator={false}
      >
        {/* AI Training Explanation */}
        <Animated.View style={[styles.explanationCard, { 
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }]}>
          <View style={styles.aiIconContainer}>
            <Text style={styles.aiIcon}>🧠</Text>
          </View>
          <Text style={styles.explanationTitle}>Train AI with Your Photos</Text>
          <Text style={styles.explanationText}>
            Upload {MIN_PHOTOS}-{MAX_PHOTOS} selfies showing different angles, expressions, and lighting conditions. 
            Our AI will learn your unique features to create amazing results.
          </Text>
        </Animated.View>

        {/* Photo Upload Progress */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>
              Photos: {uploadedPhotos.length}/{MIN_PHOTOS}
            </Text>
            <Text style={styles.progressPercentage}>{Math.round(progress)}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        </View>

        {/* Photo Grid */}
        <View style={styles.gridContainer}>
          <View style={styles.photoGrid}>
            {renderPhotoGrid()}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.cameraButton]}
            onPress={takePhoto}
            disabled={isUploading}
          >
            <Text style={styles.actionIcon}>📷</Text>
            <Text style={styles.actionText}>Take Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.galleryButton]}
            onPress={pickMultipleImages}
            disabled={isUploading}
          >
            <Text style={styles.actionIcon}>📱</Text>
            <Text style={styles.actionText}>Add Photos</Text>
          </TouchableOpacity>
        </View>

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Tips for Best Results</Text>
          <Text style={styles.tipsText}>
            • Use recent, clear photos{"\n"}
            • Show different angles (front, side, 3/4){"\n"}
            • Include various expressions{"\n"}
            • Good lighting works best{"\n"}
            • Avoid filters or heavy makeup
          </Text>
        </View>

        <View style={styles.bottomSpacing} />
      </Animated.ScrollView>

      {/* Continue Button */}
      <Animated.View 
        style={[
          styles.footer,
          { opacity: fadeAnim }
        ]}
      >
        <TouchableOpacity
          style={[
            styles.continueButton,
            !canContinue && styles.continueButtonDisabled
          ]}
          onPress={handleContinue}
          disabled={!canContinue}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={canContinue ? ['#FF6B6B', '#FF8E53'] : ['#666', '#888']}
            style={styles.continueGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {isUploading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.continueText}>
                {canContinue ? 'Start AI Training' : `Add ${MIN_PHOTOS - uploadedPhotos.length} More Photos`}
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
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
  content: {
    flex: 1,
  },
  explanationCard: {
    margin: 20,
    padding: 20,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    alignItems: 'center',
  },
  aiIconContainer: {
    width: 60,
    height: 60,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  aiIcon: {
    fontSize: 32,
  },
  explanationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  explanationText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 20,
  },
  progressSection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  progressPercentage: {
    fontSize: 14,
    color: '#FF6B6B',
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#333',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF6B6B',
    borderRadius: 4,
  },
  gridContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  photoSlot: {
    width: (screenWidth - 60) / 3,
    height: (screenWidth - 60) / 3,
    marginBottom: 10,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  photoNumber: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  uploadSlot: {
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#333',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptySlot: {
    backgroundColor: '#0f0f0f',
    borderWidth: 1,
    borderColor: '#222',
  },
  uploadContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadIcon: {
    fontSize: 32,
    color: '#666',
    marginBottom: 4,
  },
  uploadText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  cameraButton: {
    backgroundColor: '#FF6B6B',
  },
  galleryButton: {
    backgroundColor: '#4ECDC4',
  },
  actionIcon: {
    fontSize: 20,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  tipsCard: {
    margin: 20,
    padding: 16,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B6B',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 18,
  },
  bottomSpacing: {
    height: 100,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(10, 10, 10, 0.95)',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  continueButton: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  continueButtonDisabled: {
    opacity: 0.6,
  },
  continueGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  continueText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});