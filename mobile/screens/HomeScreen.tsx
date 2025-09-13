import * as React from 'react'
import { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  ScrollView,
  FlatList,
  Dimensions,
  SafeAreaView,
  Image,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainTabParamList, RootStackParamList } from '../App';
import { useUser } from '../contexts/UserContext';
import { useAnalytics } from '../contexts/AnalyticsContext';
import { useTranslation } from 'react-i18next';

// Import our new components and services
import { Container, Section, Row, Spacer } from '../components/Layout';
import { Text, SectionHeader } from '../components/Text';
import { Button, IconButton } from '../components/Button';
import { Card, GalleryCard, ModeCard } from '../components/Card';
import { Header, NavigationButton, FloatingActionButton } from '../components/Navigation';
import { Modal, LoadingModal } from '../components/Modal';
import { NavigationService, NavigationItem } from '../services/NavigationService';

type HomeScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'Home'> & 
  StackNavigationProp<RootStackParamList>;

// Mock data for enhanced photos
const mockEnhancedPhotos = [
  { id: '1', title: 'Enhanced', uri: 'https://picsum.photos/300/400?random=enhanced1' },
  { id: '2', title: 'Sunset', uri: 'https://picsum.photos/300/400?random=enhanced2' },
  { id: '3', title: 'Portrait', uri: 'https://picsum.photos/300/400?random=enhanced3' },
  { id: '4', title: 'Landscape', uri: 'https://picsum.photos/300/400?random=enhanced4' },
  { id: '5', title: 'Vintage', uri: 'https://picsum.photos/300/400?random=enhanced5' },
];

// Mock data for content galleries
const mockContentSections = [
  {
    id: 'future-baby',
    title: 'Future Baby with AI',
    emoji: '🍼',
    description: 'See what your future baby might look like',
    items: [
      { id: '1', title: 'Baby Prediction', category: 'AI', isPremium: true, imageUrl: 'https://picsum.photos/300/300?random=baby1' },
      { id: '2', title: 'Family Preview', category: 'AI', isPremium: true, imageUrl: 'https://picsum.photos/300/300?random=family1' },
      { id: '3', title: 'Child Generator', category: 'AI', isPremium: true, imageUrl: 'https://picsum.photos/300/300?random=child1' },
    ],
  },
  {
    id: 'remove-elements',
    title: 'Remove Extra Elements',
    emoji: '🎭',
    description: 'Clean up your photos by removing unwanted objects',
    items: [
      { id: '1', title: 'Background Remove', category: 'Tool', imageUrl: 'https://picsum.photos/300/300?random=bg1' },
      { id: '2', title: 'Object Removal', category: 'Tool', imageUrl: 'https://picsum.photos/300/300?random=object1' },
      { id: '3', title: 'People Remover', category: 'Tool', isPremium: true, imageUrl: 'https://picsum.photos/300/300?random=people1' },
    ],
  },
  {
    id: 'outfit-tryon',
    title: 'Choose Your Outfit',
    emoji: '👕',
    description: 'Try different outfits on your photos',
    items: [
      { id: '1', title: 'Casual Wear', category: 'Fashion', imageUrl: 'https://picsum.photos/300/300?random=fashion1' },
      { id: '2', title: 'Business Attire', category: 'Fashion', isPremium: true, imageUrl: 'https://picsum.photos/300/300?random=business1' },
      { id: '3', title: 'Evening Dress', category: 'Fashion', isPremium: true, imageUrl: 'https://picsum.photos/300/300?random=evening1' },
    ],
  },
  {
    id: 'digital-twin',
    title: 'Digital Twin',
    emoji: '🎭',
    description: 'Create your digital avatar',
    items: [
      { id: '1', title: '3D Avatar', category: 'AI', isPremium: true, imageUrl: 'https://picsum.photos/300/300?random=avatar1' },
      { id: '2', title: 'Virtual Clone', category: 'AI', isPremium: true, imageUrl: 'https://picsum.photos/300/300?random=clone1' },
      { id: '3', title: 'Digital Persona', category: 'AI', isPremium: true, imageUrl: 'https://picsum.photos/300/300?random=persona1' },
    ],
  },
  {
    id: 'pixel-trend',
    title: 'Pixel Trend',
    emoji: '🎮',
    description: 'Transform your photos into pixel art',
    items: [
      { id: '1', title: '8-bit Style', category: 'Filter', imageUrl: 'https://via.placeholder.com/300x200/9C27B0/FFFFFF?text=8bit' },
      { id: '2', title: '16-bit Art', category: 'Filter', imageUrl: 'https://via.placeholder.com/300x200/9C27B0/FFFFFF?text=16bit' },
      { id: '3', title: 'Retro Gaming', category: 'Filter', isPremium: true, imageUrl: 'https://via.placeholder.com/300x200/9C27B0/FFFFFF?text=Retro' },
    ],
  },
  {
    id: 'chibi-stickers',
    title: 'Chibi Stickers',
    emoji: '🎨',
    description: 'Create cute chibi versions of yourself',
    items: [
      { id: '1', title: 'Chibi Avatar', category: 'Cartoon', imageUrl: 'https://via.placeholder.com/300x200/FF9800/FFFFFF?text=Chibi' },
      { id: '2', title: 'Kawaii Style', category: 'Cartoon', isPremium: true, imageUrl: 'https://via.placeholder.com/300x200/FF9800/FFFFFF?text=Kawaii' },
      { id: '3', title: 'Anime Character', category: 'Cartoon', isPremium: true, imageUrl: 'https://via.placeholder.com/300x200/FF9800/FFFFFF?text=Anime' },
    ],
  },
];

const mockVideoContent = [
  {
    id: 'animate-old-photos',
    title: 'Animate Old Photos',
    emoji: '📹',
    description: 'Bring your old photos to life',
    duration: '0:30',
    isPremium: true,
  },
  {
    id: 'face-animation',
    title: 'Face Animation',
    emoji: '😊',
    description: 'Add natural animations to portraits',
    duration: '0:15',
  },
  {
    id: 'photo-to-video',
    title: 'Photo to Video',
    emoji: '🎬',
    description: 'Transform photos into videos',
    duration: '1:00',
    isPremium: true,
  },
];

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { t } = useTranslation();
  const { user, refreshUser } = useUser();
  const { trackEvent } = useAnalytics();
  const [hasGalleryPermission, setHasGalleryPermission] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [menuLoading, setMenuLoading] = useState(true);
  const [contentSections, setContentSections] = useState<NavigationItem[]>([]);
  const [videoContent, setVideoContent] = useState<NavigationItem[]>([]);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    trackEvent('screen_view', { screen: 'home' });
    refreshUser();
    requestPermissions();
    loadMenuData();
    
    // Entry animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadMenuData = async () => {
    try {
      setMenuLoading(true);
      const navigationService = NavigationService.getInstance();
      await navigationService.loadMenuData();
      
      const homeSections = navigationService.getScreenItems('home');
      const videoSections = navigationService.getScreenItems('video');
      
      setContentSections(homeSections);
      setVideoContent(videoSections);
    } catch (error) {
      console.error('Failed to load menu data:', error);
    } finally {
      setMenuLoading(false);
    }
  };

  const requestPermissions = async () => {
    const galleryStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
    setHasGalleryPermission(galleryStatus.status === 'granted');
  };

  const pickImageFromGallery = async () => {
    if (!hasGalleryPermission) {
      Alert.alert('Permission Required', 'Please grant gallery permission to select photos');
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

  const getTotalCredits = () => {
    if (!user) return 0;
    
    let totalCredits = user.credits;

    if (user.subscriptionType && user.subscriptionExpires && user.subscriptionExpires > new Date()) {
      totalCredits += user.remainingToday;
    }

    return totalCredits;
  };

  const handleSectionPress = async (sectionId: string) => {
    trackEvent('action', { type: 'section_tap', section: sectionId });
    setSelectedSection(sectionId);
    
    // Navigate to AI generation flow for person-specific features
    const aiFeatures = ['future-baby', 'digital-twin', 'outfit-tryon'];
    if (aiFeatures.includes(sectionId)) {
      const section = mockContentSections.find(s => s.id === sectionId);
      if (section) {
        navigation.navigate('SelfieUpload', {
          featureId: sectionId,
          featureTitle: section.title,
          featureDescription: section.description,
        });
      }
const navigationService = NavigationService.getInstance();
    const item = navigationService.getNavigationItemById(sectionId);
    if (item) {
      await navigationService.navigateToItem(item, navigation);
    }
  };

  const handleSeeAllPress = async (sectionId: string) => {
    trackEvent('action', { type: 'see_all_tap', section: sectionId });
    
    // Navigate to selfie upload for AI features
    const aiFeatures = ['future-baby', 'digital-twin', 'outfit-tryon'];
    if (aiFeatures.includes(sectionId)) {
      const section = mockContentSections.find(s => s.id === sectionId);
      if (section) {
        navigation.navigate('SelfieUpload', {
          featureId: sectionId,
          featureTitle: section.title,
          featureDescription: section.description,
        });
      }
const navigationService = NavigationService.getInstance();
    const item = navigationService.getNavigationItemById(sectionId);
    if (item) {
      await navigationService.navigateToItem(item, navigation);
    }
  };

  const handleVideoPress = async (videoId: string) => {
    trackEvent('action', { type: 'video_tap', video: videoId });
    navigation.navigate('VideoGallery');
  };

  const renderContentSection = ({ item }: { item: typeof mockContentSections[0] }) => (
    <View key={item.id} style={styles.contentSection}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContainer}>
          <Text style={styles.sectionTitle}>{item.emoji} {item.title}</Text>
        </View>
        <TouchableOpacity
          style={styles.seeAllButton}
          onPress={() => handleSeeAllPress(item.id)}
        >
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalScroll}
      >
        {item.meta_data?.items?.map((contentItem: any) => (
          <GalleryCard
            key={contentItem.id}
            style={styles.galleryCard}
            onPress={() => handleSectionPress(item.id)}
            activeOpacity={0.9}
          >
            <Image source={require('../assets/slider.gif')} style={styles.galleryCardBackground} />
            <Image source={{ uri: contentItem.imageUrl }} style={styles.galleryCardImage} />
            <View style={styles.galleryCardOverlay}>
              <Text style={styles.galleryCardTitle}>{contentItem.title}</Text>
              <Text style={styles.galleryCardCategory}>{contentItem.category}</Text>
            </View>
            {contentItem.isPremium && (
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumBadgeText}>PREMIUM</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderVideoSection = () => (
    <Section title="Popular AI Videos" emoji="🎬" style={styles.section}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalScroll}
      >
        {videoContent.map((video) => (
          <Card
            key={video.id}
            variant="video"
            size="medium"
            title={video.title}
            metadata={video.meta_data?.duration}
            isPremium={video.is_premium}
            onPress={() => handleVideoPress(video.id)}
            style={styles.galleryCard}
          />
        ))}
      </ScrollView>
    </Section>
  );

  const totalCredits = getTotalCredits();
  const hasCredits = totalCredits > 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Container>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.logoButton}>
            <Text style={styles.logoText}>Remini</Text>
          </TouchableOpacity>
          <View style={styles.headerRight}>
            {user?.isPro && (
              <View style={styles.proBadge}>
                <Text style={styles.proBadgeText}>PRO</Text>
              </View>
            )}
            <TouchableOpacity style={styles.headerButton} onPress={() => navigation.navigate('Settings')}>
              <Text style={styles.headerIcon}>⚙️</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton} onPress={() => navigation.navigate('MainTabs', { screen: 'Profile' })}>
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>👤</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Main Content */}
        <Animated.ScrollView
          style={[styles.container, { opacity: fadeAnim }]}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
        >
        {/* Enhance Section */}
        <View style={styles.enhanceSection}>
          <Text style={styles.enhanceSubtitle}>What brings you here?</Text>
          <Section 
            title="Sunset glow" 
            emoji="🌅" 
            style={styles.enhanceGallerySection}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.enhanceGalleryScroll}
            >
              {mockEnhancedPhotos.map((photo) => (
                <TouchableOpacity
                  key={photo.id}
                  style={styles.enhanceCard}
                  onPress={() => navigation.navigate('ModeSelection', { imageUri: photo.uri })}
                  activeOpacity={0.9}
                >
                  <Image source={require('../assets/slider.gif')} style={styles.enhanceCardBackground} />
                  <Image source={{ uri: photo.uri }} style={styles.enhanceCardImage} />
                  <View style={styles.enhanceCardOverlay}>
                    <Text style={styles.enhanceCardText}>{photo.title}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Section>
        </View>

      {/* Content Discovery Sections */}
        {menuLoading ? (
          <ActivityIndicator size="large" color="#FF3B30" />
        ) : (
          <FlatList
            data={contentSections}
            renderItem={({ item }) => renderContentSection(item)}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            ListFooterComponent={renderVideoSection()}
          />
        )}

        <View style={styles.bottomSpacing} />
      </Animated.ScrollView>

      {/* Floating Action Button */}
      <FloatingActionButton
        icon={<Text variant="title" color="primary">📷</Text>}
        onPress={pickImageFromGallery}
        style={styles.fab}
      />

      {/* Loading Modal */}
      <LoadingModal
        visible={loading}
        message="Processing your photo..."
        onClose={() => {}}
      />
      </Container>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000',
  },
  container: {
    flex: 1,
  },
  
  // Header Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 44,
    paddingBottom: 12,
    backgroundColor: '#000000',
  },
  logoButton: {
    padding: 8,
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  proBadge: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proBadgeText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIcon: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarText: {
    fontSize: 18,
  },
  
  // Enhance Section Styles
  enhanceSection: {
    marginHorizontal: 16,
    marginTop: 32,
  },
  enhanceSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 16,
  },
  enhanceGallerySection: {
    marginBottom: 32,
  },
  enhanceGalleryScroll: {
    paddingHorizontal: 0,
  },
  enhanceCard: {
    width: 140,
    height: 175,
    borderRadius: 16,
    marginRight: 12,
    overflow: 'hidden',
    backgroundColor: '#2C2C2E',
  },
  enhanceCardBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    opacity: 0.3,
  },
  enhanceCardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  enhanceCardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'linear-gradient(to top, rgba(0,0,0,0.4), transparent)',
    padding: 12,
  },
  enhanceCardText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  
  // Content Section Styles
  contentSection: {
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  sectionTitleContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  seeAllButton: {
    backgroundColor: '#2C2C2E',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  seeAllText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  horizontalScroll: {
    paddingHorizontal: 0,
  },
  galleryCard: {
    width: 140,
    height: 175,
    borderRadius: 16,
    marginRight: 12,
    overflow: 'hidden',
    backgroundColor: '#2C2C2E',
  },
  galleryCardBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    opacity: 0.3,
  },
  galleryCardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  galleryCardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    backgroundColor: 'linear-gradient(to top, rgba(0,0,0,0.4), transparent)',
  },
  galleryCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  galleryCardCategory: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  premiumBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFD700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  premiumBadgeText: {
    fontSize: 10,
    color: '#000000',
    fontWeight: '700',
  },
  
  // FAB Styles
  fab: {
    bottom: 96,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  bottomSpacing: {
    height: 96,
  },
});