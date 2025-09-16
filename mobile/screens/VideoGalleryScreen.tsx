import * as React from 'react'
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  SafeAreaView,
  Animated,
  Dimensions,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import { useAnalytics } from '../contexts/AnalyticsContext';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme';
import sliderGif from '../assets/slider.gif';
import { useTranslation } from 'react-i18next';

const { width: screenWidth } = Dimensions.get('window');

type VideoGalleryScreenNavigationProp = StackNavigationProp<RootStackParamList, 'VideoGallery'>;

interface VideoItem {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: string;
  isPremium: boolean;
  category: string;
  featureId: string;
}

interface VideoCategory {
  id: string;
  title: string;
  emoji: string;
  description: string;
  items: VideoItem[];
}

export default function VideoGalleryScreen() {
  const navigation = useNavigation<VideoGalleryScreenNavigationProp>();
  const { trackEvent } = useAnalytics();
  const { t } = useTranslation();

  const mockVideoCategories: VideoCategory[] = [
    {
      id: 'animate-old-photos',
      title: t('videoGallery.categories.animateOldPhotos.title'),
      emoji: '📹',
      description: t('videoGallery.categories.animateOldPhotos.description'),
      items: [
        {
          id: 'animate-1',
          title: t('videoGallery.videos.photoToVideo.title'),
          description: t('videoGallery.videos.photoToVideo.description'),
          thumbnail: 'https://picsum.photos/400/225?random=animate1',
          duration: '0:30',
          isPremium: true,
          category: t('videoGallery.categoryLabels.animation'),
          featureId: 'animate-old-photos',
        },
        {
          id: 'animate-2',
          title: t('videoGallery.videos.faceAnimation.title'),
          description: t('videoGallery.videos.faceAnimation.description'),
          thumbnail: 'https://picsum.photos/400/225?random=animate2',
          duration: '0:15',
          isPremium: false,
          category: t('videoGallery.categoryLabels.animation'),
          featureId: 'animate-old-photos',
        },
        {
          id: 'animate-3',
          title: t('videoGallery.videos.vintageRestoration.title'),
          description: t('videoGallery.videos.vintageRestoration.description'),
          thumbnail: 'https://picsum.photos/400/225?random=animate3',
          duration: '1:00',
          isPremium: true,
          category: t('videoGallery.categoryLabels.animation'),
          featureId: 'animate-old-photos',
        },
      ],
    },
    {
      id: 'ai-video-generation',
      title: t('videoGallery.categories.aiVideoGeneration.title'),
      emoji: '🎬',
      description: t('videoGallery.categories.aiVideoGeneration.description'),
      items: [
        {
          id: 'video-1',
          title: t('videoGallery.videos.textToVideo.title'),
          description: t('videoGallery.videos.textToVideo.description'),
          thumbnail: 'https://picsum.photos/400/225?random=video1',
          duration: '0:45',
          isPremium: true,
          category: t('videoGallery.categoryLabels.generation'),
          featureId: 'ai-video-generation',
        },
        {
          id: 'video-2',
          title: t('videoGallery.videos.imageToVideo.title'),
          description: t('videoGallery.videos.imageToVideo.description'),
          thumbnail: 'https://picsum.photos/400/225?random=video2',
          duration: '0:30',
          isPremium: false,
          category: t('videoGallery.categoryLabels.generation'),
          featureId: 'ai-video-generation',
        },
        {
          id: 'video-3',
          title: t('videoGallery.videos.styleTransfer.title'),
          description: t('videoGallery.videos.styleTransfer.description'),
          thumbnail: 'https://picsum.photos/400/225?random=video3',
          duration: '1:15',
          isPremium: true,
          category: t('videoGallery.categoryLabels.generation'),
          featureId: 'ai-video-generation',
        },
      ],
    },
    {
      id: 'motion-templates',
      title: t('videoGallery.categories.motionTemplates.title'),
      emoji: '🎭',
      description: t('videoGallery.categories.motionTemplates.description'),
      items: [
        {
          id: 'motion-1',
          title: t('videoGallery.videos.slideshowCreator.title'),
          description: t('videoGallery.videos.slideshowCreator.description'),
          thumbnail: 'https://picsum.photos/400/225?random=motion1',
          duration: '2:00',
          isPremium: false,
          category: t('videoGallery.categoryLabels.templates'),
          featureId: 'motion-templates',
        },
        {
          id: 'motion-2',
          title: t('videoGallery.videos.socialMedia.title'),
          description: t('videoGallery.videos.socialMedia.description'),
          thumbnail: 'https://picsum.photos/400/225?random=motion2',
          duration: '0:15',
          isPremium: true,
          category: t('videoGallery.categoryLabels.templates'),
          featureId: 'motion-templates',
        },
        {
          id: 'motion-3',
          title: t('videoGallery.videos.businessPresentations.title'),
          description: t('videoGallery.videos.businessPresentations.description'),
          thumbnail: 'https://picsum.photos/400/225?random=motion3',
          duration: '1:30',
          isPremium: true,
          category: t('videoGallery.categoryLabels.templates'),
          featureId: 'motion-templates',
        },
      ],
    },
  ];
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    trackEvent('screen_view', { screen: 'video_gallery' });
    
    // Entry animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleVideoPress = useCallback((video: VideoItem) => {
    trackEvent('video_gallery_action', {
      type: 'video_tap',
      videoId: video.id,
      featureId: video.featureId,
      isPremium: video.isPremium
    });

    if (video.isPremium) {
      // Navigate to purchase screen for premium videos
      navigation.navigate('Purchase');
    } else {
      // Navigate to video creation screen
      // For now, show a placeholder
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        // navigation.navigate('VideoCreation', { featureId: video.featureId });
      }, 1000);
    }
  }, [trackEvent, navigation]);

  const handleGetFullPack = useCallback((categoryId: string) => {
    trackEvent('video_gallery_action', {
      type: 'get_full_pack',
      categoryId
    });
    navigation.navigate('Purchase');
  }, [trackEvent, navigation]);

  const filteredCategories = useMemo(() =>
    selectedCategory === 'all'
      ? mockVideoCategories
      : mockVideoCategories.filter(cat => cat.id === selectedCategory),
    [selectedCategory]
  );

  const renderVideoItem = useCallback(({ item }: { item: VideoItem }) => (
    <TouchableOpacity
      style={styles.videoItem}
      onPress={() => handleVideoPress(item)}
      activeOpacity={0.9}
    >
      <Image source={sliderGif} style={styles.videoItemBackground} />
      <Image
        source={{ uri: item.thumbnail }}
        style={styles.videoThumbnail}
        resizeMode="cover"
        loadingIndicatorSource={{ uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' }}
      />

      {/* Duration Badge */}
      <View style={styles.durationBadge}>
        <Text style={styles.durationText}>{item.duration}</Text>
      </View>

      {/* Premium Badge */}
      {item.isPremium && (
        <View style={styles.premiumBadge}>
          <Text style={styles.premiumBadgeText}>{t('videoGallery.premiumBadge')}</Text>
        </View>
      )}

      {/* Video Info Overlay */}
      <View style={styles.videoOverlay}>
        <Text style={styles.videoTitle}>{item.title}</Text>
        <Text style={styles.videoDescription}>{item.description}</Text>
        <Text style={styles.videoCategory}>{item.category}</Text>
      </View>

      {/* Play Button */}
      <View style={styles.playButton}>
        <Text style={styles.playIcon}>▶</Text>
      </View>
    </TouchableOpacity>
  ), [handleVideoPress, t]);

  const renderCategoryPill = useCallback((category: string) => (
    <TouchableOpacity
      key={category}
      style={[
        styles.categoryPill,
        selectedCategory === category && styles.categoryPillActive
      ]}
      onPress={() => setSelectedCategory(category)}
    >
      <Text style={[
        styles.categoryPillText,
        selectedCategory === category && styles.categoryPillTextActive
      ]}>
        {category === 'all' ? t('videoGallery.filter.all') : mockVideoCategories.find(c => c.id === category)?.title || category}
      </Text>
    </TouchableOpacity>
  ), [selectedCategory, t, mockVideoCategories]);

  const renderCategorySection = useCallback(({ item: category }: { item: VideoCategory }) => (
    <View key={category.id} style={styles.categorySection}>
      <View style={styles.categoryHeader}>
        <View style={styles.categoryTitleContainer}>
          <Text style={styles.categoryEmoji}>{category.emoji}</Text>
          <View>
            <Text style={styles.categoryTitle}>{category.title}</Text>
            <Text style={styles.categoryDescription}>{category.description}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.getFullPackButton}
          onPress={() => handleGetFullPack(category.id)}
        >
          <Text style={styles.getFullPackText}>{t('videoGallery.getFullPack')}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={category.items}
        renderItem={renderVideoItem}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={3}
        windowSize={5}
        initialNumToRender={2}
        getItemLayout={(data, index) => (
          { length: screenWidth - 20, offset: (screenWidth - 20) * index, index }
        )}
        contentContainerStyle={styles.videoScrollContainer}
      />
    </View>
  ), [renderVideoItem, handleGetFullPack, t, screenWidth]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('videoGallery.title')}</Text>
        <TouchableOpacity style={styles.searchButton}>
          <Text style={styles.searchIcon}>🔍</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Category Filter */}
      <Animated.View style={[styles.filterContainer, { opacity: fadeAnim }]}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContainer}
        >
          {renderCategoryPill('all')}
          {mockVideoCategories.map(category => renderCategoryPill(category.id))}
        </ScrollView>
      </Animated.View>

      {/* Video Categories */}
      <Animated.ScrollView
        style={[styles.content, { opacity: fadeAnim }]}
        showsVerticalScrollIndicator={false}
      >
        <FlatList
          data={filteredCategories}
          renderItem={renderCategorySection}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          removeClippedSubviews={true}
          maxToRenderPerBatch={2}
          windowSize={3}
          initialNumToRender={1}
          getItemLayout={(data, index) => (
            { length: 280, offset: 280 * index, index }
          )}
          ListFooterComponent={<View style={styles.bottomSpacing} />}
        />
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 44,
    paddingBottom: 16,
    backgroundColor: colors.background.primary,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backArrow: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  searchButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchIcon: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  filterContainer: {
    height: 52,
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.borderPrimary,
  },
  filterScrollContainer: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  categoryPill: {
    height: 32,
    paddingHorizontal: 16,
    backgroundColor: '#2C2C2E',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  categoryPillActive: {
    backgroundColor: '#FF3B30',
  },
  categoryPillText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  categoryPillTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  categorySection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  categoryDescription: {
    fontSize: 12,
    color: '#8E8E93',
  },
  getFullPackButton: {
    backgroundColor: colors.accent.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  getFullPackText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  videoScrollContainer: {
    paddingRight: 16,
  },
  videoItem: {
    width: screenWidth - 32,
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.background.card,
    marginRight: 12,
  },
  videoItemBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    opacity: 0.3,
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  durationBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: colors.background.overlay,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  durationText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  premiumBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.accent.warning,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  premiumBadgeText: {
    fontSize: 10,
    color: '#000000',
    fontWeight: '700',
  },
  videoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    backgroundColor: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  videoDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 2,
  },
  videoCategory: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -24 }, { translateY: -24 }],
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accent.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    fontSize: 20,
    color: '#FFFFFF',
    marginLeft: 2,
  },
  bottomSpacing: {
    height: 100,
  },
});