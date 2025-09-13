import * as React from 'react';
import { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  PanResponder,
  Animated,
  Dimensions,
  Image,
  Text,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { StackNavigationProp } from '@react-navigation/stack';
import { MainTabParamList, RootStackParamList } from '../App';
import { useUser } from '../../contexts/UserContext';
import { useAnalytics } from '../../contexts/AnalyticsContext';
import { useTranslation } from 'react-i18next';

type AIFiltersScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'AIFilters'> & 
  StackNavigationProp<RootStackParamList>;

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const topSectionHeight = screenHeight * 0.6;
const bottomSectionMinHeight = screenHeight * 0.4;
const bottomSectionMaxHeight = screenHeight * 0.8;

// Mock filter variations data
const filterVariations = [
  { id: '3d-photos', title: '3D Photos', imageUrl: 'https://picsum.photos/200/200?random=3d' },
  { id: 'muscles', title: 'Muscles', imageUrl: 'https://picsum.photos/200/200?random=muscles' },
  { id: 'flash', title: 'Flash', imageUrl: 'https://picsum.photos/200/200?random=flash' },
  { id: 'fairy-toon', title: 'Fairy Toon', imageUrl: 'https://picsum.photos/200/200?random=fairy' },
  { id: '90s-anime', title: '90s Anime', imageUrl: 'https://picsum.photos/200/200?random=anime' },
  { id: 'chibi', title: 'Chibi', imageUrl: 'https://picsum.photos/200/200?random=chibi' },
  { id: 'pixel', title: 'Pixel', imageUrl: 'https://picsum.photos/200/200?random=pixel' },
  { id: 'animal-toon', title: 'Animal Toon', imageUrl: 'https://picsum.photos/200/200?random=animal' },
  { id: 'animated', title: 'Animated', imageUrl: 'https://picsum.photos/200/200?random=animated' },
  { id: 'caricature', title: 'Caricature', imageUrl: 'https://picsum.photos/200/200?random=caricature' },
  { id: 'mini-toys', title: 'Mini Toys', imageUrl: 'https://picsum.photos/200/200?random=toys' },
  { id: 'doll', title: 'Doll', imageUrl: 'https://picsum.photos/200/200?random=doll' },
];

export default function AIFiltersScreen() {
  const navigation = useNavigation<AIFiltersScreenNavigationProp>();
  const { refreshUser } = useUser();
  const { trackEvent } = useAnalytics();

  const handleSettingsPress = () => {
    navigation.navigate('Settings');
  };
  const [hasGalleryPermission, setHasGalleryPermission] = useState<boolean | null>(null);
  const [selectedFilter, setSelectedFilter] = useState('3d-photos');
  const [loading] = useState(false);
  
  // Bottom sheet animation
  const bottomSheetHeight = useRef(new Animated.Value(bottomSectionMinHeight)).current;
  const [isBottomSheetExpanded, setIsBottomSheetExpanded] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        const newHeight = bottomSectionMinHeight - gestureState.dy;
        if (newHeight >= bottomSectionMinHeight && newHeight <= bottomSectionMaxHeight) {
          bottomSheetHeight.setValue(newHeight);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const velocityThreshold = 0.3;
        const positionThreshold = bottomSectionMinHeight + 100;
        
        if (gestureState.vy > velocityThreshold || bottomSheetHeight._value < positionThreshold) {
          // Collapse
          Animated.spring(bottomSheetHeight, {
            toValue: bottomSectionMinHeight,
            useNativeDriver: false,
          }).start();
          setIsBottomSheetExpanded(false);
        } else {
          // Expand
          Animated.spring(bottomSheetHeight, {
            toValue: bottomSectionMaxHeight,
            useNativeDriver: false,
          }).start();
          setIsBottomSheetExpanded(true);
        }
      },
    })
  ).current;

  useEffect(() => {
    trackEvent('screen_view', { screen: 'ai_filters' });
    refreshUser();
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    const galleryStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
    setHasGalleryPermission(galleryStatus.status === 'granted');
  };

  const pickImageFromGallery = async () => {
    if (!hasGalleryPermission) {
      Alert.alert('Permission Required', 'Please grant gallery permission to select photos');
      return;
    }

    trackEvent('action', { type: 'gallery_open', filter: selectedFilter });

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled) {
        trackEvent('action', { type: 'image_selected_gallery', filter: selectedFilter });
        // Navigate to processing with selected filter
        navigation.navigate('ModeSelection', { 
          imageUri: result.assets[0].uri,
          // We'll pass the filter type as part of the mode or add it to the navigation params
        });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleFilterSelect = (filterId: string) => {
    setSelectedFilter(filterId);
    trackEvent('action', { type: 'filter_select', filter: filterId });
  };

  const toggleBottomSheet = () => {
    const targetHeight = isBottomSheetExpanded ? bottomSectionMinHeight : bottomSectionMaxHeight;
    Animated.spring(bottomSheetHeight, {
      toValue: targetHeight,
      useNativeDriver: false,
    }).start();
    setIsBottomSheetExpanded(!isBottomSheetExpanded);
  };

  const renderFilterGrid = () => {
    return (
      <View style={styles.filterGrid}>
        {filterVariations.map((filter) => (
          <TouchableOpacity
            key={filter.id}
            style={[
              styles.filterCard,
              selectedFilter === filter.id && styles.selectedFilterCard
            ]}
            onPress={() => handleFilterSelect(filter.id)}
            activeOpacity={0.8}
          >
            <View style={styles.filterImageContainer}>
              <Image
                source={{ uri: filter.imageUrl }}
                style={styles.filterImage}
                resizeMode="cover"
              />
            </View>
            <Text style={styles.filterTitle}>{filter.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" />

      {/* Screen Title */}
      <View style={styles.titleSection}>
        <View style={styles.titleContainer}>
          <View style={styles.titleTextContainer}>
            <Text style={styles.screenTitle}>AI Filters</Text>
            <Text style={styles.screenSubtitle}>Transform your photos with AI filters</Text>
          </View>
          <TouchableOpacity style={styles.settingsButton} onPress={handleSettingsPress}>
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Top Section - Photo Selection */}
      <View style={styles.topSection}>
        <View style={styles.topContent}>
          <Text style={styles.topTitle}>Pick a photo</Text>
          <Text style={styles.topSubtitle}>Transform your photo with AI filters</Text>
          
          <Image 
            source={{ uri: 'https://picsum.photos/160/160?random=preview' }} 
            style={styles.previewImage} 
          />
          
          <TouchableOpacity
            style={styles.selectPhotoButton}
            onPress={pickImageFromGallery}
            activeOpacity={0.8}
          >
            <Text style={styles.selectPhotoText}>Select Photo</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Section - Variations Panel */}
      <Animated.View 
        style={[
          styles.bottomSection,
          { height: bottomSheetHeight }
        ]}
      >
        {/* Pull Handle */}
        <TouchableOpacity 
          style={styles.pullHandle}
          onPress={toggleBottomSheet}
          {...panResponder.panHandlers}
        >
          <View style={styles.pullHandleBar} />
        </TouchableOpacity>

        {/* Filter Grid */}
        <ScrollView 
          style={styles.filterScroll}
          showsVerticalScrollIndicator={false}
        >
          {renderFilterGrid()}
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
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
  
  // Top Section Styles
  topSection: {
    height: topSectionHeight,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topContent: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  topTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  topSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 32,
  },
  previewImage: {
    width: 160,
    height: 160,
    borderRadius: 16,
    marginBottom: 32,
    resizeMode: 'cover',
  },
  selectPhotoButton: {
    width: screenWidth - 64,
    height: 52,
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectPhotoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  
  // Bottom Section Styles
  bottomSection: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  pullHandle: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  pullHandleBar: {
    width: 32,
    height: 4,
    backgroundColor: '#8E8E93',
    borderRadius: 2,
  },
  filterScroll: {
    flex: 1,
  },

  // Filter Grid Styles
  filterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  filterCard: {
    width: (Dimensions.get('window').width - 48) / 4, // 4 columns with 16px padding and 4px gap
    height: 112, // Increased height to accommodate larger images
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  selectedFilterCard: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  filterImageContainer: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#3A3A3C',
    overflow: 'hidden',
    marginBottom: 8,
  },
  filterImage: {
    width: '100%',
    height: '100%',
  },
  filterTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});