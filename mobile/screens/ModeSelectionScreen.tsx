import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp, RouteProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import { useUser } from '../contexts/UserContext';
import { useAnalytics } from '../contexts/AnalyticsContext';
import { useTranslation } from 'react-i18next';

// Import our new components
import { Container, Section, Row, Column, Spacer } from '../components/Layout';
import { Text, SectionHeader } from '../components/Text';
import { Button, IconButton } from '../components/Button';
import { Card, ModeCard } from '../components/Card';
import { Header, NavigationButton } from '../components/Navigation';
import { Modal, LoadingModal } from '../components/Modal';
import { NavigationService, NavigationItem } from '../services/NavigationService';

type ModeSelectionScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ModeSelection'>;
type ModeSelectionScreenRouteProp = RouteProp<RootStackParamList, 'ModeSelection'>;


export default function ModeSelectionScreenNew() {
  const route = useRoute<ModeSelectionScreenRouteProp>();
  const navigation = useNavigation<ModeSelectionScreenNavigationProp>();
  const { t } = useTranslation();
  const { user } = useUser();
  const { trackEvent } = useAnalytics();
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState<string | null>(null);
  const [menuLoading, setMenuLoading] = useState(true);
  const [enhancementModes, setEnhancementModes] = useState<NavigationItem[]>([]);
  
  const { imageUri } = route.params;
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    trackEvent('screen_view', { screen: 'mode_selection' });
    loadMenuData();
    
    // Entry animations
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
      setMenuLoading(true);
      const navigationService = NavigationService.getInstance();
      await navigationService.loadMenuData();
      
      const enhanceSections = navigationService.getScreenItems('enhance');
      setEnhancementModes(enhanceSections);
    } catch (error) {
      console.error('Failed to load menu data:', error);
    } finally {
      setMenuLoading(false);
    }
  };

  const getTotalCredits = () => {
    if (!user) return 0;
    
    let totalCredits = user.credits;

    if (user.subscriptionType && user.subscriptionExpires && user.subscriptionExpires > new Date()) {
      totalCredits += user.remainingToday;
    }

    return totalCredits;
  };

  const handleModeSelect = async (modeId: string) => {
    const mode = enhancementModes.find(m => m.id === modeId);
    if (!mode) return;

    trackEvent('action', { type: 'mode_selected', mode: modeId });

    // Check if user has enough credits
    const totalCredits = getTotalCredits();
    const requiredCredits = mode.meta_data?.credits || 1;
    
    if (totalCredits < requiredCredits) {
      Alert.alert(
        'Insufficient Credits',
        `This enhancement requires ${requiredCredits} credits. You have ${totalCredits} credits.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Get Credits', 
            onPress: () => {
              trackEvent('action', { type: 'upgrade_from_mode_selection' });
              // navigation.navigate('Purchase');
            }
          }
        ]
      );
      return;
    }

    // Check if premium feature
    if (mode.is_premium && !user?.isPro) {
      Alert.alert(
        'Premium Feature',
        'This enhancement mode is only available for premium users.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Upgrade to PRO', 
            onPress: () => {
              trackEvent('action', { type: 'premium_upgrade_from_mode' });
              // navigation.navigate('Purchase');
            }
          }
        ]
      );
      return;
    }

    setSelectedMode(modeId);
    
    // Navigate to preview screen
    setTimeout(() => {
      navigation.navigate('Preview', {
        imageUri,
        selectedMode: modeId as any,
      });
    }, 300);
  };

  const handleShowDetails = (modeId: string) => {
    setShowDetails(modeId);
    trackEvent('action', { type: 'mode_details_viewed', mode: modeId });
  };

  const renderModeCard = (mode: NavigationItem) => (
    <TouchableOpacity
      key={mode.id}
      style={[
        styles.modeCard,
        selectedMode === mode.id && styles.modeCardSelected,
      ]}
      onPress={() => handleModeSelect(mode.id)}
      activeOpacity={0.8}
    >
      <View style={styles.modeCardHeader}>
        <Text style={styles.modeEmoji}>{mode.icon}</Text>
        <View style={styles.modeInfo}>
          <Text variant="title" weight="semibold" style={styles.modeName}>
            {mode.title}
          </Text>
          <Text variant="caption" color="secondary" style={styles.modeDescription}>
            {mode.description}
          </Text>
        </View>
        <View style={styles.modeMeta}>
          <Text variant="caption" color="secondary">
            {mode.meta_data?.processing_time}
          </Text>
          <View style={styles.creditsBadge}>
            <Text variant="caption" color="primary" weight="medium">
              {mode.meta_data?.credits || 1}
            </Text>
          </View>
        </View>
      </View>

      {/* Features */}
      <View style={styles.modeFeatures}>
        {mode.meta_data?.features?.slice(0, 2).map((feature: string, index: number) => (
          <View key={index} style={styles.featureItem}>
            <Text style={styles.featureBullet}>•</Text>
            <Text variant="caption" color="secondary" style={styles.featureText}>
              {feature}
            </Text>
          </View>
        ))}
        {mode.meta_data?.features && mode.meta_data.features.length > 2 && (
          <Text 
            variant="caption" 
            color="accent" 
            style={styles.moreFeatures}
            onPress={() => handleShowDetails(mode.id)}
          >
            +{mode.meta_data.features.length - 2} more
          </Text>
        )}
      </View>

      {/* Badges */}
      <View style={styles.modeBadges}>
        {mode.meta_data?.isRecommended && (
          <View style={styles.recommendedBadge}>
            <Text variant="caption" color="primary" weight="medium">
              RECOMMENDED
            </Text>
          </View>
        )}
        {mode.is_premium && (
          <View style={styles.premiumBadge}>
            <Text variant="caption" color="primary" weight="medium">
              PRO
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <Container>
      {/* Header */}
      <Header
        title="Choose Enhancement"
        subtitle="Select the best enhancement for your photo"
        leftAction={
          <NavigationButton
            icon={<Text variant="title">←</Text>}
            onPress={() => navigation.goBack()}
          />
        }
        rightAction={
          <View style={styles.headerRight}>
            <Text variant="caption" color="secondary">
              {getTotalCredits()} credits
            </Text>
          </View>
        }
      />

      {/* Main Content */}
      <Animated.ScrollView
        style={[styles.container, { opacity: fadeAnim }]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Image Preview */}
        <Section style={styles.imagePreviewSection}>
          <View style={styles.imagePreviewContainer}>
            {/* Add image preview component here */}
            <View style={styles.imagePlaceholder}>
              <Text variant="title" style={styles.placeholderText}>📷</Text>
            </View>
          </View>
        </Section>

        {/* Enhancement Modes */}
        <Section title="Enhancement Modes" style={styles.modesSection}>
          {menuLoading ? (
            <ActivityIndicator size="large" color="#FF3B30" />
          ) : (
            <Column spacing="medium">
              {enhancementModes.map(renderModeCard)}
            </Column>
          )}
        </Section>

        <Spacer size="large" />
      </Animated.ScrollView>

      {/* Details Modal */}
      {showDetails && (
        <Modal
          visible={!!showDetails}
          onClose={() => setShowDetails(null)}
          title="Enhancement Details"
          variant="centered"
        >
          <View style={styles.detailsContent}>
            {enhancementModes
              .filter(mode => mode.id === showDetails)
              .map(mode => (
                <View key={mode.id}>
                  <Text variant="title" weight="semibold" style={styles.detailsTitle}>
                    {mode.icon} {mode.title}
                  </Text>
                  <Text variant="body" color="secondary" style={styles.detailsDescription}>
                    {mode.description}
                  </Text>
                  
                  <Text variant="subtitle" style={styles.featuresTitle}>Features:</Text>
                  {mode.meta_data?.features?.map((feature: string, index: number) => (
                    <View key={index} style={styles.detailsFeatureItem}>
                      <Text style={styles.detailsBullet}>•</Text>
                      <Text variant="body" color="secondary">{feature}</Text>
                    </View>
                  ))}
                  
                  <View style={styles.detailsMeta}>
                    <Text variant="caption" color="secondary">
                      Processing time: {mode.meta_data?.processing_time}
                    </Text>
                    <Text variant="caption" color="secondary">
                      Credits required: {mode.meta_data?.credits || 1}
                    </Text>
                  </View>
                </View>
              ))}
          </View>
        </Modal>
      )}

      {/* Loading Modal */}
      <LoadingModal
        visible={loading}
        message="Processing your enhancement..."
      />
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  contentContainer: {
    paddingBottom: 40,
  },
  
  imagePreviewSection: {
    marginBottom: 32,
    paddingHorizontal: 24,
  },
  
  imagePreviewContainer: {
    alignItems: 'center',
  },
  
  imagePlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  placeholderText: {
    fontSize: 48,
  },
  
  modesSection: {
    paddingHorizontal: 24,
  },
  
  modeCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  
  modeCardSelected: {
    borderColor: '#FF3B30',
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
  },
  
  modeCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  
  modeEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  
  modeInfo: {
    flex: 1,
  },
  
  modeName: {
    marginBottom: 4,
  },
  
  modeDescription: {
    lineHeight: 18,
  },
  
  modeMeta: {
    alignItems: 'flex-end',
  },
  
  creditsBadge: {
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  
  modeFeatures: {
    marginBottom: 12,
  },
  
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  
  featureBullet: {
    color: '#8E8E93',
    marginRight: 8,
  },
  
  featureText: {
    flex: 1,
  },
  
  moreFeatures: {
    marginTop: 4,
    textDecorationLine: 'underline',
  },
  
  modeBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  
  recommendedBadge: {
    backgroundColor: '#34C759',
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
  
  headerRight: {
    alignItems: 'flex-end',
  },
  
  detailsContent: {
    padding: 16,
  },
  
  detailsTitle: {
    marginBottom: 8,
  },
  
  detailsDescription: {
    marginBottom: 16,
    lineHeight: 20,
  },
  
  featuresTitle: {
    marginBottom: 8,
  },
  
  detailsFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  
  detailsBullet: {
    color: '#8E8E93',
    marginRight: 8,
  },
  
  detailsMeta: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#2C2C2E',
  },
});