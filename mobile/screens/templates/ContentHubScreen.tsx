import * as React from 'react'
import { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  FlatList,
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
// import { useTranslation } from 'react-i18next';
import sliderGif from '../assets/slider.gif';

// Import our new components and services
import { Container } from '../components/Layout';
import { Text } from '../components/Text';
import { LoadingModal } from '../components/Modal';
import { NavigationService, NavigationItem } from '../services/NavigationService';

type ContentHubScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'Home'> & 
  StackNavigationProp<RootStackParamList>;

// Mock data for content galleries - this will be used for AI Photos and AI Videos content hubs
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
    id: 'professional-headshots',
    title: 'Professional Headshots',
    emoji: '💼',
    description: 'Business photo enhancement',
    items: [
      { id: '1', title: 'Corporate', category: 'Business', imageUrl: 'https://picsum.photos/300/300?random=corporate1' },
      { id: '2', title: 'LinkedIn', category: 'Business', isPremium: true, imageUrl: 'https://picsum.photos/300/300?random=linkedin1' },
      { id: '3', title: 'Portfolio', category: 'Business', imageUrl: 'https://picsum.photos/300/300?random=portfolio1' },
    ],
  },
  {
    id: 'vintage-portraits',
    title: 'Vintage Portraits',
    emoji: '🎨',
    description: 'Classic styling',
    items: [
      { id: '1', title: 'Victorian', category: 'Vintage', imageUrl: 'https://picsum.photos/300/300?random=victorian1' },
      { id: '2', title: 'Renaissance', category: 'Vintage', isPremium: true, imageUrl: 'https://picsum.photos/300/300?random=renaissance1' },
      { id: '3', title: 'Retro', category: 'Vintage', imageUrl: 'https://picsum.photos/300/300?random=retro1' },
    ],
  },
  {
    id: 'fantasy-characters',
    title: 'Fantasy Characters',
    emoji: '🧙',
    description: 'Costume and character photos',
    items: [
      { id: '1', title: 'Wizard', category: 'Fantasy', imageUrl: 'https://picsum.photos/300/300?random=wizard1' },
      { id: '2', title: 'Knight', category: 'Fantasy', isPremium: true, imageUrl: 'https://picsum.photos/300/300?random=knight1' },
      { id: '3', title: 'Elf', category: 'Fantasy', imageUrl: 'https://picsum.photos/300/300?random=elf1' },
    ],
  },
];

// Mock data for video content hubs
const mockVideoContentSections = [
  {
    id: 'animate-old-photos',
    title: 'Animate Old Photos',
    emoji: '📹',
    description: 'Bring your old photos to life',
    items: [
      { id: '1', title: 'Face Animation', category: 'Video', duration: '0:15', imageUrl: 'https://picsum.photos/300/300?random=face1' },
      { id: '2', title: 'Subtle Motion', category: 'Video', duration: '0:10', imageUrl: 'https://picsum.photos/300/300?random=subtle1' },
      { id: '3', title: 'Expression Changes', category: 'Video', isPremium: true, duration: '0:20', imageUrl: 'https://picsum.photos/300/300?random=expression1' },
    ],
  },
  {
    id: 'cinemagraphs',
    title: 'Cinemagraph Creation',
    emoji: '🌊',
    description: 'Subtle motion effects',
    items: [
      { id: '1', title: 'Water Flow', category: 'Cinemagraph', duration: '0:30', imageUrl: 'https://picsum.photos/300/300?random=water1' },
      { id: '2', title: 'Hair Movement', category: 'Cinemagraph', duration: '0:15', imageUrl: 'https://picsum.photos/300/300?random=hair1' },
      { id: '3', title: 'Cloud Motion', category: 'Cinemagraph', isPremium: true, duration: '0:45', imageUrl: 'https://picsum.photos/300/300?random=cloud1' },
    ],
  },
  {
    id: 'portrait-animation',
    title: 'Portrait Animation',
    emoji: '😊',
    description: 'Facial expressions and movement',
    items: [
      { id: '1', title: 'Smile Animation', category: 'Portrait', duration: '0:10', imageUrl: 'https://picsum.photos/300/300?random=smile1' },
      { id: '2', title: 'Talking Effect', category: 'Portrait', duration: '0:25', imageUrl: 'https://picsum.photos/300/300?random=talk1' },
      { id: '3', title: 'Eye Movement', category: 'Portrait', isPremium: true, duration: '0:15', imageUrl: 'https://picsum.photos/300/300?random=eye1' },
    ],
  },
  {
    id: 'background-animation',
    title: 'Background Animation',
    emoji: '🎬',
    description: 'Dynamic backgrounds',
    items: [
      { id: '1', title: 'Sky Changes', category: 'Background', duration: '0:45', imageUrl: 'https://picsum.photos/300/300?random=sky1' },
      { id: '2', title: 'Weather Effects', category: 'Background', duration: '0:30', imageUrl: 'https://picsum.photos/300/300?random=weather1' },
      { id: '3', title: 'Light Transitions', category: 'Background', isPremium: true, duration: '1:00', imageUrl: 'https://picsum.photos/300/300?random=light1' },
    ],
  },
];

interface ContentHubScreenProps {
  hubType: 'photos' | 'videos';
  title: string;
}

export default function ContentHubScreen({ hubType, title }: ContentHubScreenProps) {
  const navigation = useNavigation<ContentHubScreenNavigationProp>();
  const { user, refreshUser } = useUser();
  const { trackEvent } = useAnalytics();
  const [loading] = useState(false);
  const [menuLoading, setMenuLoading] = useState(true);
  const [contentSections, setContentSections] = useState<NavigationItem[]>([]);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    trackEvent('screen_view', { screen: title.toLowerCase().replace(' ', '_') });
    refreshUser();
    requestPermissions();
    loadMenuData();
    
    // Entry animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [hubType, title]);

  const loadMenuData = async () => {
    try {
      setMenuLoading(true);
      const navigationService = NavigationService.getInstance();
      await navigationService.loadMenuData();
      
      // Load different content based on hub type
      const sections = hubType === 'photos' ? mockContentSections : mockVideoContentSections;
      setContentSections(sections as NavigationItem[]);
    } catch (error) {
      console.error('Failed to load menu data:', error);
    } finally {
      setMenuLoading(false);
    }
  };

  const requestPermissions = async () => {
    await ImagePicker.requestMediaLibraryPermissionsAsync();
  };

  const getTotalCredits = () => {
    if (!user) return 0;
    
    let totalCredits = user.credits;
    if (user.subscriptionType && user.subscriptionExpires && user.subscriptionExpires > new Date()) {
      totalCredits += user.remainingToday;
    }
    return totalCredits;
  };

  const handleSectionPress = (sectionId: string) => {
    trackEvent('action', { type: 'section_tap', section: sectionId });

    // Navigate based on hub type
    if (hubType === 'photos') {
      navigation.navigate('SelfieUpload', {
        featureId: sectionId,
        featureTitle: title,
        featureDescription: mockContentSections.find(s => s.id === sectionId)?.description || '',
      });
    } else {
      navigation.navigate('VideoGallery');
    }
  };

  const handleSeeAllPress = (sectionId: string) => {
    trackEvent('action', { type: 'see_all_tap', section: sectionId });
    handleSectionPress(sectionId);
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
        {item.items.map((contentItem) => (
          <TouchableOpacity
            key={contentItem.id}
            style={styles.galleryCard}
            onPress={() => handleSectionPress(item.id)}
            activeOpacity={0.9}
          >
            <Image source={sliderGif} style={styles.galleryCardBackground} />
            <Image source={{ uri: contentItem.imageUrl }} style={styles.galleryCardImage} />
            <View style={styles.galleryCardOverlay}>
              <Text style={styles.galleryCardTitle}>{contentItem.title}</Text>
              <Text style={styles.galleryCardCategory}>
                {contentItem.category}{contentItem.duration ? ` • ${contentItem.duration}` : ''}
              </Text>
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

  // const totalCredits = getTotalCredits();

  return (
    <SafeAreaView style={styles.safeArea}>
      <Container>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{title}</Text>
          <View style={styles.headerRight}>
            {user?.isPro && (
              <View style={styles.proBadge}>
                <Text style={styles.proBadgeText}>PRO</Text>
              </View>
            )}
            <TouchableOpacity style={styles.headerButton} onPress={() => navigation.navigate('Settings')}>
              <Text style={styles.headerIcon}>⚙️</Text>
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
          {/* Content Sections */}
          {menuLoading ? (
            <ActivityIndicator size="large" color="#FF3B30" style={styles.loader} />
          ) : (
            <FlatList
              data={contentSections}
              renderItem={({ item }: { item: NavigationItem }) => renderContentSection(item)}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          )}

          <View style={styles.bottomSpacing} />
        </Animated.ScrollView>

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
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  backIcon: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
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
    fontSize: 18,
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
  
  // Utility Styles
  loader: {
    marginTop: 100,
  },
  bottomSpacing: {
    height: 96,
  },
});