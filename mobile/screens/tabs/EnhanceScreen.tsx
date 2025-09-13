import * as React from 'react';
import { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
  Dimensions,
  Text,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
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
// import { useTranslation } from 'react-i18next';

const { width: screenWidth } = Dimensions.get('window');
const cardSize = (screenWidth - 32 - 16) / 3; // 3 columns with margins

// Mock recent photos data
const mockRecentPhotos = [
  { id: '1', uri: 'https://picsum.photos/300/400?random=recent1' },
  { id: '2', uri: 'https://picsum.photos/300/400?random=recent2' },
  { id: '3', uri: 'https://picsum.photos/300/400?random=recent3' },
  { id: '4', uri: 'https://picsum.photos/300/400?random=recent4' },
  { id: '5', uri: 'https://picsum.photos/300/400?random=recent5' },
  { id: '6', uri: 'https://picsum.photos/300/400?random=recent6' },
  { id: '7', uri: 'https://picsum.photos/300/400?random=recent7' },
  { id: '8', uri: 'https://picsum.photos/300/400?random=recent8' },
  { id: '9', uri: 'https://picsum.photos/300/400?random=recent9' },
];

export default function EnhanceScreen() {
  const navigation = useNavigation<EnhanceScreenNavigationProp>();
  // const { t } = useTranslation();
  const { refreshUser } = useUser();
  const { trackEvent } = useAnalytics();
  const [hasGalleryPermission, setHasGalleryPermission] = useState<boolean | null>(null);
  // const [loading, setLoading] = useState(false);

  useEffect(() => {
    trackEvent('screen_view', { screen: 'enhance' });
    refreshUser();
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    const galleryStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
    setHasGalleryPermission(galleryStatus.status === 'granted');
  };

  const pickImageFromSource = async (source: 'camera' | 'gallery') => {
    if (!hasGalleryPermission && source === 'gallery') {
      Alert.alert('Permission Required', 'Please grant gallery permission to select photos');
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
      Alert.alert('Error', 'Failed to pick image. Please try again.');
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
            <Text style={styles.screenTitle}>Enhance Photos</Text>
            <Text style={styles.screenSubtitle}>Select a photo to start enhancing</Text>
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
            <Text style={styles.uploadTitle}>Select a photo to enhance</Text>
            <Text style={styles.uploadSubtitle}>Tap to choose from gallery or camera</Text>
          </View>
        </TouchableOpacity>

        {/* Recent Photos Grid */}
        <View style={styles.recentSection}>
          <Text style={styles.recentTitle}>Recent Photos</Text>
          <View style={styles.photosGrid}>
            {mockRecentPhotos.map((photo) => (
              <TouchableOpacity
                key={photo.id}
                style={styles.photoCard}
                onPress={() => navigation.navigate('ModeSelection', { imageUri: photo.uri })}
                activeOpacity={0.8}
              >
                <Image source={{ uri: photo.uri }} style={styles.photoImage} />
              </TouchableOpacity>
            ))}
          </View>
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
});