import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import { useUser } from '../contexts/UserContext';
import { useAnalytics } from '../contexts/AnalyticsContext';
import { useTranslation } from 'react-i18next';

// Import our new components
import { Container, Section, Column, Spacer } from '../components/Layout';
import { Text } from '../components/Text';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { LoadingModal, PremiumModal } from '../components/Modal';
import { spacing, colors } from '../theme';
import { NavigationService, NavigationItem } from '../services/NavigationService';

interface QualityOption {
  id: string;
  name: string;
  resolution: string;
  credits: number;
}

interface StyleOption {
  id: string;
  name: string;
  description: string;
}

type VideoGenerationScreenNavigationProp = StackNavigationProp<RootStackParamList, 'VideoGeneration'>;


export default function VideoGenerationScreen() {
  const route = useRoute();
  const { user } = useUser();
  const { trackEvent } = useAnalytics();
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [selectedQuality, setSelectedQuality] = useState<QualityOption | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<StyleOption | null>(null);
  const [currentStep, setCurrentStep] = useState<'browse' | 'create' | 'processing' | 'preview'>('browse');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [menuLoading, setMenuLoading] = useState(true);
  const [videoFeatures, setVideoFeatures] = useState<NavigationItem[]>([]);
  const [qualityOptions] = useState<QualityOption[]>([]);
  const [styleOptions] = useState<StyleOption[]>([]);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    trackEvent('screen_view', { screen: 'video_generation' });
    loadMenuData();
    
    // Entry animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const loadMenuData = async () => {
    try {
      const navigationService = NavigationService.getInstance();
      await navigationService.loadMenuData();

      const videoSections = navigationService.getScreenItems('video');
      setVideoFeatures(videoSections);

      // Get feature from route params
      const featureId = route.params?.featureId;
      if (featureId) {
        setSelectedFeature(featureId);
        setCurrentStep('create');
      }

      // Set default quality and style from backend data or use defaults
      setSelectedQuality({ id: 'hd', name: 'HD', resolution: '720p', credits: 2 });
      setSelectedStyle({ id: 'cinematic', name: 'Cinematic', description: 'Movie-style effects' });
    } catch (error) {
      console.error('Failed to load menu data:', error);
    }
  };

  const getSelectedFeature = () => {
    return videoFeatures.find(f => f.id === selectedFeature);
  };

  const getTotalCredits = () => {
    if (!user) return 0;
    
    let totalCredits = user.credits;

    if (user.subscriptionType && user.subscriptionExpires && user.subscriptionExpires > new Date()) {
      totalCredits += user.remainingToday;
    }

    return totalCredits;
  };

  const handleFeatureSelect = (featureId: string) => {
    const feature = videoFeatures.find(f => f.id === featureId);
    if (!feature) return;

    trackEvent('action', { type: 'video_feature_selected', feature: featureId });

    // Check if premium feature
    if (feature.isPremium && !user?.isPro) {
      setShowPremiumModal(true);
      return;
    }

    // Check if user has enough credits
    const totalCredits = getTotalCredits();
    const totalRequiredCredits = feature.credits + selectedQuality.credits;
    
    if (totalCredits < totalRequiredCredits) {
      Alert.alert(
        'Insufficient Credits',
        `This video requires ${totalRequiredCredits} credits (${feature.credits} + ${selectedQuality.credits} for quality). You have ${totalCredits} credits.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Get Credits', 
            onPress: () => {
              trackEvent('action', { type: 'upgrade_from_video_feature' });
              // navigation.navigate('Purchase');
            }
          }
        ]
      );
      return;
    }

    setSelectedFeature(featureId);
    setCurrentStep('create');
  };

  const handlePhotoSelect = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedPhoto(result.assets[0].uri);
      trackEvent('action', { type: 'video_photo_selected', feature: selectedFeature });
    }
  };

  const handleStartProcessing = () => {
    const feature = getSelectedFeature();
    if (!feature || !selectedPhoto) return;

    setCurrentStep('processing');
    setLoading(true);
    
    // Simulate video processing progress
    let progressValue = 0;
    const interval = setInterval(() => {
      progressValue += 2;
      setProgress(progressValue);
      
      if (progressValue >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setLoading(false);
          setCurrentStep('preview');
          trackEvent('action', { type: 'video_processing_complete', feature: selectedFeature });
        }, 1000);
      }
    }, 200);

    trackEvent('action', { type: 'video_processing_started', feature: selectedFeature });
  };

  const renderFeatureCard = (feature: typeof videoFeatures[0]) => (
    <TouchableOpacity
      key={feature.id}
      style={[
        styles.featureCard,
        selectedFeature === feature.id && styles.featureCardSelected,
      ]}
      onPress={() => handleFeatureSelect(feature.id)}
      activeOpacity={0.8}
    >
      <View style={styles.featureCardHeader}>
        <Text style={styles.featureEmoji}>{feature.emoji}</Text>
        <View style={styles.featureInfo}>
          <Text variant="title" weight="semibold" style={styles.featureName}>
            {feature.name}
          </Text>
          <Text variant="caption" color="secondary" style={styles.featureDescription}>
            {feature.description}
          </Text>
        </View>
        <View style={styles.featureMeta}>
          <Text variant="caption" color="primary" weight="medium">
            {feature.duration}
          </Text>
          {feature.isPremium && (
            <View style={styles.premiumBadge}>
              <Text variant="caption" color="primary" weight="medium">PRO</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.featureFooter}>
        <View style={styles.categoryBadge}>
          <Text variant="caption" color="primary" weight="medium">
            {feature.category}
          </Text>
        </View>
        <View style={styles.creditsBadge}>
          <Text variant="caption" color="primary" weight="medium">
            {feature.credits} credits
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderCreateStep = () => {
    const feature = getSelectedFeature();
    if (!feature) return null;

    return (
      <View style={styles.createContainer}>
        <Section title="Create Your Video" style={styles.createSection} spacing="large">
          <Spacer size="medium" />
          {/* Photo Selection */}
          <View style={styles.photoSection}>
            <Text variant="subtitle" style={styles.sectionTitle}>
              Select Photo
            </Text>
            {selectedPhoto ? (
              <View style={styles.selectedPhotoContainer}>
                <Image source={{ uri: selectedPhoto }} style={styles.selectedPhoto} />
                <TouchableOpacity
                  style={styles.changePhotoButton}
                  onPress={handlePhotoSelect}
                >
                  <Text variant="caption" color="primary">Change Photo</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.photoPlaceholder}
                onPress={handlePhotoSelect}
              >
                <Text style={styles.placeholderIcon}>📷</Text>
                <Text variant="body" color="secondary">Select Photo</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Quality Selection */}
          <View style={styles.qualitySection}>
            <Text variant="subtitle" style={styles.sectionTitle}>
              Video Quality
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {qualityOptions.map((quality) => (
                <TouchableOpacity
                  key={quality.id}
                  style={[
                    styles.qualityOption,
                    selectedQuality.id === quality.id && styles.qualityOptionSelected,
                  ]}
                  onPress={() => setSelectedQuality(quality)}
                >
                  <Text variant="title" weight="semibold" style={styles.qualityName}>
                    {quality.name}
                  </Text>
                  <Text variant="caption" color="secondary">
                    {quality.resolution}
                  </Text>
                  <Text variant="caption" color="accent">
                    +{quality.credits} credits
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Style Selection */}
          <View style={styles.styleSection}>
            <Text variant="subtitle" style={styles.sectionTitle}>
              Animation Style
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {styleOptions.map((style) => (
                <TouchableOpacity
                  key={style.id}
                  style={[
                    styles.styleOption,
                    selectedStyle.id === style.id && styles.styleOptionSelected,
                  ]}
                  onPress={() => setSelectedStyle(style)}
                >
                  <Text variant="body" weight="medium" style={styles.styleName}>
                    {style.name}
                  </Text>
                  <Text variant="caption" color="secondary">
                    {style.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Feature Details */}
          <View style={styles.featureDetails}>
            <Text variant="subtitle" style={styles.sectionTitle}>
              What You'll Get
            </Text>
            {feature.techniques.map((technique, index) => (
              <View key={index} style={styles.techniqueItem}>
                <Text style={styles.techniqueBullet}>•</Text>
                <Text variant="body" color="secondary">{technique}</Text>
              </View>
            ))}
          </View>

          {/* Create Button */}
          {selectedPhoto && (
            <Button
              variant="primary"
              onPress={handleStartProcessing}
              style={styles.createButton}
            >
              Create Video ({feature.credits + selectedQuality.credits} credits)
            </Button>
          )}
        </Section>
      </View>
    );
  };

  const renderProcessingStep = () => {
    const feature = getSelectedFeature();
    if (!feature) return null;

    return (
      <View style={styles.processingContainer}>
        <View style={styles.processingAnimation}>
          <Text style={styles.processingEmoji}>🎬</Text>
          <Animated.View 
            style={[
              styles.processingRing,
              {
                transform: [
                  {
                    rotate: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    }),
                  },
                ],
              },
            ]}
          />
        </View>

        <Text variant="title" weight="semibold" style={styles.processingTitle}>
          Creating Your Video
        </Text>
        
        <Text variant="body" color="secondary" style={styles.processingDescription}>
          {feature.name} is being generated. This may take a few minutes...
        </Text>

        <View style={styles.processingInfo}>
          <View style={styles.infoItem}>
            <Text variant="caption" color="secondary">Quality:</Text>
            <Text variant="caption" color="primary" weight="medium">
              {selectedQuality.name} ({selectedQuality.resolution})
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text variant="caption" color="secondary">Style:</Text>
            <Text variant="caption" color="primary" weight="medium">
              {selectedStyle.name}
            </Text>
          </View>
          <View style={[styles.infoItem, styles.infoItemLastChild]}>
            <Text variant="caption" color="secondary">Duration:</Text>
            <Text variant="caption" color="primary" weight="medium">
              {feature.duration}
            </Text>
          </View>
        </View>

        <View style={styles.processingProgress}>
          <Text variant="caption" color="secondary">
            {progress}% Complete
          </Text>
          <View style={styles.progressBar}>
            <View 
              style={[styles.progressFill, { width: `${progress}%` }]}
            />
          </View>
        </View>
      </View>
    );
  };

  if (currentStep === 'browse') {
    return (
      <Container>

        <Animated.ScrollView
          style={[styles.container, { opacity: fadeAnim }]}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
        >
          {/* Featured Section */}
          <Section title="Featured AI Videos" emoji="⭐" style={styles.featuredSection} spacing="large">
            <Spacer size="medium" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {videoFeatures.slice(0, 3).map((feature) => (
                <Card
                  key={feature.id}
                  variant="video"
                  size="medium"
                  title={feature.name}
                  metadata={feature.duration}
                  isPremium={feature.isPremium}
                  onPress={() => handleFeatureSelect(feature.id)}
                  style={styles.featuredCard}
                />
              ))}
            </ScrollView>
          </Section>

          {/* All Features */}
          <Section title="All Video Features" style={styles.allFeaturesSection} spacing="large">
            <Spacer size="medium" />
            <Column spacing="medium">
              {videoFeatures.map(renderFeatureCard)}
            </Column>
          </Section>

          <Spacer size="large" />
        </Animated.ScrollView>

        <PremiumModal
          visible={showPremiumModal}
          onClose={() => setShowPremiumModal(false)}
          onUpgrade={() => {
            setShowPremiumModal(false);
            // navigation.navigate('Purchase');
          }}
        />
      </Container>
    );
  }

  if (currentStep === 'create') {
    return (
      <Container>

        <ScrollView style={styles.container}>
          {renderCreateStep()}
        </ScrollView>
      </Container>
    );
  }

  if (currentStep === 'processing') {
    return (
      <Container>

        <View style={styles.container}>
          {renderProcessingStep()}
        </View>

        <LoadingModal
          visible={loading}
          message="Creating your video..."
          progress={progress}
        />
      </Container>
    );
  }

  // Preview step would go here
  return (
    <Container>
      <View style={styles.container}>
        <Text variant="title">Video preview would be displayed here</Text>
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  simpleHeader: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.medium,
    paddingHorizontal: spacing.large,
    backgroundColor: colors.background.primary,
  },
  
  contentContainer: {
    paddingBottom: 40,
  },
  
  featuredSection: {
    paddingHorizontal: spacing.large,
    marginBottom: spacing.extraLarge,
  },
  
  featuredCard: {
    marginRight: 16,
  },
  
  allFeaturesSection: {
    paddingHorizontal: spacing.large,
    marginBottom: spacing.extraLarge,
  },
  
  featureCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  
  featureCardSelected: {
    borderColor: '#FF3B30',
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
  },
  
  featureCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  
  featureEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  
  featureInfo: {
    flex: 1,
  },
  
  featureName: {
    marginBottom: 4,
  },
  
  featureDescription: {
    lineHeight: 18,
  },
  
  featureMeta: {
    alignItems: 'flex-end',
  },
  
  featureFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  categoryBadge: {
    backgroundColor: 'rgba(52, 199, 89, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  
  creditsBadge: {
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  
  premiumBadge: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  
  createContainer: {
    flex: 1,
  },
  
  createSection: {
    paddingHorizontal: spacing.large,
    marginBottom: spacing.extraLarge,
  },
  
  photoSection: {
    marginBottom: spacing.extraLarge,
  },
  
  sectionTitle: {
    marginBottom: spacing.large,
  },
  
  selectedPhotoContainer: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
  },
  
  selectedPhoto: {
    width: '100%',
    height: 200,
    borderRadius: 16,
  },
  
  changePhotoButton: {
    position: 'absolute',
    top: spacing.medium,
    right: spacing.medium,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
    borderRadius: 12,
  },
  
  photoPlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#2C2C2E',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  placeholderIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  
  qualitySection: {
    marginBottom: spacing.large,
  },
  
  qualityOption: {
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    padding: spacing.medium,
    marginRight: spacing.medium,
    minWidth: 120,
    alignItems: 'center',
  },
  
  qualityOptionSelected: {
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
    borderColor: '#FF3B30',
    borderWidth: 1,
  },
  
  qualityName: {
    marginBottom: 4,
  },
  
  styleSection: {
    marginBottom: spacing.large,
  },
  
  styleOption: {
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    padding: spacing.medium,
    marginRight: spacing.medium,
    minWidth: 140,
    alignItems: 'center',
  },
  
  styleOptionSelected: {
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
    borderColor: '#FF3B30',
    borderWidth: 1,
  },
  
  styleName: {
    marginBottom: 4,
  },
  
  featureDetails: {
    marginBottom: spacing.large,
  },
  
  techniqueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  
  techniqueBullet: {
    color: '#8E8E93',
    marginRight: 8,
  },
  
  createButton: {
    marginBottom: spacing.medium,
  },
  
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  
  processingAnimation: {
    marginBottom: 32,
    position: 'relative',
  },
  
  processingEmoji: {
    fontSize: 64,
  },
  
  processingRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderWidth: 3,
    borderColor: '#FF3B30',
    borderRadius: 40,
    borderTopColor: 'transparent',
  },
  
  processingTitle: {
    textAlign: 'center',
    marginBottom: 16,
  },
  
  processingDescription: {
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  
  processingInfo: {
    width: '100%',
    marginBottom: 32,
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
  },
  
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  
  infoItemLastChild: {
    marginBottom: 0,
  },
  
  processingProgress: {
    width: '100%',
  },
  
  progressBar: {
    height: 4,
    backgroundColor: '#2C2C2E',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 8,
  },
  
  progressFill: {
    height: '100%',
    backgroundColor: '#FF3B30',
    borderRadius: 2,
  },
});