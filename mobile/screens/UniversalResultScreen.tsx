import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useAnalytics } from '../contexts/AnalyticsContext';

const { width: screenWidth } = Dimensions.get('window');

// Keep for potential future use
const _screenWidth = screenWidth;

type UniversalResultScreenNavigationProp = StackNavigationProp<{
  UniversalResult: {
    originalUri: string;
    enhancedUri: string;
    enhancementId: string;
    watermark: boolean;
    mode: 'enhance' | 'filter' | 'video' | 'custom-edit' | 'ai-generation';
    processingTime: number;
    processingType?: string;
  };
}, 'UniversalResult'>;

interface UniversalResultScreenProps {
  route: {
    params: {
      originalUri: string;
      enhancedUri: string;
      enhancementId: string;
      watermark: boolean;
      mode: 'enhance' | 'filter' | 'video' | 'custom-edit' | 'ai-generation';
      processingTime: number;
      processingType?: string;
    };
  };
}

export default function UniversalResultScreen({ route }: UniversalResultScreenProps) {
  const navigation = useNavigation<UniversalResultScreenNavigationProp>();
  // const { t } = useTranslation();
  const { trackEvent } = useAnalytics();
  
  const { 
    originalUri, 
    enhancedUri, 
    enhancementId, 
    watermark, 
    mode, 
    processingTime,
    _processingType
  } = route.params;
  
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccessfully, setSavedSuccessfully] = useState(false);
  const [showBefore, setShowBefore] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const successAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    trackEvent('screen_view', { 
      screen: 'universal_result', 
      mode, 
      processing_time: processingTime,
      has_watermark: watermark 
    });
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
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

  const saveToGallery = async () => {
    try {
      setIsSaving(true);
      trackEvent('action', { type: 'save_to_gallery', mode });

      // Request permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant gallery permission to save photos');
        return;
      }

      // Download and save the image
      const fileUri = FileSystem.documentDirectory + `processed_${enhancementId}.png`;
      await FileSystem.downloadAsync(enhancedUri, fileUri);
      
      await MediaLibrary.saveToLibraryAsync(fileUri);
      
      setSavedSuccessfully(true);
      
      // Success animation
      Animated.spring(successAnim, {
        toValue: 1,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }).start();

      trackEvent('action', { type: 'save_success', mode });
      
      // Clean up temp file
      await FileSystem.deleteAsync(fileUri, { idempotent: true });
      
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to save image to gallery');
      trackEvent('action', { type: 'save_failed', mode, error: error?.message || 'unknown' });
    } finally {
      setIsSaving(false);
    }
  };

  const shareImage = async () => {
    try {
      trackEvent('action', { type: 'share_image', mode });

      // Check if sharing is available
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Error', 'Sharing is not available on this device');
        return;
      }

      // Download image to temp location
      const fileUri = FileSystem.documentDirectory + `processed_${enhancementId}.png`;
      await FileSystem.downloadAsync(enhancedUri, fileUri);

      await Sharing.shareAsync(fileUri, {
        mimeType: 'image/jpeg',
        dialogTitle: 'Share Processed Image',
      });

      trackEvent('action', { type: 'share_success', mode });

      // Clean up temp file
      await FileSystem.deleteAsync(fileUri, { idempotent: true });
      
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Error', 'Failed to share image');
      trackEvent('action', { type: 'share_failed', mode, error: error?.message || 'unknown' });
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  };

  const tryAgain = () => {
    trackEvent('action', { type: 'try_again', mode });
    // Navigate back to the appropriate tab based on mode
    if (mode === 'enhance' || mode === 'filter' || mode === 'video' || mode === 'custom-edit') {
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    } else {
      navigation.goBack();
    }
  };

  const getProcessingTitle = () => {
    const titles = {
      enhance: 'Enhancement Complete',
      filter: 'Filter Applied',
      video: 'Video Created',
      'custom-edit': 'Edit Applied',
      'ai-generation': 'AI Generated',
    };
    return titles[mode] || 'Processing Complete';
  };

  const formatProcessingTime = (ms: number) => {
    const seconds = Math.round(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Animated.View 
        style={[
          styles.header,
          { opacity: fadeAnim }
        ]}
      >
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>{getProcessingTitle()}</Text>
          <Text style={styles.subtitle}>
            Completed in {formatProcessingTime(processingTime)}
          </Text>
        </View>
        <View style={styles.headerSpacer} />
      </Animated.View>

      {/* Result Image */}
      <Animated.View 
        style={[
          styles.imageContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <Image 
          source={{ uri: showBefore ? originalUri : enhancedUri }} 
          style={styles.resultImage} 
          resizeMode="contain"
        />
        
        {/* Before/After Toggle */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity 
            style={[styles.toggleButton, showBefore && styles.toggleButtonActive]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowBefore(true);
            }}
          >
            <Text style={[styles.toggleText, showBefore && styles.toggleTextActive]}>
              Before
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.toggleButton, !showBefore && styles.toggleButtonActive]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowBefore(false);
            }}
          >
            <Text style={[styles.toggleText, !showBefore && styles.toggleTextActive]}>
              After
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Watermark indicator */}
        {watermark && (
          <View style={styles.watermarkBadge}>
            <Text style={styles.watermarkText}>DEMO</Text>
          </View>
        )}

        {/* Success checkmark */}
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
              <Text style={styles.successCheck}>✓</Text>
            </View>
            <Text style={styles.successText}>Saved to Photos</Text>
          </Animated.View>
        )}
      </Animated.View>

      {/* Action Buttons */}
      <Animated.View 
        style={[
          styles.actionsContainer,
          { opacity: fadeAnim }
        ]}
      >
        {/* Primary Actions */}
        <View style={styles.primaryActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.saveButton]}
            onPress={saveToGallery}
            disabled={isSaving}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={savedSuccessfully ? ['#28A745', '#20C997'] : ['#FF3B30', '#FF6B6B']}
              style={styles.actionGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {isSaving ? (
                <>
                  <Text style={styles.actionIcon}>⏳</Text>
                  <Text style={styles.actionText}>Saving...</Text>
                </>
              ) : savedSuccessfully ? (
                <>
                  <Text style={styles.actionIcon}>✓</Text>
                  <Text style={styles.actionText}>Saved</Text>
                </>
              ) : (
                <>
                  <Text style={styles.actionIcon}>💾</Text>
                  <Text style={styles.actionText}>Save to Photos</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.shareButton]}
            onPress={shareImage}
            activeOpacity={0.9}
          >
            <View style={styles.secondaryAction}>
              <Text style={styles.secondaryIcon}>📤</Text>
              <Text style={styles.secondaryText}>Share</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Secondary Actions */}
        <View style={styles.secondaryActions}>
          <TouchableOpacity
            style={styles.restartButton}
            onPress={tryAgain}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
              style={styles.restartGradient}
            >
              <Text style={styles.restartIcon}>🔄</Text>
              <Text style={styles.restartText}>Try Again</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Stats */}
      <Animated.View 
        style={[
          styles.statsContainer,
          { opacity: fadeAnim }
        ]}
      >
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{mode}</Text>
            <Text style={styles.statLabel}>Processing Type</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatProcessingTime(processingTime)}</Text>
            <Text style={styles.statLabel}>Processing Time</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{watermark ? 'Demo' : 'Full'}</Text>
            <Text style={styles.statLabel}>Quality</Text>
          </View>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    height: 88,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 44,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#8E8E93',
  },
  headerSpacer: {
    width: 44,
  },
  imageContainer: {
    flex: 1,
    marginHorizontal: 20,
    marginVertical: 20,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1C1C1E',
    position: 'relative',
  },
  resultImage: {
    width: '100%',
    height: '100%',
  },
  watermarkBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#FF3B30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  watermarkText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  successOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successCircle: {
    width: 80,
    height: 80,
    backgroundColor: '#28A745',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successCheck: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '600',
  },
  successText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  actionsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  primaryActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },
  saveButton: {
    flex: 2,
  },
  shareButton: {
    flex: 1,
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  actionIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#2C2C2E',
    borderWidth: 1,
    borderColor: '#3C3C3E',
  },
  secondaryIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  secondaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  secondaryActions: {
    alignItems: 'center',
  },
  restartButton: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  restartGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  restartIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  restartText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  statsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#2C2C2E',
    marginHorizontal: 12,
  },
  statValue: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  statLabel: {
    color: '#8E8E93',
    fontSize: 12,
  },
  toggleContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
  },
  toggleButtonActive: {
    backgroundColor: '#FF3B30',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
});