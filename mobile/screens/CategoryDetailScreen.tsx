import * as React from 'react'
import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAnalytics } from '../contexts/AnalyticsContext';
import { colors } from '../theme';

const { width: screenWidth } = Dimensions.get('window');

interface Props {
  navigation: StackNavigationProp<any>;
  route: RouteProp<any, 'CategoryDetail'>;
}

interface CategoryItem {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
  isPremium?: boolean;
  description?: string;
}

interface CategoryData {
  id: string;
  title: string;
  emoji: string;
  description: string;
  items: CategoryItem[];
  subcategories: string[];
}

export default function CategoryDetailScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { categoryId } = route.params as { categoryId: string };
  const { trackEvent } = useAnalytics();
  const [activeTab, setActiveTab] = useState<'all' | 'photos' | 'videos'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Mock category data
  const categoryData: CategoryData[] = [
    {
      id: 'future-baby',
      title: 'Future Baby with AI',
      emoji: '🍼',
      description: 'See what your future baby might look like',
      subcategories: ['All', 'Realistic', 'Artistic', 'Ethnic'],
      items: [
        { id: '1', title: 'Baby Prediction', category: 'AI', imageUrl: 'https://picsum.photos/300/400?random=baby1', isPremium: true },
        { id: '2', title: 'Family Preview', category: 'AI', imageUrl: 'https://picsum.photos/300/400?random=family1', isPremium: true },
        { id: '3', title: 'Child Generator', category: 'AI', imageUrl: 'https://picsum.photos/300/400?random=child1', isPremium: true },
        { id: '4', title: 'Twins Prediction', category: 'AI', imageUrl: 'https://picsum.photos/300/400?random=twins1' },
        { id: '5', title: 'Baby Mix', category: 'AI', imageUrl: 'https://picsum.photos/300/400?random=mix1' },
        { id: '6', title: 'Future Child', category: 'AI', imageUrl: 'https://picsum.photos/300/400?random=future1' },
      ],
    },
    {
      id: 'outfit-tryon',
      title: 'Choose Your Outfit',
      emoji: '👕',
      description: 'Try different outfits on your photos',
      subcategories: ['All', 'Casual', 'Business', 'Evening'],
      items: [
        { id: '1', title: 'Casual Wear', category: 'Fashion', imageUrl: 'https://picsum.photos/300/400?random=casual1' },
        { id: '2', title: 'Business Attire', category: 'Fashion', imageUrl: 'https://picsum.photos/300/400?random=business1', isPremium: true },
        { id: '3', title: 'Evening Dress', category: 'Fashion', imageUrl: 'https://picsum.photos/300/400?random=evening1', isPremium: true },
        { id: '4', title: 'Street Style', category: 'Fashion', imageUrl: 'https://picsum.photos/300/400?random=street1' },
        { id: '5', title: 'Summer Look', category: 'Fashion', imageUrl: 'https://picsum.photos/300/400?random=summer1' },
        { id: '6', title: 'Winter Fashion', category: 'Fashion', imageUrl: 'https://picsum.photos/300/400?random=winter1' },
      ],
    },
    {
      id: 'digital-twin',
      title: 'Digital Twin',
      emoji: '🎭',
      description: 'Create your digital avatar',
      subcategories: ['All', '3D Model', 'Anime', 'Sci-Fi'],
      items: [
        { id: '1', title: '3D Avatar', category: 'AI', imageUrl: 'https://picsum.photos/300/400?random=avatar1', isPremium: true },
        { id: '2', title: 'Virtual Clone', category: 'AI', imageUrl: 'https://picsum.photos/300/400?random=clone1', isPremium: true },
        { id: '3', title: 'Digital Persona', category: 'AI', imageUrl: 'https://picsum.photos/300/400?random=persona1', isPremium: true },
        { id: '4', title: 'Cartoon Version', category: 'AI', imageUrl: 'https://picsum.photos/300/400?random=cartoon1' },
        { id: '5', title: 'Pixel Art', category: 'AI', imageUrl: 'https://picsum.photos/300/400?random=pixel1' },
        { id: '6', title: 'Realistic Twin', category: 'AI', imageUrl: 'https://picsum.photos/300/400?random=realistic1' },
      ],
    },
  ];

  const currentCategory = categoryData.find(cat => cat.id === categoryId);

  useEffect(() => {
    trackEvent('screen_view', { screen: 'category_detail', categoryId });
    
    // Entry animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleItemPress = (item: CategoryItem) => {
    trackEvent('category_item_tap', { itemId: item.id, categoryId });
    
    if (categoryId === 'future-baby' || categoryId === 'outfit-tryon' || categoryId === 'digital-twin') {
      navigation.navigate('SelfieUpload', {
        featureId: categoryId,
        featureTitle: currentCategory?.title || '',
        featureDescription: currentCategory?.description || '',
      });
    }
  };

  const handleGetFullPack = () => {
    trackEvent('get_full_pack_tap', { categoryId });
    // navigation.navigate('Purchase');
  };

  const filteredItems = currentCategory?.items.filter(item => {
    if (activeTab === 'videos') return false;
    if (selectedCategory === 'all') return true;
    return item.category.toLowerCase() === selectedCategory.toLowerCase();
  }) || [];

  const renderPremiumPack = () => (
    <Animated.View style={[
      styles.premiumPack,
      { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
    ]}>
      <View style={styles.premiumPackHeader}>
        <View style={styles.premiumPackTitleContainer}>
          <Text style={styles.premiumPackEmoji}>{currentCategory?.emoji}</Text>
          <Text style={styles.premiumPackTitle}>{currentCategory?.title}</Text>
        </View>
        <TouchableOpacity
          style={styles.getFullPackButton}
          onPress={handleGetFullPack}
        >
          <Text style={styles.getFullPackText}>Get Full Pack</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.premiumPackMeta}>
        <View style={styles.photoCountBadge}>
          <Text style={styles.photoCountText}>{filteredItems.length} PHOTOS</Text>
        </View>
        <Text style={styles.premiumIcon}>📈</Text>
      </View>

      {/* Photo Grid */}
      <View style={styles.premiumPhotoGrid}>
        {filteredItems.slice(0, 6).map((item, index) => (
          <View key={`premium_${item.id}`} style={[
            styles.premiumPhotoItem,
            { marginRight: (index + 1) % 3 === 0 ? 0 : 8, marginBottom: index < 3 ? 8 : 0 }
          ]}>
            <Image source={{ uri: item.imageUrl }} style={styles.premiumPhotoImage} />
            {item.isPremium && (
              <View style={styles.premiumPhotoBadge}>
                <Text style={styles.premiumPhotoBadgeText}>PRO</Text>
              </View>
            )}
          </View>
        ))}
      </View>
    </Animated.View>
  );

  const renderCategoryItem = ({ item }: { item: CategoryItem }) => (
    <TouchableOpacity
      key={item.id}
      style={styles.categoryItem}
      onPress={() => handleItemPress(item)}
      activeOpacity={0.9}
    >
      <Image source={require('../assets/slider.gif')} style={styles.categoryItemBackground} />
      <Image source={{ uri: item.imageUrl }} style={styles.categoryItemImage} />
      <View style={styles.categoryItemOverlay}>
        <Text style={styles.categoryItemTitle}>{item.title}</Text>
        <Text style={styles.categoryItemCategory}>{item.category}</Text>
      </View>
      {item.isPremium && (
        <View style={styles.premiumBadge}>
          <Text style={styles.premiumBadgeText}>PREMIUM</Text>
        </View>
      )}
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
        {category}
      </Text>
    </TouchableOpacity>
  );

  if (!currentCategory) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Category not found</Text>
        </View>
      </SafeAreaView>
    );
  }

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
        <Text style={styles.headerTitle}>{currentCategory.title}</Text>
        <TouchableOpacity style={styles.dropdownButton}>
          <Text style={styles.dropdownIcon}>▼</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Filter Tabs */}
      <Animated.View style={[styles.tabsContainer, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.tabActive]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'photos' && styles.tabActive]}
          onPress={() => setActiveTab('photos')}
        >
          <Text style={[styles.tabText, activeTab === 'photos' && styles.tabTextActive]}>Photos</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'videos' && styles.tabActive]}
          onPress={() => setActiveTab('videos')}
        >
          <Text style={[styles.tabText, activeTab === 'videos' && styles.tabTextActive]}>Videos</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Category Pills */}
      <Animated.View style={[styles.pillsContainer, { opacity: fadeAnim }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {currentCategory.subcategories.map(renderCategoryPill)}
        </ScrollView>
      </Animated.View>

      {/* Content */}
      <Animated.ScrollView
        style={[styles.content, { opacity: fadeAnim }]}
        showsVerticalScrollIndicator={false}
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 50;
          if (isCloseToBottom) {
            // Load more items
            console.log('Load more items');
          }
        }}
        scrollEventThrottle={16}
      >
        {/* Premium Pack Section */}
        {renderPremiumPack()}

        {/* Individual Items Grid */}
        <View style={styles.itemsGrid}>
          <FlatList
            data={filteredItems}
            renderItem={renderCategoryItem}
            keyExtractor={(item) => item.id}
            numColumns={2}
            scrollEnabled={false}
            columnWrapperStyle={styles.itemsRow}
          />
        </View>

        <View style={styles.bottomSpacing} />
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
  dropdownButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownIcon: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  tabsContainer: {
    height: 52,
    flexDirection: 'row',
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.borderPrimary,
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.accent.primary,
  },
  tabText: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  pillsContainer: {
    height: 44,
    paddingHorizontal: 16,
    backgroundColor: colors.background.primary,
  },
  categoryPill: {
    height: 32,
    paddingHorizontal: 16,
    backgroundColor: colors.background.card,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  categoryPillActive: {
    backgroundColor: '#FFFFFF',
  },
  categoryPillText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  categoryPillTextActive: {
    color: '#000000',
  },
  content: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  premiumPack: {
    margin: 16,
    backgroundColor: colors.background.card,
    borderRadius: 20,
    padding: 16,
  },
  premiumPackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  premiumPackTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  premiumPackEmoji: {
    fontSize: 24,
  },
  premiumPackTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  getFullPackButton: {
    backgroundColor: colors.text.inverse,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  getFullPackText: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '600',
  },
  premiumPackMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  photoCountBadge: {
    backgroundColor: colors.accent.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  photoCountText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  premiumIcon: {
    fontSize: 16,
  },
  premiumPhotoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  premiumPhotoItem: {
    width: (screenWidth - 64) / 3,
    height: (screenWidth - 64) / 3,
    borderRadius: 12,
    overflow: 'hidden',
  },
  premiumPhotoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  premiumPhotoBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: colors.accent.primary,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  premiumPhotoBadgeText: {
    fontSize: 8,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  itemsGrid: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  itemsRow: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  categoryItem: {
    width: (screenWidth - 48) / 2,
    height: 240,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.background.card,
  },
  categoryItemBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    opacity: 0.3,
  },
  categoryItemImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  categoryItemOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    backgroundColor: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)',
  },
  categoryItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  categoryItemCategory: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
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
  bottomSpacing: {
    height: 100,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
});