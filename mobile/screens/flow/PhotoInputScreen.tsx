import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
// import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '../../contexts/UserContext';
import { useAnalytics } from '../../contexts/AnalyticsContext';

const { width: screenWidth } = Dimensions.get('window');

interface Props {
  navigation: StackNavigationProp<any>;
}

export default function PhotoInputScreen({ navigation }: Props) {
  const { user } = useUser();
  const { trackEvent } = useAnalytics();
  const [hasGalleryPermission, setHasGalleryPermission] = useState<boolean | null>(null);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    trackEvent('screen_view', { screen: 'photo_input' });
    requestPermissions();
    
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

    // Start pulsing animation for the main button
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.03,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    
    pulseAnimation.start();

    return () => pulseAnimation.stop();
  }, []);

  const requestPermissions = async () => {
    const galleryStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
    setHasGalleryPermission(galleryStatus.status === 'granted');
  };

  const pickImageFromGallery = async () => {
    if (!hasGalleryPermission) {
      Alert.alert('Permission Required', 'Please enable gallery access in settings.');
      return;
    }

    trackEvent('action', { type: 'gallery_open' });

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
      trackEvent('action', { type: 'image_selected_gallery' });
      navigation.navigate('ModeSelection', { imageUri: result.assets[0].uri });
    }
  };

  const takePicture = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.status !== 'granted') {
      Alert.alert(
        'Camera Permission Required',
        'Please allow camera access to take photos.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Settings', onPress: () => {} },
        ]
      );
      return;
    }

    trackEvent('action', { type: 'camera_open' });

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
      trackEvent('action', { type: 'image_selected_camera' });
      navigation.navigate('ModeSelection', { imageUri: result.assets[0].uri });
    }
  };

  const scanDocument = async () => {
    // For now, same as picking from gallery but with different tracking
    trackEvent('action', { type: 'scan_document' });
    pickImageFromGallery();
  };

  const getTotalCredits = () => {
    if (!user) return 0;
    
    let total = user.standardCredits + user.hdCredits;

    if (user.subscriptionType && user.subscriptionExpires && user.subscriptionExpires > new Date()) {
      total += user.remainingTodayStandard + user.remainingTodayHd;
    }

    return total;
  };

  const totalCredits = getTotalCredits();
  const hasCredits = totalCredits > 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with credits */}
      <Animated.View 
        style={[
          styles.header,
          { opacity: fadeAnim }
        ]}
      >
        <Text style={styles.title}>Choose Photo</Text>
        {hasCredits && (
          <View style={styles.creditsContainer}>
            <Text style={styles.creditsCount}>{totalCredits}</Text>
            <Text style={styles.creditsLabel}>credits</Text>
          </View>
        )}
      </Animated.View>

      <View style={styles.content}>
        {/* Main Photo Selection Area */}
        <Animated.View 
          style={[
            styles.selectionArea,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          {/* Primary Action - Choose from Photos */}
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={pickImageFromGallery}
              activeOpacity={0.9}
            >
              <View style={styles.primaryGradient}>
                <View style={styles.buttonContent}>
                  <View style={styles.iconContainer}>
                    <Text style={styles.primaryIcon}>🖼️</Text>
                  </View>
                  <View style={styles.textContainer}>
                    <Text style={styles.primaryText}>Choose from Photos</Text>
                    <Text style={styles.primarySubtext}>Select from your gallery</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* Secondary Actions */}
          <View style={styles.secondaryActions}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={takePicture}
              activeOpacity={0.8}
            >
              <View style={styles.secondaryContent}>
                <Text style={styles.secondaryIcon}>📷</Text>
                <Text style={styles.secondaryText}>Take New Photo</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tertiaryButton}
              onPress={scanDocument}
              activeOpacity={0.7}
            >
              <Text style={styles.tertiaryText}>📄 Scan Document</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Helper Text */}
        <Animated.View 
          style={[
            styles.helpSection,
            { opacity: fadeAnim }
          ]}
        >
          <Text style={styles.helpText}>
            💡 Best results with old family photos, faded memories, or damaged images
          </Text>
        </Animated.View>

        {/* Credits Warning */}
        {!hasCredits && (
          <Animated.View 
            style={[
              styles.creditsWarning,
              { opacity: fadeAnim }
            ]}
          >
            <Text style={styles.warningText}>
              ⚠️ No credits remaining. Purchase more to continue restoring photos.
            </Text>
            <TouchableOpacity 
              style={styles.purchaseButton}
              onPress={() => {
                trackEvent('action', { type: 'purchase_button_tap' });
                Alert.alert('Get Credits', 'Purchase options coming soon!');
              }}
            >
              <Text style={styles.purchaseText}>Get Credits →</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Recent History Quick Access */}
        <Animated.View 
          style={[
            styles.quickAccess,
            { opacity: fadeAnim }
          ]}
        >
          <TouchableOpacity 
            style={styles.historyButton}
            onPress={() => navigation.navigate('History')}
          >
            <Text style={styles.historyText}>🕐 View Recent Restorations</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.5,
  },
  creditsContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.2)',
  },
  creditsCount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF6B6B',
    marginRight: 4,
  },
  creditsLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  selectionArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  primaryButton: {
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    marginBottom: 32,
    width: screenWidth - 80,
  },
  primaryGradient: {
    padding: 24,
    backgroundColor: '#FF6B6B',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 60,
    height: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  primaryIcon: {
    fontSize: 28,
  },
  textContainer: {
    flex: 1,
  },
  primaryText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  primarySubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  secondaryActions: {
    width: '100%',
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    marginBottom: 16,
    width: '80%',
  },
  secondaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  secondaryIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  secondaryText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  tertiaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  tertiaryText: {
    fontSize: 16,
    color: '#FF6B6B',
    fontWeight: '500',
  },
  helpSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  helpText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  creditsWarning: {
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.3)',
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
    alignItems: 'center',
  },
  warningText: {
    color: '#FFC107',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 20,
  },
  purchaseButton: {
    backgroundColor: '#FFC107',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  purchaseText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 14,
  },
  quickAccess: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  historyButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  historyText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontWeight: '500',
  },
});