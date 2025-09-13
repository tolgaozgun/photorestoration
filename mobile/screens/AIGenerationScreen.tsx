import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
  Image,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import { useUser } from '../contexts/UserContext';
import { useAnalytics } from '../contexts/AnalyticsContext';
import { useTranslation } from 'react-i18next';

// Import our new components
import { Container, Section, Row, Column, Spacer } from '../components/Layout';
import { Text } from '../components/Text';
import { Button } from '../components/Button';
import { LoadingModal, PremiumModal } from '../components/Modal';
import { spacing, colors } from '../theme';
import { NavigationService, NavigationItem } from '../services/NavigationService';

type AIGenerationScreenNavigationProp = StackNavigationProp<RootStackParamList, any>;


interface UploadedPhoto {
  id: string;
  uri: string;
  uploaded: boolean;
}

export default function AIGenerationScreen() {
  const route = useRoute();
  const { user } = useUser();
  const { trackEvent } = useAnalytics();
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const [uploadedPhotos, setUploadedPhotos] = useState<UploadedPhoto[]>([]);
  const [currentStep, setCurrentStep] = useState<'intro' | 'upload' | 'processing' | 'results'>('intro');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [menuLoading, setMenuLoading] = useState(true);
  const [aiFeatures, setAiFeatures] = useState<NavigationItem[]>([]);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    trackEvent('screen_view', { screen: 'ai_generation' });
    loadMenuData();
    
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

  const loadMenuData = async () => {
    try {
      setMenuLoading(true);
      const navigationService = NavigationService.getInstance();
      await navigationService.loadMenuData();
      
      const createSections = navigationService.getScreenItems('create');
      setAiFeatures(createSections);
      
      // Get feature from route params or default to first
      const featureId = route.params?.featureId || (createSections[0]?.id || null);
      setSelectedFeature(featureId);
    } catch (error) {
      console.error('Failed to load menu data:', error);
    } finally {
      setMenuLoading(false);
    }
  };

  const getSelectedFeature = () => {
    return aiFeatures.find(f => f.id === selectedFeature);
  };

  const getTotalCredits = () => {
    if (!user) return 0;
    
    let totalCredits = user.credits;

    if (user.subscriptionType && user.subscriptionExpires && user.subscriptionExpires > new Date()) {
      totalCredits += user.remainingToday;
    }

    return totalCredits;
  };

  const handleFeatureSelect = async (featureId: string) => {
    const feature = aiFeatures.find(f => f.id === featureId);
    if (!feature) return;

    trackEvent('action', { type: 'ai_feature_selected', feature: featureId });

    // Check if premium feature
    if (feature.is_premium && !user?.isPro) {
      setShowPremiumModal(true);
      return;
    }

    // Check if user has enough credits
    const totalCredits = getTotalCredits();
    const requiredCredits = feature.meta_data?.credits || 1;
    
    if (totalCredits < requiredCredits) {
      Alert.alert(
        'Insufficient Credits',
        `This feature requires ${requiredCredits} credits. You have ${totalCredits} credits.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Get Credits', 
            onPress: () => {
              trackEvent('action', { type: 'upgrade_from_ai_feature' });
              // navigation.navigate('Purchase');
            }
          }
        ]
      );
      return;
    }

    setSelectedFeature(featureId);
  };

  const handleStartUpload = () => {
    setCurrentStep('upload');
    trackEvent('action', { type: 'ai_upload_started', feature: selectedFeature });
  };

  const pickImage = async () => {
    const feature = getSelectedFeature();
    if (!feature) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      const newPhoto: UploadedPhoto = {
        id: Date.now().toString(),
        uri: result.assets[0].uri,
        uploaded: true,
      };

      setUploadedPhotos(prev => [...prev, newPhoto]);
      trackEvent('action', { type: 'ai_photo_uploaded', feature: selectedFeature });
    }
  };

  const takePhoto = async () => {
    // Implement camera functionality
    trackEvent('action', { type: 'ai_camera_opened', feature: selectedFeature });
  };

  const removePhoto = (photoId: string) => {
    setUploadedPhotos(prev => prev.filter(photo => photo.id !== photoId));
  };

  const handleStartProcessing = () => {
    const feature = getSelectedFeature();
    if (!feature) return;

    const minPhotos = feature.meta_data?.minPhotos || 1;
    if (uploadedPhotos.length < minPhotos) {
      Alert.alert(
        'More Photos Needed',
        `Please upload at least ${minPhotos} photos to continue.`,
        [{ text: 'OK' }]
      );
      return;
    }

    setCurrentStep('processing');
    setLoading(true);
    
    // Simulate processing progress
    let progressValue = 0;
    const interval = setInterval(() => {
      progressValue += 5;
      setProgress(progressValue);
      
      if (progressValue >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setLoading(false);
          setCurrentStep('results');
          trackEvent('action', { type: 'ai_processing_complete', feature: selectedFeature });
        }, 1000);
      }
    }, 300);

    trackEvent('action', { type: 'ai_processing_started', feature: selectedFeature });
  };

  const renderFeatureCard = (feature: NavigationItem) => (
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
        <Text style={styles.featureEmoji}>{feature.icon}</Text>
        <View style={styles.featureInfo}>
          <Text variant="title" weight="semibold" style={styles.featureName}>
            {feature.title}
          </Text>
          <Text variant="caption" color="secondary" style={styles.featureDescription}>
            {feature.description}
          </Text>
        </View>
        {feature.is_premium && (
          <View style={styles.premiumBadge}>
            <Text variant="caption" color="primary" weight="medium">PRO</Text>
          </View>
        )}
      </View>

      <View style={styles.featureMeta}>
        <View style={styles.metaItem}>
          <Text variant="caption" color="secondary">Photos:</Text>
          <Text variant="caption" color="primary" weight="medium">{feature.meta_data?.minPhotos || 1}+</Text>
        </View>
        <View style={styles.metaItem}>
          <Text variant="caption" color="secondary">Time:</Text>
          <Text variant="caption" color="primary" weight="medium">{feature.meta_data?.processing_time}</Text>
        </View>
        <View style={styles.metaItem}>
          <Text variant="caption" color="secondary">Credits:</Text>
          <Text variant="caption" color="primary" weight="medium">{feature.meta_data?.credits || 1}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderUploadStep = () => {
    const feature = getSelectedFeature();
    if (!feature) return null;

    return (
      <View style={styles.uploadContainer}>
        <Section title="Upload Your Photos" style={styles.uploadSection} spacing="large">
          <Spacer size="medium" />
          <Text variant="body" color="secondary" style={styles.uploadInstructions}>
            Upload at least {feature.meta_data?.minPhotos || 1} clear photos of yourself. For best results, include different angles and expressions.
          </Text>

          {/* Photo grid */}
          <View style={styles.photoGrid}>
            {uploadedPhotos.map((photo, _index) => (
              <View key={photo.id} style={styles.photoItem}>
                <Image source={{ uri: photo.uri }} style={styles.photoImage} />
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removePhoto(photo.id)}
                >
                  <Text style={styles.removeButtonText}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
            
            {/* Add photo buttons */}
            {[...Array(Math.max(0, (feature.meta_data?.minPhotos || 1) - uploadedPhotos.length))].map((_, index) => (
              <TouchableOpacity
                key={`add-${index}`}
                style={styles.addPhotoButton}
                onPress={pickImage}
              >
                <Text style={styles.addPhotoIcon}>+</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Row spacing="medium" style={styles.uploadActions}>
            <Button
              variant="secondary"
              onPress={takePhoto}
              icon={<Text variant="title">📷</Text>}
            >
              Take Photo
            </Button>
            <Button
              variant="secondary"
              onPress={pickImage}
              icon={<Text variant="title">📱</Text>}
            >
              Choose Photo
            </Button>
          </Row>
        </Section>

        {/* Progress indicator */}
        <Section style={styles.progressSection}>
          <View style={styles.progressContainer}>
            <Text variant="body" color="secondary" style={styles.progressText}>
              {uploadedPhotos.length} of {feature.meta_data?.minPhotos || 1} photos uploaded
            </Text>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { width: `${(uploadedPhotos.length / (feature.meta_data?.minPhotos || 1)) * 100}%` }
                ]}
              />
            </View>
          </View>

          {uploadedPhotos.length >= (feature.meta_data?.minPhotos || 1) && (
            <Button
              variant="primary"
              onPress={handleStartProcessing}
              style={styles.startButton}
            >
              Start AI Generation
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
          <Text style={styles.processingEmoji}>🧠</Text>
          <Animated.View 
            style={[
              styles.processingRing,
              {
                transform: [
                  {
                    rotate: slideAnim.interpolate({
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
          AI is Learning Your Features
        </Text>
        
        <Text variant="body" color="secondary" style={styles.processingDescription}>
          {feature.name} is being generated. This may take a few minutes...
        </Text>

        <View style={styles.processingSteps}>
          {feature.meta_data?.steps?.map((step: string, index: number) => (
            <View key={index} style={styles.processingStep}>
              <View style={[
                styles.stepIndicator,
                index <= (progress / 25) && styles.stepIndicatorActive
              ]}>
                <Text style={[
                  styles.stepNumber,
                  index <= (progress / 25) && styles.stepNumberActive
                ]}>
                  {index + 1}
                </Text>
              </View>
              <Text variant="caption" color="secondary" style={styles.stepText}>
                {step}
              </Text>
            </View>
          ))}
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

  if (currentStep === 'intro') {
    return (
      <Container>

        <Animated.ScrollView
          style={[styles.container, { opacity: fadeAnim }]}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
        >
          <Section style={styles.introSection}>
            <Text variant="title" weight="bold" style={styles.introTitle}>
              ✨ AI Generation Studio
            </Text>
            <Text variant="body" color="secondary" style={styles.introDescription}>
              Transform yourself with cutting-edge AI technology. Upload your photos and let AI create amazing content just for you.
            </Text>
          </Section>

          <Section title="Choose AI Feature" style={styles.featuresSection} spacing="large">
            <Spacer size="medium" />
            {menuLoading ? (
              <ActivityIndicator size="large" color="#FF3B30" />
            ) : (
              <Column spacing="large">
                {aiFeatures.map(renderFeatureCard)}
              </Column>
            )}
          </Section>

          <Spacer size="large" />
        </Animated.ScrollView>

        {selectedFeature && (
          <Button
            variant="primary"
            onPress={handleStartUpload}
            style={styles.startButton}
          >
            Start Creating
          </Button>
        )}

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

  if (currentStep === 'upload') {
    return (
      <Container>

        <ScrollView style={styles.container}>
          {renderUploadStep()}
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
          message="AI is working its magic..."
          progress={progress}
        />
      </Container>
    );
  }

  // Results step would go here
  return (
    <Container>
      <View style={styles.container}>
        <Text variant="title">Results would be displayed here</Text>
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
  
  introSection: {
    paddingHorizontal: spacing.large,
    marginBottom: spacing.extraLarge,
  },
  
  introTitle: {
    textAlign: 'center',
    marginBottom: 16,
  },
  
  introDescription: {
    textAlign: 'center',
    lineHeight: 24,
  },
  
  featuresSection: {
    paddingHorizontal: spacing.large,
    marginBottom: spacing.extraLarge,
  },
  
  featureCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  
  metaItem: {
    alignItems: 'center',
  },
  
  premiumBadge: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  
  uploadContainer: {
    flex: 1,
  },
  
  uploadSection: {
    paddingHorizontal: spacing.large,
  },
  
  uploadInstructions: {
    textAlign: 'center',
    marginBottom: spacing.large,
    lineHeight: 22,
  },
  
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.small,
    marginBottom: spacing.large,
  },
  
  photoItem: {
    width: '33.33%',
    padding: spacing.small,
    position: 'relative',
  },
  
  photoImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
  },
  
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  removeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  addPhotoButton: {
    width: '33.33%',
    padding: spacing.small,
  },
  
  addPhotoIcon: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    textAlign: 'center',
    lineHeight: 100,
    fontSize: 32,
    color: '#8E8E93',
  },
  
  uploadActions: {
    paddingHorizontal: spacing.large,
  },
  
  progressSection: {
    paddingHorizontal: spacing.large,
  },
  
  progressContainer: {
    marginBottom: 16,
  },
  
  progressText: {
    marginBottom: 8,
  },
  
  progressBar: {
    height: 4,
    backgroundColor: '#2C2C2E',
    borderRadius: 2,
    overflow: 'hidden',
  },
  
  progressFill: {
    height: '100%',
    backgroundColor: '#FF3B30',
    borderRadius: 2,
  },
  
  startButton: {
    marginHorizontal: spacing.medium,
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
  
  processingSteps: {
    width: '100%',
    marginBottom: 32,
  },
  
  processingStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  
  stepIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2C2C2E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  
  stepIndicatorActive: {
    backgroundColor: '#FF3B30',
  },
  
  stepNumber: {
    color: '#8E8E93',
    fontWeight: 'bold',
  },
  
  stepNumberActive: {
    color: '#FFFFFF',
  },
  
  stepText: {
    flex: 1,
  },
  
  processingProgress: {
    width: '100%',
  },
});