import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  SafeAreaView,
  Animated,
  Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import { useAnalytics } from '../contexts/AnalyticsContext';
import { useUser } from '../contexts/UserContext';
import axios from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import * as SecureStore from 'expo-secure-store';

type RecentsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'MainTabs'>;

const { width: screenWidth } = Dimensions.get('window');
const GRID_ITEM_SIZE = (screenWidth - 36) / 3; // 3 columns with minimal padding

export default function RecentsScreen() {
  const navigation = useNavigation<RecentsScreenNavigationProp>();
  const { t } = useTranslation();
  const { trackEvent } = useAnalytics();
  const [recentImages, setRecentImages] = useState<Array<{ 
    id: string; 
    originalUrl: string;
    enhancedUrl: string;
    thumbnailUrl: string;
    resolution: string;
    mode: string;
    createdAt: string;
    watermark: boolean;
  }>>([]);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    trackEvent('screen_view', { screen: 'recents' });
    loadRecentImages();
    
    // Simple fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadRecentImages = async () => {
    try {
      const userId = await SecureStore.getItemAsync('userId');
      if (!userId) return;
      
      // Check if email is linked for synced history
      const linkedEmail = await SecureStore.getItemAsync('linkedEmail');
      
      let response;
      if (linkedEmail) {
        // Load synced history from all devices
        response = await axios.get(
          `${API_BASE_URL}${API_ENDPOINTS.syncedHistory}/${linkedEmail}?limit=50`
        );
      } else {
        // Load only this device's history
        response = await axios.get(
          `${API_BASE_URL}${API_ENDPOINTS.enhancements}/${userId}?limit=50`
        );
      }
      
      setRecentImages(response.data.enhancements);
    } catch (error) {
      console.error('Failed to load recent images:', error);
    }
  };

  const getModeIcon = (mode: string) => {
    const modeIcons: { [key: string]: string } = {
      'enhance': '✨',
      'colorize': '🎨',
      'de-scratch': '🧹',
      'enlighten': '💡',
      'recreate': '🖼️',
      'combine': '👥',
    };
    return modeIcons[mode] || '✨';
  };

  const renderRecentItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.gridItem}
      onPress={() => {
        trackEvent('action', { type: 'view_recent_restoration' });
        // Navigate to view the restored image
        // You might want to navigate to a detail view or export screen
      }}
      activeOpacity={0.85}
    >
      <Image source={{ uri: `${API_BASE_URL}${item.thumbnailUrl}` }} style={styles.gridImage} />
      <View style={styles.modeOverlay}>
        <Text style={styles.modeIcon}>{getModeIcon(item.mode)}</Text>
      </View>
      <View style={styles.dateOverlay}>
        <Text style={styles.dateText}>
          {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>📷</Text>
      <Text style={styles.emptyTitle}>{t('recents.emptyTitle')}</Text>
      <Text style={styles.emptyText}>
        {t('recents.emptySubtitle')}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{t('navigation.recents')}</Text>
          {recentImages.length > 0 && (
            <Text style={styles.countText}>{recentImages.length} {t('recents.photosCount')}</Text>
          )}
        </View>

        {/* Grid of recent restorations */}
        {recentImages.length > 0 ? (
          <FlatList
            data={recentImages}
            renderItem={renderRecentItem}
            keyExtractor={(item) => item.id}
            numColumns={3}
            columnWrapperStyle={styles.gridRow}
            contentContainerStyle={styles.gridContainer}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <EmptyState />
        )}
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.5,
  },
  countText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  gridContainer: {
    paddingHorizontal: 12,
    paddingBottom: 100,
  },
  gridRow: {
    justifyContent: 'space-between',
  },
  gridItem: {
    width: GRID_ITEM_SIZE,
    height: GRID_ITEM_SIZE,
    marginBottom: 6,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  modeOverlay: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    padding: 4,
  },
  modeIcon: {
    fontSize: 14,
  },
  dateOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  dateText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
    opacity: 0.3,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },
});