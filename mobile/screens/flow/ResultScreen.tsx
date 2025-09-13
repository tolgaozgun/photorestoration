import * as React from 'react'
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
  Share,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useAnalytics } from '../../contexts/AnalyticsContext';

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

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.replace('PhotoInput');
  };

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const successAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    trackEvent('screen_view', { 
      screen: 'result', 
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
        Alert.alert(t('home.permissionRequired'), t('home.galleryPermission'));
        return;
      }

      // Download and save the image
      const fileUri = FileSystem.documentDirectory + `restored_photo_${enhancementId}.png`;
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
      Alert.alert(t('restoration.error'), t('result.saveErrorMessage'));
      trackEvent('action', { type: 'save_failed', mode, error: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const shareImage = async () => {
    try {
      trackEvent('action', { type: 'share_image', mode });

      // Check if sharing is available
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert(t('restoration.error'), t('result.shareNotAvailableMessage'));
        return;
      }

      // Download image to temp location
      const fileUri = FileSystem.documentDirectory + `restored_photo_${enhancementId}.png`;
      await FileSystem.downloadAsync(enhancedUri, fileUri);

      await Sharing.shareAsync(fileUri, {
        mimeType: 'image/jpeg',
        dialogTitle: 'Share Restored Photo',
      });

      trackEvent('action', { type: 'share_success', mode });

      // Clean up temp file
      await FileSystem.deleteAsync(fileUri, { idempotent: true });
      
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert(t('restoration.error'), t('result.shareErrorMessage'));
      trackEvent('action', { type: 'share_failed', mode, error: error.message });
    }
  };

  const tryAnotherPhoto = () => {
    trackEvent('action', { type: 'start_new_restoration' });
    navigation.navigate('PhotoInput');
  };

  const viewHistory = () => {
    trackEvent('action', { type: 'view_history_from_result' });
    navigation.navigate('History');
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
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>{t('result.title')}</Text>
          <Text style={styles.subtitle}>
            {t('result.subtitle', { mode: t(`modes.${mode}.title`), time: formatProcessingTime(processingTime) })}
          </Text>
        </View>
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
              {t('result.before')}
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
              {t('result.after')}
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Watermark indicator */}
        {watermark && (
          <View style={styles.watermarkBadge}>
            <Text style={styles.watermarkText}>{t('result.watermarkText')}</Text>
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
            <Text style={styles.successText}>{t('result.savedToPhotos')}</Text>
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
              colors={savedSuccessfully ? ['#28A745', '#20C997'] : ['#FF6B6B', '#FF8E53']}
              style={styles.actionGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {isSaving ? (
                <>
                  <Text style={styles.actionIcon}>⏳</Text>
                  <Text style={styles.actionText}>{t('result.saving')}</Text>
                </>
              ) : savedSuccessfully ? (
                <>
                  <Text style={styles.actionIcon}>✓</Text>
                  <Text style={styles.actionText}>{t('result.saved')}</Text>
                </>
              ) : (
                <>
                  <Text style={styles.actionIcon}>💾</Text>
                  <Text style={styles.actionText}>{t('result.saveToPhotos')}</Text>
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
              <Text style={styles.secondaryText}>{t('result.share')}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Secondary Actions */}
        <View style={styles.secondaryActions}>
          <TouchableOpacity
            style={styles.restartButton}
            onPress={tryAnotherPhoto}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
              style={styles.restartGradient}
            >
              <Text style={styles.restartIcon}>🔄</Text>
              <Text style={styles.restartText}>{t('result.tryAnother')}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.historyButton}
            onPress={viewHistory}
            activeOpacity={0.7}
          >
            <Text style={styles.historyText}>📋 {t('result.viewHistory')}</Text>
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
            <Text style={styles.statLabel}>{t('result.modeUsed')}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatProcessingTime(processingTime)}</Text>
            <Text style={styles.statLabel}>{t('result.processingTime')}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{watermark ? t('result.qualityDemo') : t('result.qualityFull')}</Text>
            <Text style={styles.statLabel}>{t('result.quality')}</Text>
          </View>
        </View>
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
    paddingTop: 20,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  backButtonText: {
    fontSize: 28,
    color: '#007AFF',
    fontWeight: '600',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  imageContainer: {
    flex: 1,
    marginHorizontal: 20,
    marginVertical: 20,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
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
    backgroundColor: 'rgba(255, 193, 7, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  watermarkText: {
    color: '#000',
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
    color: '#fff',
    fontSize: 32,
    fontWeight: '600',
  },
  successText: {
    color: '#fff',
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
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  secondaryIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  secondaryText: {
    color: '#fff',
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
    marginBottom: 12,
  },
  restartGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  restartIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  restartText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  historyButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  historyText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontWeight: '500',
  },
  statsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 12,
  },
  statValue: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
  },
  toggleContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    backgroundColor: 'rgba(26, 26, 26, 0.9)',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: 'rgba(26, 26, 26, 0.9)',
  },
  toggleButtonActive: {
    backgroundColor: '#007AFF',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
});