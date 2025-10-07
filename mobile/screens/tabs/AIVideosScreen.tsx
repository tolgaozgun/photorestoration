import * as React from 'react';
import { useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ImageWithLoading from '../../components/ImageWithLoading';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { StackNavigationProp } from '@react-navigation/stack';
import { MainTabParamList, RootStackParamList } from '../App';
import { useUser } from '../../contexts/UserContext';
import { useAnalytics } from '../../contexts/AnalyticsContext';
import { useTranslation } from 'react-i18next';

interface VideoItem {
  id: string;
  title: string;
  duration: string;
  isPremium?: boolean;
  imageUrl: string;
  imagePath?: string;
}

interface VideoCategory {
  id: string;
  title: string;
  emoji: string;
  description: string;
  items: VideoItem[];
}

type AIVideosScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'AIVideos'> &
  StackNavigationProp<RootStackParamList>;

export default function AIVideosScreen() {
  const navigation = useNavigation<AIVideosScreenNavigationProp>();
  const { t } = useTranslation();
  const { refreshUser } = useUser();
  const { trackEvent } = useAnalytics();

  // Utility function to get image source
  const getImageSource = (item: VideoItem) => {
    if (item.imagePath) {
      // For local assets, we need to handle them differently in Expo
      // This is a simplified approach - in production you might want to use
      // a more sophisticated asset management system
      try {
        // For Expo, we can try to use require but it needs to be static
        // So we'll use a fallback for now
        return { uri: item.imageUrl };
      } catch (error) {
        console.warn('Failed to load image asset:', item.imagePath);
        return { uri: item.imageUrl };
      }
    }
    return { uri: item.imageUrl };
  };

  // Video data using translations
  const videoCategories = [
    {
      id: 'animate-old-photos',
      title: t('content.aiVideos.animateOldPhotos.title'),
      emoji: '📹',
      description: t('content.aiVideos.animateOldPhotos.description'),
      items: [
        { id: '1', title: t('content.aiVideos.animateOldPhotos.faceAnimation'), duration: '0:15', isPremium: true, imageUrl: 'https://picsum.photos/300/169?random=video1', imagePath: 'assets/videos/face-animation.png' },
        { id: '2', title: t('content.aiVideos.animateOldPhotos.subtleMotion'), duration: '0:10', imageUrl: 'https://picsum.photos/300/169?random=video2', imagePath: 'assets/videos/subtle-motion.png' },
        { id: '3', title: t('content.aiVideos.animateOldPhotos.expressionChanges'), duration: '0:20', imageUrl: 'https://picsum.photos/300/169?random=video3', imagePath: 'assets/videos/expression-changes.png' },
      ],
    },
    {
      id: 'cinemagraphs',
      title: t('content.aiVideos.cinemagraphs.title'),
      emoji: '🌊',
      description: t('content.aiVideos.cinemagraphs.description'),
      items: [
        { id: '1', title: t('content.aiVideos.cinemagraphs.waterFlow'), duration: '0:30', imageUrl: 'https://picsum.photos/300/169?random=cinema1', imagePath: 'assets/videos/water-flow.png' },
        { id: '2', title: t('content.aiVideos.cinemagraphs.hairMovement'), duration: '0:15', imageUrl: 'https://picsum.photos/300/169?random=cinema2', imagePath: 'assets/videos/hair-movement.png' },
        { id: '3', title: t('content.aiVideos.cinemagraphs.cloudMotion'), duration: '0:45', isPremium: true, imageUrl: 'https://picsum.photos/300/169?random=cinema3', imagePath: 'assets/videos/cloud-motion.png' },
      ],
    },
    {
      id: 'portrait-animation',
      title: t('content.aiVideos.portraitAnimation.title'),
      emoji: '😊',
      description: t('content.aiVideos.portraitAnimation.description'),
      items: [
        { id: '1', title: t('content.aiVideos.portraitAnimation.smileAnimation'), duration: '0:10', imageUrl: 'https://picsum.photos/300/169?random=portrait1', imagePath: 'assets/videos/smile-animation.png' },
        { id: '2', title: t('content.aiVideos.portraitAnimation.talkingEffect'), duration: '0:25', isPremium: true, imageUrl: 'https://picsum.photos/300/169?random=portrait2', imagePath: 'assets/videos/talking-effect.png' },
        { id: '3', title: t('content.aiVideos.portraitAnimation.eyeMovement'), duration: '0:15', imageUrl: 'https://picsum.photos/300/169?random=portrait3', imagePath: 'assets/videos/eye-movement.png' },
      ],
    },
    {
      id: 'background-animation',
      title: t('content.aiVideos.backgroundAnimation.title'),
      emoji: '🎬',
      description: t('content.aiVideos.backgroundAnimation.description'),
      items: [
        { id: '1', title: t('content.aiVideos.backgroundAnimation.skyChanges'), duration: '0:45', imageUrl: 'https://picsum.photos/300/169?random=bg1', imagePath: 'assets/videos/sky-changes.png' },
        { id: '2', title: t('content.aiVideos.backgroundAnimation.weatherEffects'), duration: '0:30', isPremium: true, imageUrl: 'https://picsum.photos/300/169?random=bg2', imagePath: 'assets/videos/weather-effects.png' },
        { id: '3', title: t('content.aiVideos.backgroundAnimation.lightTransitions'), duration: '1:00', imageUrl: 'https://picsum.photos/300/169?random=bg3', imagePath: 'assets/videos/light-transitions.png' },
      ],
    },
  ];

  useEffect(() => {
    trackEvent('screen_view', { screen: 'ai_videos' });
    refreshUser();
  }, []);

  const handleVideoPress = (videoId: string, categoryId: string) => {
    trackEvent('action', { type: 'video_tap', video: videoId, category: categoryId });
    navigation.navigate('VideoGallery');
  };

  const handleSettingsPress = () => {
    navigation.navigate('Settings');
  };

  const renderVideoCard = (item: any, categoryId: string) => (
    <TouchableOpacity
      key={item.id}
      style={styles.videoCard}
      onPress={() => handleVideoPress(item.id, categoryId)}
      activeOpacity={0.8}
    >
      <ImageWithLoading source={getImageSource(item)} style={styles.videoImage} />
      <View style={styles.playButton}>
        <Ionicons name="play" size={16} color="#000000" style={styles.playIcon} />
      </View>
      <View style={styles.videoOverlay}>
        <View style={styles.videoInfo}>
          <Text style={styles.videoTitle}>{item.title}</Text>
          <Text style={styles.videoDuration}>{item.duration}</Text>
        </View>
        {item.isPremium && (
          <View style={styles.premiumBadge}>
            <Text style={styles.premiumBadgeText}>{t('common.pro')}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderVideoSection = (category: any) => (
    <View key={category.id} style={styles.videoSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{category.emoji} {category.title}</Text>
        <TouchableOpacity
          style={styles.seeAllButton}
          onPress={() => handleVideoPress(category.id, category.id)}
        >
          <Text style={styles.seeAllText}>{t('common.seeAll')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.videosScroll}
      >
        {category.items.map((item: any) => renderVideoCard(item, category.id))}
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.container}>

      {/* Screen Title */}
      <View style={styles.titleSection}>
        <View style={styles.titleContainer}>
          <View style={styles.titleTextContainer}>
            <Text style={styles.screenTitle}>{t('tabs.aiVideos.title')}</Text>
            <Text style={styles.screenSubtitle}>{t('tabs.aiVideos.subtitle')}</Text>
          </View>
          <TouchableOpacity style={styles.settingsButton} onPress={handleSettingsPress}>
            <Ionicons name="settings" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {videoCategories.map(renderVideoSection)}
        
        {/* Bottom spacing for tab bar */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
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
  
  // Content Styles
  content: {
    flex: 1,
    backgroundColor: '#000000',
  },
  
  // Video Section Styles
  videoSection: {
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
  videosScroll: {
    paddingHorizontal: 0,
  },
  videoCard: {
    width: 300, // 16:9 aspect ratio
    height: 169,
    borderRadius: 16,
    marginRight: 12,
    overflow: 'hidden',
    backgroundColor: '#2C2C2E',
  },
  videoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  videoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent 60%)',
    padding: 12,
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -16 }, { translateY: -16 }],
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    marginLeft: 2,
  },
  videoInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  videoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  videoDuration: {
    fontSize: 12,
    color: '#8E8E93',
    marginLeft: 8,
  },
  premiumBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FF3B30',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  premiumBadgeText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  
  // Utility Styles
  bottomSpacing: {
    height: 96,
  },
});