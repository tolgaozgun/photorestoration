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
  Animated,
  Dimensions,
  Share,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { useAnalytics } from '../../contexts/AnalyticsContext';

const { width: screenWidth } = Dimensions.get('window');

interface Props {
  navigation: StackNavigationProp<any>;
  route: RouteProp<any, 'AIGenerationResult'>;
}

interface GeneratedImage {
  id: string;
  uri: string;
  isFavorite: boolean;
  generatedAt: Date;
  quality: 'high' | 'medium' | 'low';
}

export default function AIGenerationResultScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { 
    featureId, 
    featureTitle, 
    photoUris, 
    selectedStyle, 
    styleTitle,
    processingTime 
  } = route.params as {
    featureId: string;
    featureTitle: string;
    photoUris: string[];
    selectedStyle: string;
    styleTitle: string;
    processingTime: number;
  };
  const { trackEvent } = useAnalytics();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [isSharing, setIsSharing] = useState(false);

  // Mock generation process
  useEffect(() => {
    trackEvent('screen_view', { screen: 'ai_generation_result', featureId, styleId: selectedStyle });
    
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    startGenerationProcess();
  }, []);

  const startGenerationProcess = () => {
    // Simulate generation process
    const totalSteps = 4;
    let currentStep = 0;

    const generationInterval = setInterval(() => {
      currentStep++;
      const progress = (currentStep / totalSteps) * 100;
      setGenerationProgress(progress);

      if (currentStep >= totalSteps) {
        clearInterval(generationInterval);
        completeGeneration();
      }
    }, (processingTime * 1000) / totalSteps);
  };

  const completeGeneration = () => {
    // Generate mock result images
    const mockImages: GeneratedImage[] = [
      {
        id: 'result_1',
        uri: `https://via.placeholder.com/400x600/FF6B6B/FFFFFF?text=${featureTitle}+1`,
        isFavorite: false,
        generatedAt: new Date(),
        quality: 'high',
      },
      {
        id: 'result_2',
        uri: `https://via.placeholder.com/400x600/4ECDC4/FFFFFF?text=${featureTitle}+2`,
        isFavorite: false,
        generatedAt: new Date(),
        quality: 'high',
      },
      {
        id: 'result_3',
        uri: `https://via.placeholder.com/400x600/FFD93D/FFFFFF?text=${featureTitle}+3`,
        isFavorite: false,
        generatedAt: new Date(),
        quality: 'medium',
      },
      {
        id: 'result_4',
        uri: `https://via.placeholder.com/400x600/6BCF7F/FFFFFF?text=${featureTitle}+4`,
        isFavorite: false,
        generatedAt: new Date(),
        quality: 'medium',
      },
    ];

    setGeneratedImages(mockImages);
    setSelectedImage(mockImages[0].id);
    setIsGenerating(false);

    trackEvent('generation_complete', { 
      featureId, 
      styleId: selectedStyle,
      imageCount: mockImages.length,
      processingTime 
    });
  };

  const handleImageSelect = (imageId: string) => {
    setSelectedImage(imageId);
    trackEvent('result_image_selected', { imageId, featureId });
  };

  const toggleFavorite = (imageId: string) => {
    setGeneratedImages(prev => 
      prev.map(img => 
        img.id === imageId ? { ...img, isFavorite: !img.isFavorite } : img
      )
    );
    
    const image = generatedImages.find(img => img.id === imageId);
    const isFavorited = image ? !image.isFavorite : false;
    trackEvent('result_favorite_toggled', { 
      imageId, 
      featureId, 
      favorited: isFavorited 
    });
  };

  const handleSaveImage = async () => {
    if (!selectedImage) return;

    try {
      const image = generatedImages.find(img => img.id === selectedImage);
      if (!image) return;

      // In a real app, you would save the actual image
      // For now, we'll just show a success message
      Alert.alert(
        'Image Saved',
        'Your generated image has been saved to your photo library.',
        [{ text: 'OK' }]
      );

      trackEvent('result_image_saved', { 
        imageId: selectedImage, 
        featureId 
      });
    } catch (error) {
      console.error('Error saving image:', error);
      Alert.alert('Error', 'Failed to save image');
    }
  };

  const handleShareImage = async () => {
    if (!selectedImage) return;

    try {
      setIsSharing(true);
      const image = generatedImages.find(img => img.id === selectedImage);
      if (!image) return;

      // In a real app, you would share the actual image
      // For now, we'll use the mock share functionality
      await Share.share({
        message: `Check out this amazing ${featureTitle} I created with AI!`,
        url: image.uri,
        title: `${featureTitle} - AI Generated`,
      });

      trackEvent('result_image_shared', { 
        imageId: selectedImage, 
        featureId 
      });
    } catch (error) {
      console.error('Error sharing image:', error);
    } finally {
      setIsSharing(false);
    }
  };

  const handleGenerateMore = () => {
    trackEvent('generate_more_tapped', { featureId, styleId: selectedStyle });
    
    // Reset and start generation again
    setIsGenerating(true);
    setGenerationProgress(0);
    setGeneratedImages([]);
    setSelectedImage(null);
    
    setTimeout(startGenerationProcess, 1000);
  };

  const renderGeneratedImage = (image: GeneratedImage) => {
    const isSelected = selectedImage === image.id;
    
    return (
      <TouchableOpacity
        key={image.id}
        style={[
          styles.imageThumbnail,
          isSelected && styles.imageThumbnailSelected,
        ]}
        onPress={() => handleImageSelect(image.id)}
        activeOpacity={0.9}
      >
        <Image source={{ uri: image.uri }} style={styles.thumbnailImage} />
        
        {/* Quality Badge */}
        <View style={[
          styles.qualityBadge,
          image.quality === 'high' && styles.qualityBadgeHigh,
          image.quality === 'medium' && styles.qualityBadgeMedium,
        ]}>
          <Text style={styles.qualityText}>{image.quality.toUpperCase()}</Text>
        </View>

        {/* Favorite Button */}
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={(e) => {
            e.stopPropagation();
            toggleFavorite(image.id);
          }}
        >
          <Text style={[
            styles.favoriteIcon,
            image.isFavorite && styles.favoriteIconActive
          ]}>
            {image.isFavorite ? '❤️' : '🤍'}
          </Text>
        </TouchableOpacity>

        {/* Selection Indicator */}
        {isSelected && (
          <View style={styles.selectionIndicator}>
            <Text style={styles.selectionIcon}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const selectedImageData = generatedImages.find(img => img.id === selectedImage);

  return (
    <View style={styles.container}>
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
        <Text style={styles.title}>Generation Results</Text>
        <View style={styles.placeholder} />
      </Animated.View>

      {/* Content */}
      <Animated.ScrollView
        style={[styles.content, { opacity: fadeAnim }]}
        showsVerticalScrollIndicator={false}
      >
        {isGenerating ? (
          // Generation in progress
          <Animated.View style={[styles.generationContainer, { transform: [{ scale: scaleAnim }] }]}>
            <View style={styles.generationAnimation}>
              <ActivityIndicator size="large" color="#FF6B6B" />
              <Text style={styles.generationTitle}>Creating Your {featureTitle}</Text>
              <Text style={styles.generationSubtitle}>Style: {styleTitle}</Text>
              
              {/* Progress Bar */}
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBarBackground}>
                  <View style={[styles.progressBarFill, { width: `${generationProgress}%` }]} />
                </View>
                <Text style={styles.progressText}>{Math.round(generationProgress)}%</Text>
              </View>

              <Text style={styles.generationTime}>
                Estimated time: {Math.ceil((processingTime * (100 - generationProgress)) / 100)}s
              </Text>
            </View>
          </Animated.View>
        ) : (
          // Generation complete
          <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
            {/* Success Header */}
            <View style={styles.successHeader}>
              <Text style={styles.successTitle}>✨ Generation Complete!</Text>
              <Text style={styles.successSubtitle}>
                Your {featureTitle} has been created successfully
              </Text>
            </View>

            {/* Main Image Display */}
            {selectedImageData && (
              <View style={styles.mainImageContainer}>
                <Image 
                  source={{ uri: selectedImageData.uri }} 
                  style={styles.mainImage} 
                />
                
                {/* Image Actions */}
                <View style={styles.imageActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => toggleFavorite(selectedImageData.id)}
                  >
                    <Text style={[
                      styles.actionIcon,
                      selectedImageData.isFavorite && styles.actionIconActive
                    ]}>
                      {selectedImageData.isFavorite ? '❤️' : '🤍'}
                    </Text>
                    <Text style={styles.actionText}>Favorite</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleSaveImage}
                  >
                    <Text style={styles.actionIcon}>💾</Text>
                    <Text style={styles.actionText}>Save</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleShareImage}
                    disabled={isSharing}
                  >
                    {isSharing ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.actionIcon}>📤</Text>
                    )}
                    <Text style={styles.actionText}>Share</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Generated Images Grid */}
            <View style={styles.resultsSection}>
              <Text style={styles.resultsTitle}>Generated Results</Text>
              <Text style={styles.resultsSubtitle}>
                {generatedImages.length} variations created
              </Text>
              
              <View style={styles.imagesGrid}>
                {generatedImages.map(renderGeneratedImage)}
              </View>
            </View>

            {/* Generation Info */}
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Generation Details</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Feature:</Text>
                <Text style={styles.infoValue}>{featureTitle}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Style:</Text>
                <Text style={styles.infoValue}>{styleTitle}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Processing Time:</Text>
                <Text style={styles.infoValue}>{Math.floor(processingTime / 60)}m {processingTime % 60}s</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Source Photos:</Text>
                <Text style={styles.infoValue}>{photoUris.length} images</Text>
              </View>
            </View>

            <View style={styles.bottomSpacing} />
          </Animated.View>
        )}
      </Animated.ScrollView>

      {/* Bottom Actions */}
      {!isGenerating && (
        <Animated.View 
          style={[
            styles.footer,
            { opacity: fadeAnim }
          ]}
        >
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleGenerateMore}
          >
            <Text style={styles.secondaryButtonText}>Generate More</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Home')}
          >
            <LinearGradient
              colors={['#FF6B6B', '#FF8E53']}
              style={styles.primaryGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.primaryButtonText}>Done</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
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
  generationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 20,
  },
  generationAnimation: {
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 40,
    width: '100%',
  },
  generationTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  generationSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 24,
    textAlign: 'center',
  },
  progressBarContainer: {
    width: '100%',
    marginBottom: 16,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#333',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FF6B6B',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#FF6B6B',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
  generationTime: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  successHeader: {
    alignItems: 'center',
    margin: 20,
    marginBottom: 0,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 22,
  },
  mainImageContainer: {
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  mainImage: {
    width: '100%',
    height: 400,
    resizeMode: 'cover',
  },
  imageActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  actionButton: {
    alignItems: 'center',
    gap: 4,
  },
  actionIcon: {
    fontSize: 24,
  },
  actionIconActive: {
    fontSize: 24,
  },
  actionText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  resultsSection: {
    margin: 20,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  resultsSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 16,
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  imageThumbnail: {
    width: (screenWidth - 64) / 2,
    height: 150,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  imageThumbnailSelected: {
    borderColor: '#FF6B6B',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  qualityBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#666',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  qualityBadgeHigh: {
    backgroundColor: '#4ECDC4',
  },
  qualityBadgeMedium: {
    backgroundColor: '#FFD93D',
  },
  qualityText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteIcon: {
    fontSize: 16,
  },
  favoriteIconActive: {
    fontSize: 16,
  },
  selectionIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionIcon: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  infoCard: {
    margin: 20,
    padding: 20,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  infoValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  bottomSpacing: {
    height: 120,
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
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  primaryButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  primaryGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});