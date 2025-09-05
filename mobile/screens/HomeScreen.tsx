import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import { useUser } from '../contexts/UserContext';
import { useAnalytics } from '../contexts/AnalyticsContext';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'MainTabs'>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { t } = useTranslation();
  const { user, refreshUser } = useUser();
  const { trackEvent } = useAnalytics();
  const [hasGalleryPermission, setHasGalleryPermission] = useState<boolean | null>(null);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    trackEvent('screen_view', { screen: 'home' });
    refreshUser();
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
  }, []);

  const requestPermissions = async () => {
    const galleryStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
    setHasGalleryPermission(galleryStatus.status === 'granted');
  };

  const pickImageFromGallery = async () => {
    if (!hasGalleryPermission) {
      Alert.alert(t('home.permissionRequired'), t('home.galleryPermission'));
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
      navigation.navigate('RestorationPreview', { imageUri: result.assets[0].uri });
    }
  };

  const getTotalCredits = () => {
    if (!user) return { standard: 0, hd: 0 };
    
    let standardTotal = user.standardCredits;
    let hdTotal = user.hdCredits;

    if (user.subscriptionType && user.subscriptionExpires && user.subscriptionExpires > new Date()) {
      standardTotal += user.remainingTodayStandard;
      hdTotal += user.remainingTodayHd;
    }

    return { standard: standardTotal, hd: hdTotal };
  };

  const credits = getTotalCredits();
  const hasCredits = credits.standard > 0 || credits.hd > 0;
  const totalCredits = credits.standard + credits.hd;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.content}>
        {/* Header */}
        <Animated.View 
          style={[
            styles.header,
            { opacity: fadeAnim }
          ]}
        >
          <Text style={styles.title}>{t('navigation.home')}</Text>
          {hasCredits && (
            <View style={styles.creditsBar}>
              <Text style={styles.creditText}>{totalCredits}</Text>
              <Text style={styles.creditLabel}>{t('photoInput.creditsLabel')}</Text>
            </View>
          )}
        </Animated.View>

        {/* Main content */}
        <View style={styles.mainContent}>
          <Animated.View 
            style={[
              styles.centerContent,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }]
              }
            ]}
          >
            <View style={styles.iconContainer}>
              <Text style={styles.mainIcon}>✨</Text>
            </View>
            
            <Text style={styles.mainTitle}>{t('home.mainTitle')}</Text>
            <Text style={styles.subtitle}>
              {t('home.subtitle')}
            </Text>

            <TouchableOpacity
              style={styles.uploadButton}
              onPress={pickImageFromGallery}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#FF6B6B', '#FF8E53']}
                style={styles.uploadGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.uploadIcon}>📷</Text>
                <Text style={styles.uploadText}>{t('photoInput.choosePhoto')}</Text>
              </LinearGradient>
            </TouchableOpacity>

            {!hasCredits && (
              <TouchableOpacity 
                style={styles.getCreditsButton}
                onPress={() => {
                  trackEvent('action', { type: 'purchase_button_tap' });
                  Alert.alert(t('purchase.title'), t('purchase.comingSoonMessage'));
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.getCreditsText}>{t('photoInput.getCreditsButton')}</Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.5,
  },
  creditsBar: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.2)',
  },
  creditText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF6B6B',
    marginRight: 4,
  },
  creditLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  centerContent: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  mainIcon: {
    fontSize: 40,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 40,
    textAlign: 'center',
  },
  uploadButton: {
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    marginBottom: 16,
  },
  uploadGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 24,
  },
  uploadIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  uploadText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  getCreditsButton: {
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  getCreditsText: {
    fontSize: 14,
    color: '#FF6B6B',
    fontWeight: '500',
  },
});