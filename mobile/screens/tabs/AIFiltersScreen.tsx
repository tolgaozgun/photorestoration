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
import { useNavigationDebugger } from '../../hooks/useNavigationDebugger';

type AIFiltersScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'AIFilters'> & 
  StackNavigationProp<RootStackParamList>;

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
// Calculate heights for better bottom drawer behavior
const bottomSectionMinHeight = screenHeight * 0.25; // Start at 25% of screen height
const bottomSectionMaxHeight = screenHeight * 0.75; // Maximum 75% of screen height

export default function AIFiltersScreen() {
  const navigation = useNavigation<AIFiltersScreenNavigationProp>();
  const { t } = useTranslation();
  const { refreshUser } = useUser();
  const { trackEvent } = useAnalytics();

  // Use navigation debugging hook
  const { logNavigationState, isFocused } = useNavigationDebugger('AIFiltersScreen');

  // Filter data using translations
  const filterVariations = [
    { id: '3d-photos', title: t('content.aiFilters.3dPhotos'), imageUrl: 'https://picsum.photos/200/200?random=3d' },
    { id: 'muscles', title: t('content.aiFilters.muscles'), imageUrl: 'https://picsum.photos/200/200?random=muscles' },
    { id: 'flash', title: t('content.aiFilters.flash'), imageUrl: 'https://picsum.photos/200/200?random=flash' },
    { id: 'fairy-toon', title: t('content.aiFilters.fairyToon'), imageUrl: 'https://picsum.photos/200/200?random=fairy' },
    { id: '90s-anime', title: t('content.aiFilters.nineties'), imageUrl: 'https://picsum.photos/200/200?random=anime' },
    { id: 'chibi', title: t('content.aiFilters.chibi'), imageUrl: 'https://picsum.photos/200/200?random=chibi' },
    { id: 'pixel', title: t('content.aiFilters.pixel'), imageUrl: 'https://picsum.photos/200/200?random=pixel' },
    { id: 'animal-toon', title: t('content.aiFilters.animalToon'), imageUrl: 'https://picsum.photos/200/200?random=animal' },
    { id: 'animated', title: t('content.aiFilters.animated'), imageUrl: 'https://picsum.photos/200/200?random=animated' },
    { id: 'caricature', title: t('content.aiFilters.caricature'), imageUrl: 'https://picsum.photos/200/200?random=caricature' },
    { id: 'mini-toys', title: t('content.aiFilters.miniToys'), imageUrl: 'https://picsum.photos/200/200?random=toys' },
    { id: 'doll', title: t('content.aiFilters.doll'), imageUrl: 'https://picsum.photos/200/200?random=doll' },
  ];

    const [hasGalleryPermission, setHasGalleryPermission] = useState<boolean | null>(null);
  const [selectedFilter, setSelectedFilter] = useState('3d-photos');
  const [loading] = useState(false);
  const [debugTouch, setDebugTouch] = useState(false);
  
  // Bottom sheet animation
  const bottomSheetHeight = useRef(new Animated.Value(bottomSectionMinHeight)).current;
  const [isBottomSheetExpanded, setIsBottomSheetExpanded] = useState(false);
  const currentHeightRef = useRef(bottomSectionMinHeight);

  // Track the animated value
  useEffect(() => {
    const listener = bottomSheetHeight.addListener(({ value }) => {
      currentHeightRef.current = value;

      // Update expanded state based on actual height
      const threshold = (bottomSectionMinHeight + bottomSectionMaxHeight) / 2;
      const shouldBeExpanded = value > threshold;
      if (shouldBeExpanded !== isBottomSheetExpanded) {
        setIsBottomSheetExpanded(shouldBeExpanded);
      }
    });

    // Set initial height and state correctly
    const initialHeight = bottomSectionMinHeight;
    bottomSheetHeight.setValue(initialHeight);
    currentHeightRef.current = initialHeight;
    setIsBottomSheetExpanded(false);

    return () => {
      bottomSheetHeight.removeListener(listener);
    };
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => {
        return true;
      },
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const shouldRespond = Math.abs(gestureState.dy) > Math.abs(gestureState.dx) && Math.abs(gestureState.dy) > 5;
        return shouldRespond;
      },
      onPanResponderGrant: (evt, gestureState) => {
        setDebugTouch(true);
      },
      onPanResponderMove: (evt, gestureState) => {
        // Start from the initial height when gesture began, not current animated value
        // gestureState.dy is cumulative from start of gesture
        // Negative dy = dragging up = expand (increase height)
        // Positive dy = dragging down = collapse (decrease height)
        const baseHeight = isBottomSheetExpanded ? bottomSectionMaxHeight : bottomSectionMinHeight;
        const newHeight = baseHeight - gestureState.dy;
        const clampedHeight = Math.max(bottomSectionMinHeight, Math.min(bottomSectionMaxHeight, newHeight));

        bottomSheetHeight.setValue(clampedHeight);
      },
      onPanResponderRelease: (evt, gestureState) => {
        const velocityThreshold = 300; // Lower threshold for better responsiveness
        const positionThreshold = (bottomSectionMinHeight + bottomSectionMaxHeight) / 2;
        const currentHeight = currentHeightRef.current;

        // Decision logic:
        // 1. Strong upward velocity = expand
        // 2. Strong downward velocity = collapse
        // 3. Otherwise, use position and gesture distance
        let shouldExpand;

        if (Math.abs(gestureState.vy) > velocityThreshold) {
          // Use velocity for decision
          shouldExpand = gestureState.vy < 0; // Negative velocity = upward = expand
        } else if (Math.abs(gestureState.dy) > 50) {
          // Use gesture distance for decision
          shouldExpand = gestureState.dy < 0; // Negative dy = dragged up = expand
        } else {
          // Use current position for decision
          shouldExpand = currentHeight > positionThreshold;
        }

        if (shouldExpand) {
          // Expand
          Animated.spring(bottomSheetHeight, {
            toValue: bottomSectionMaxHeight,
            useNativeDriver: false,
            tension: 120,
            friction: 8,
          }).start();
          setIsBottomSheetExpanded(true);
        } else {
          // Collapse
          Animated.spring(bottomSheetHeight, {
            toValue: bottomSectionMinHeight,
            useNativeDriver: false,
            tension: 120,
            friction: 8,
          }).start();
          setIsBottomSheetExpanded(false);
        }
        setDebugTouch(false);
      },
      onPanResponderTerminate: (evt, gestureState) => {
        // Gesture terminated
      },
    })
  ).current;

  useEffect(() => {
    logNavigationState();
    trackEvent('screen_view', { screen: 'ai_filters' });
    refreshUser();
    requestPermissions();
  }, [logNavigationState]);

  const requestPermissions = async () => {
    const galleryStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
    setHasGalleryPermission(galleryStatus.status === 'granted');
  };

  const pickImageFromGallery = async () => {
    if (!hasGalleryPermission) {
      Alert.alert(t('common.permissionRequired'), t('tabs.aiFilters.pleaseGrantGalleryPermission'));
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
        logNavigationState();
        trackEvent('action', { type: 'image_selected_gallery', filter: selectedFilter });
        // Navigate to filter preview screen
        navigation.navigate('FilterPreview', {
          imageUri: result.assets[0].uri,
          filterType: selectedFilter
        });
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('tabs.aiFilters.failedToPickImage'));
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
            <Text style={styles.screenTitle}>{t('tabs.aiFilters.title')}</Text>
            <Text style={styles.screenSubtitle}>{t('tabs.aiFilters.subtitle')}</Text>
          </View>
        </View>
      </View>

      {/* Main Content Area - Photo Selection */}
      <View style={styles.mainContent}>
        <View style={styles.topContent}>
          <Text style={styles.topTitle}>{t('tabs.aiFilters.pickAPhoto')}</Text>
          <Text style={styles.topSubtitle}>{t('tabs.aiFilters.transformYourPhotoWithAIFilters')}</Text>

          <Image
            source={{ uri: 'https://picsum.photos/160/160?random=preview' }}
            style={styles.previewImage}
          />

          <TouchableOpacity
            style={styles.selectPhotoButton}
            onPress={pickImageFromGallery}
            activeOpacity={0.8}
          >
            <Text style={styles.selectPhotoText}>{t('tabs.aiFilters.selectPhoto')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Section - Variations Panel (Absolutely Positioned) */}
      <Animated.View
        style={[
          styles.bottomSection,
          { height: bottomSheetHeight }
        ]}
      >
        {/* Pull Handle */}
        <View
          style={styles.pullHandle}
          {...panResponder.panHandlers}
        >
          <TouchableOpacity
            style={[
              styles.pullHandleTouchable,
              debugTouch && { backgroundColor: 'rgba(255, 0, 0, 0.3)' }
            ]}
            onPress={() => {
              toggleBottomSheet();
            }}
            onPressIn={() => {
              setDebugTouch(true);
            }}
            onPressOut={() => {
              setDebugTouch(false);
            }}
            activeOpacity={0.7}
          >
            <View style={[
              styles.pullHandleBar,
              debugTouch && { backgroundColor: '#FF0000' }
            ]} />
          </TouchableOpacity>
        </View>

        {/* Filter Grid */}
        <ScrollView
          style={styles.filterScroll}
          showsVerticalScrollIndicator={false}
        >
          {renderFilterGrid()}

          {/* Select Photo Button at bottom of drawer */}
          <View style={styles.drawerButtonContainer}>
            <TouchableOpacity
              style={styles.drawerSelectPhotoButton}
              onPress={pickImageFromGallery}
              activeOpacity={0.8}
            >
              <Text style={styles.drawerSelectPhotoText}>{t('tabs.aiFilters.selectPhoto')}</Text>
            </TouchableOpacity>
          </View>
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
    paddingBottom: 8,
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
  
  // Main Content Styles
  mainContent: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 20,
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
    marginBottom: 6,
  },
  topSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 20,
  },
  previewImage: {
    width: 160,
    height: 160,
    borderRadius: 16,
    marginBottom: 20,
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
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  pullHandle: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  pullHandleTouchable: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 40,
    minHeight: 44, // Ensure minimum touch target size
  },
  pullHandleBar: {
    width: 40,
    height: 5,
    backgroundColor: '#8E8E93',
    borderRadius: 3,
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

  // Drawer Button Styles
  drawerButtonContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 16,
  },
  drawerSelectPhotoButton: {
    width: screenWidth - 32, // Full width minus padding
    height: 52,
    backgroundColor: '#007AFF',
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  drawerSelectPhotoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});