import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  ScrollView,
  FlatList,
  Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import { useUser } from '../contexts/UserContext';
import { useAnalytics } from '../contexts/AnalyticsContext';
import { useTranslation } from 'react-i18next';

// Import our new components
import { Container, Section, Row, Spacer } from '../components/Layout';
import { Text, SectionHeader } from '../components/Text';
import { Button, IconButton } from '../components/Button';
import { Card, GalleryCard, ModeCard } from '../components/Card';
import { Header, NavigationButton, FloatingActionButton } from '../components/Navigation';
import { Modal, LoadingModal } from '../components/Modal';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'PhotoInput'>;

// Mock data for content galleries
const mockContentSections = [
  {
    id: 'future-baby',
    title: 'Future Baby with AI',
    emoji: '🍼',
    description: 'See what your future baby might look like',
    items: [
      { id: '1', title: 'Baby Prediction', category: 'AI', isPremium: true },
      { id: '2', title: 'Family Preview', category: 'AI', isPremium: true },
      { id: '3', title: 'Child Generator', category: 'AI', isPremium: true },
    ],
  },
  {
    id: 'remove-elements',
    title: 'Remove Extra Elements',
    emoji: '🎭',
    description: 'Clean up your photos by removing unwanted objects',
    items: [
      { id: '1', title: 'Background Remove', category: 'Tool' },
      { id: '2', title: 'Object Removal', category: 'Tool' },
      { id: '3', title: 'People Remover', category: 'Tool', isPremium: true },
    ],
  },
  {
    id: 'outfit-tryon',
    title: 'Choose Your Outfit',
    emoji: '👕',
    description: 'Try different outfits on your photos',
    items: [
      { id: '1', title: 'Casual Wear', category: 'Fashion' },
      { id: '2', title: 'Business Attire', category: 'Fashion', isPremium: true },
      { id: '3', title: 'Evening Dress', category: 'Fashion', isPremium: true },
    ],
  },
  {
    id: 'digital-twin',
    title: 'Digital Twin',
    emoji: '🎭',
    description: 'Create your digital avatar',
    items: [
      { id: '1', title: '3D Avatar', category: 'AI', isPremium: true },
      { id: '2', title: 'Virtual Clone', category: 'AI', isPremium: true },
      { id: '3', title: 'Digital Persona', category: 'AI', isPremium: true },
    ],
  },
  {
    id: 'pixel-trend',
    title: 'Pixel Trend',
    emoji: '🎮',
    description: 'Transform your photos into pixel art',
    items: [
      { id: '1', title: '8-bit Style', category: 'Filter' },
      { id: '2', title: '16-bit Art', category: 'Filter' },
      { id: '3', title: 'Retro Gaming', category: 'Filter', isPremium: true },
    ],
  },
  {
    id: 'chibi-stickers',
    title: 'Chibi Stickers',
    emoji: '🎨',
    description: 'Create cute chibi versions of yourself',
    items: [
      { id: '1', title: 'Chibi Avatar', category: 'Cartoon' },
      { id: '2', title: 'Kawaii Style', category: 'Cartoon', isPremium: true },
      { id: '3', title: 'Anime Character', category: 'Cartoon', isPremium: true },
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

export default function HomeScreenNew() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { t } = useTranslation();
  const { user, refreshUser } = useUser();
  const { trackEvent } = useAnalytics();
  const [hasGalleryPermission, setHasGalleryPermission] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    trackEvent('screen_view', { screen: 'home' });
    refreshUser();
    requestPermissions();
    
    // Entry animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
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

  const handleSectionPress = (sectionId: string) => {
    trackEvent('action', { type: 'section_tap', section: sectionId });
    setSelectedSection(sectionId);
    // Navigate to category screen
    // navigation.navigate('CategoryScreen', { sectionId });
  };

  const handleSeeAllPress = (sectionId: string) => {
    trackEvent('action', { type: 'see_all_tap', section: sectionId });
    // Navigate to category screen
    // navigation.navigate('CategoryScreen', { sectionId });
  };

  const handleVideoPress = (videoId: string) => {
    trackEvent('action', { type: 'video_tap', video: videoId });
    // Navigate to video creation screen
    // navigation.navigate('VideoCreation', { videoId });
  };

  const renderContentSection = ({ item }: { item: typeof mockContentSections[0] }) => (
    <Section key={item.id} style={styles.section}>
      <View style={styles.sectionHeader}>
        <SectionHeader emoji={item.emoji}>{item.title}</SectionHeader>
        <Button
          variant="tertiary"
          onPress={() => handleSeeAllPress(item.id)}
          style={styles.seeAllButton}
        >
          See All
        </Button>
      </View>
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalScroll}
      >
        {item.items.map((contentItem) => (
          <GalleryCard
            key={contentItem.id}
            variant="photo"
            size="medium"
            title={contentItem.title}
            category={contentItem.category}
            isPremium={contentItem.isPremium}
            onPress={() => handleSectionPress(item.id)}
            style={styles.galleryCard}
          />
        ))}
      </ScrollView>
    </Section>
  );

  const renderVideoSection = () => (
    <Section title="Popular AI Videos" emoji="🎬" style={styles.section}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalScroll}
      >
        {mockVideoContent.map((video) => (
          <Card
            key={video.id}
            variant="video"
            size="medium"
            title={video.title}
            metadata={video.duration}
            isPremium={video.isPremium}
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
    <Container>
      {/* Header */}
      <Header
        title="PhotoRestore"
        subtitle="AI Photo Enhancement"
        leftAction={
          <View style={styles.appLogo}>
            <Text variant="display" weight="bold">✨</Text>
          </View>
        }
        rightAction={
          <Row spacing="small">
            {user?.isPro && (
              <View style={styles.proBadge}>
                <Text variant="caption" color="primary" weight="medium">PRO</Text>
              </View>
            )}
            <NavigationButton
              icon={<Text variant="title">📋</Text>}
              onPress={() => navigation.navigate('Menu')}
            />
            <NavigationButton
              icon={<Text variant="title">⚙️</Text>}
              onPress={() => navigation.navigate('Profile')}
            />
          </Row>
        }
      />

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
        {/* Quick Actions */}
        <Section style={styles.quickActionsSection}>
          <Button
            variant="primary"
            onPress={pickImageFromGallery}
            style={styles.mainActionButton}
            icon={<Text variant="title">📷</Text>}
          >
            Enhance Photo
          </Button>
          
          {!hasCredits && (
            <Button
              variant="premium"
              onPress={() => {
                trackEvent('action', { type: 'upgrade_tap' });
                // navigation.navigate('Purchase');
              }}
              style={styles.upgradeButton}
            >
              Get Credits
            </Button>
          )}
        </Section>

        {/* Content Discovery Sections */}
        <FlatList
          data={mockContentSections}
          renderItem={renderContentSection}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          ListFooterComponent={renderVideoSection()}
        />

        <Spacer size="large" />
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
      />
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  section: {
    marginBottom: 32,
  },
  
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  
  seeAllButton: {
    paddingHorizontal: 0,
  },
  
  horizontalScroll: {
    paddingHorizontal: 16,
  },
  
  galleryCard: {
    marginRight: 12,
  },
  
  quickActionsSection: {
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  
  mainActionButton: {
    width: '100%',
    marginBottom: 12,
  },
  
  upgradeButton: {
    width: '100%',
  },
  
  appLogo: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: 20,
  },
  
  proBadge: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  
  fab: {
    bottom: 90,
  },
});