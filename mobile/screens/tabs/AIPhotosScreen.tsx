import * as React from 'react';
import { useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Text,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '../App';
import { useUser } from '../../contexts/UserContext';
import { useAnalytics } from '../../contexts/AnalyticsContext';
import { useTranslation } from 'react-i18next';

interface AlbumItem {
  id: string;
  title: string;
  isPremium?: boolean;
  imageUrl: string;
}

interface AlbumCategory {
  id: string;
  title: string;
  emoji: string;
  description: string;
  items: AlbumItem[];
}

type AIPhotosScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'AIPhotos'>;

// Mock album data for AI Photos
const albumCategories = [
  {
    id: 'future-baby',
    title: 'Future Baby',
    emoji: '🍼',
    description: 'See what your future baby might look like',
    items: [
      { id: '1', title: 'Baby Prediction', isPremium: true, imageUrl: 'https://picsum.photos/140/175?random=baby1' },
      { id: '2', title: 'Family Preview', isPremium: true, imageUrl: 'https://picsum.photos/140/175?random=baby2' },
      { id: '3', title: 'Child Generator', isPremium: true, imageUrl: 'https://picsum.photos/140/175?random=baby3' },
    ],
  },
  {
    id: 'digital-twin',
    title: 'Digital Twin',
    emoji: '🎭',
    description: 'Create your digital avatar',
    items: [
      { id: '1', title: '3D Avatar', isPremium: true, imageUrl: 'https://picsum.photos/140/175?random=avatar1' },
      { id: '2', title: 'Virtual Clone', isPremium: true, imageUrl: 'https://picsum.photos/140/175?random=avatar2' },
      { id: '3', title: 'Digital Persona', isPremium: true, imageUrl: 'https://picsum.photos/140/175?random=avatar3' },
    ],
  },
  {
    id: 'professional-headshots',
    title: 'Professional Headshots',
    emoji: '💼',
    description: 'Business photo enhancement',
    items: [
      { id: '1', title: 'Corporate', imageUrl: 'https://picsum.photos/140/175?random=corporate1' },
      { id: '2', title: 'LinkedIn', isPremium: true, imageUrl: 'https://picsum.photos/140/175?random=corporate2' },
      { id: '3', title: 'Portfolio', imageUrl: 'https://picsum.photos/140/175?random=corporate3' },
    ],
  },
  {
    id: 'vintage-portraits',
    title: 'Vintage Portraits',
    emoji: '🎨',
    description: 'Classic styling',
    items: [
      { id: '1', title: 'Victorian', imageUrl: 'https://picsum.photos/140/175?random=vintage1' },
      { id: '2', title: 'Renaissance', isPremium: true, imageUrl: 'https://picsum.photos/140/175?random=vintage2' },
      { id: '3', title: 'Retro', imageUrl: 'https://picsum.photos/140/175?random=vintage3' },
    ],
  },
  {
    id: 'fantasy-characters',
    title: 'Fantasy Characters',
    emoji: '🧙',
    description: 'Costume and character photos',
    items: [
      { id: '1', title: 'Wizard', imageUrl: 'https://picsum.photos/140/175?random=fantasy1' },
      { id: '2', title: 'Knight', isPremium: true, imageUrl: 'https://picsum.photos/140/175?random=fantasy2' },
      { id: '3', title: 'Elf', imageUrl: 'https://picsum.photos/140/175?random=fantasy3' },
    ],
  },
];

export default function AIPhotosScreen() {
  const navigation = useNavigation<AIPhotosScreenNavigationProp>();
  const { user, refreshUser } = useUser();
  const { trackEvent } = useAnalytics();

  useEffect(() => {
    trackEvent('screen_view', { screen: 'ai_photos' });
    refreshUser();
  }, []);

  const handleAlbumPress = (albumId: string) => {
    trackEvent('action', { type: 'album_tap', album: albumId });
    
    const album = albumCategories.find(a => a.id === albumId);
    if (album) {
      navigation.navigate('SelfieUpload', {
        featureId: albumId,
        featureTitle: album.title,
        featureDescription: album.description,
      });
    }
  };

  const handleSeeAllPress = (albumId: string) => {
    trackEvent('action', { type: 'see_all_tap', album: albumId });
    handleAlbumPress(albumId);
  };

  const handleSettingsPress = () => {
    navigation.navigate('Settings');
  };

  
  const renderAlbumCard = (item: AlbumItem, album: AlbumCategory) => (
    <TouchableOpacity
      key={item.id}
      style={styles.albumCard}
      onPress={() => handleAlbumPress(album.id)}
      activeOpacity={0.8}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.albumImage} />
      <View style={styles.albumOverlay}>
        <Text style={styles.albumTitle}>{item.title}</Text>
      </View>
      {item.isPremium && (
        <View style={styles.premiumBadge}>
          <Text style={styles.premiumBadgeText}>PRO</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderAlbumSection = (album: AlbumCategory) => (
    <View key={album.id} style={styles.albumSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{album.emoji} {album.title}</Text>
        <TouchableOpacity
          style={styles.seeAllButton}
          onPress={() => handleSeeAllPress(album.id)}
        >
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.albumsScroll}
      >
        {album.items.map((item: AlbumItem) => renderAlbumCard(item, album))}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" />

      {/* Screen Title */}
      <View style={styles.titleSection}>
        <View style={styles.titleContainer}>
          <View style={styles.titleTextContainer}>
            <Text style={styles.screenTitle}>AI Photos</Text>
            <Text style={styles.screenSubtitle}>Generate AI-powered photos</Text>
          </View>
          <TouchableOpacity style={styles.settingsButton} onPress={handleSettingsPress}>
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {albumCategories.map(renderAlbumSection)}

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
  
  // Album Section Styles
  albumSection: {
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
  albumsScroll: {
    paddingHorizontal: 0,
  },
  albumCard: {
    width: 140,
    height: 175,
    borderRadius: 16,
    marginRight: 12,
    overflow: 'hidden',
    backgroundColor: '#2C2C2E',
  },
  albumImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  albumOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
    padding: 12,
  },
  albumTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
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
  bottomSpacing: {
    height: 80,
  },
});