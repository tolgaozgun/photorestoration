import * as React from 'react'
import { useState, useRef, useEffect } from 'react';
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

const mockVideoCategories: VideoCategory[] = [
  {
    id: 'animate-old-photos',
    title: 'Animate Old Photos',
    emoji: '📹',
    description: 'Bring your old photos to life with AI animation',
    items: [
      {
        id: 'animate-1',
        title: 'Photo to Video',
        description: 'Transform static photos into moving memories',
        thumbnail: 'https://picsum.photos/400/225?random=animate1',
        duration: '0:30',
        isPremium: true,
        category: 'Animation',
        featureId: 'animate-old-photos',
      },
      {
        id: 'animate-2',
        title: 'Face Animation',
        description: 'Add natural expressions and movements',
        thumbnail: 'https://picsum.photos/400/225?random=animate2',
        duration: '0:15',
        isPremium: false,
        category: 'Animation',
        featureId: 'animate-old-photos',
      },
      {
        id: 'animate-3',
        title: 'Vintage Restoration',
        description: 'Restore and animate vintage photos',
        thumbnail: 'https://picsum.photos/400/225?random=animate3',
        duration: '1:00',
        isPremium: true,
        category: 'Animation',
        featureId: 'animate-old-photos',
      },
    ],
  },
  {
    id: 'ai-video-generation',
    title: 'AI Video Generation',
    emoji: '🎬',
    description: 'Create videos from scratch with AI',
    items: [
      {
        id: 'video-1',
        title: 'Text to Video',
        description: 'Turn your ideas into videos',
        thumbnail: 'https://picsum.photos/400/225?random=video1',
        duration: '0:45',
        isPremium: true,
        category: 'Generation',
        featureId: 'ai-video-generation',
      },
      {
        id: 'video-2',
        title: 'Image to Video',
        description: 'Transform images into video sequences',
        thumbnail: 'https://picsum.photos/400/225?random=video2',
        duration: '0:30',
        isPremium: false,
        category: 'Generation',
        featureId: 'ai-video-generation',
      },
      {
        id: 'video-3',
        title: 'Style Transfer',
        description: 'Apply artistic styles to videos',
        thumbnail: 'https://picsum.photos/400/225?random=video3',
        duration: '1:15',
        isPremium: true,
        category: 'Generation',
        featureId: 'ai-video-generation',
      },
    ],
  },
  {
    id: 'motion-templates',
    title: 'Motion Templates',
    emoji: '🎭',
    description: 'Professional video templates and effects',
    items: [
      {
        id: 'motion-1',
        title: 'Slideshow Creator',
        description: 'Create beautiful photo slideshows',
        thumbnail: 'https://picsum.photos/400/225?random=motion1',
        duration: '2:00',
        isPremium: false,
        category: 'Templates',
        featureId: 'motion-templates',
      },
      {
        id: 'motion-2',
        title: 'Social Media',
        description: 'Optimized for social platforms',
        thumbnail: 'https://picsum.photos/400/225?random=motion2',
        duration: '0:15',
        isPremium: true,
        category: 'Templates',
        featureId: 'motion-templates',
      },
      {
        id: 'motion-3',
        title: 'Business Presentations',
        description: 'Professional video templates',
        thumbnail: 'https://picsum.photos/400/225?random=motion3',
        duration: '1:30',
        isPremium: true,
        category: 'Templates',
        featureId: 'motion-templates',
      },
    ],
  },
];

export default function VideoGalleryScreen() {
  const navigation = useNavigation<VideoGalleryScreenNavigationProp>();
  const { trackEvent } = useAnalytics();
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

  const handleVideoPress = (video: VideoItem) => {
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
  };

  const handleGetFullPack = (categoryId: string) => {
    trackEvent('video_gallery_action', { 
      type: 'get_full_pack', 
      categoryId 
    });
    navigation.navigate('Purchase');
  };

  const filteredCategories = selectedCategory === 'all' 
    ? mockVideoCategories 
    : mockVideoCategories.filter(cat => cat.id === selectedCategory);

  const renderVideoItem = ({ item }: { item: VideoItem }) => (
    <TouchableOpacity
      style={styles.videoItem}
      onPress={() => handleVideoPress(item)}
      activeOpacity={0.9}
    >
      <Image source={require('../assets/slider.gif')} style={styles.videoItemBackground} />
      <Image source={{ uri: item.thumbnail }} style={styles.videoThumbnail} />
      
      {/* Duration Badge */}
      <View style={styles.durationBadge}>
        <Text style={styles.durationText}>{item.duration}</Text>
      </View>
      
      {/* Premium Badge */}
      {item.isPremium && (
        <View style={styles.premiumBadge}>
          <Text style={styles.premiumBadgeText}>PRO</Text>
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
  );

  const renderCategoryPill = (category: string) => (
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
        {category === 'all' ? 'All' : mockVideoCategories.find(c => c.id === category)?.title || category}
      </Text>
    </TouchableOpacity>
  );

  const renderCategorySection = ({ item: category }: { item: VideoCategory }) => (
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
          <Text style={styles.getFullPackText}>Get Full Pack</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={category.items}
        renderItem={renderVideoItem}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.videoScrollContainer}
      />
    </View>
  );

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
        <Text style={styles.headerTitle}>AI Video Gallery</Text>
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