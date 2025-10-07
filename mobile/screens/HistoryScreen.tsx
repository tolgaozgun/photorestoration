import * as React from 'react';
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import ImageWithLoading from '../components/ImageWithLoading';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import { useTranslation } from 'react-i18next';
import { useProcessing } from '../contexts/ProcessingContext';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';

type HistoryScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface Enhancement {
  id: string;
  user_id: string;
  original_url: string;
  enhanced_url: string;
  thumbnail_url: string | null;
  preview_url: string | null;
  blurhash: string | null;
  resolution: string;
  mode: string;
  created_at: string;
  processing_time: number;
  watermark: boolean;
}


export default function HistoryScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<HistoryScreenNavigationProp>();
  const { currentJob } = useProcessing();
  const [enhancements, setEnhancements] = useState<Enhancement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Debug logging for API configuration
  React.useEffect(() => {
    console.log('🔧 [HistoryScreen] API Configuration:', {
      API_BASE_URL,
      userId: 'will be fetched during fetchHistory',
      endpoint: `${API_BASE_URL}${API_ENDPOINTS.userEnhancements}/{user_id}`
    });
  }, []);

  // Main useEffect to fetch history
  useEffect(() => {
    console.log('🚀 [HistoryScreen] Component mounted, calling fetchHistory');
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      console.log('🔍 [HistoryScreen] Starting fetchHistory...');

      // Add timeout for SecureStore operation
      const userIdPromise = SecureStore.getItemAsync('userId');
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('SecureStore timeout')), 3000);
      });

      const userId = await Promise.race([userIdPromise, timeoutPromise]) as string;

      console.log('🔍 [HistoryScreen] Fetching history:', {
        userId,
        hasUserId: !!userId,
        endpoint: userId ? `${API_BASE_URL}${API_ENDPOINTS.enhancements}/${userId}` : 'No user ID'
      });

      if (!userId) {
        console.warn('⚠️ [HistoryScreen] No user ID found, skipping fetch');
        setIsLoading(false);
        return;
      }

      const endpoint = `${API_BASE_URL}${API_ENDPOINTS.enhancements}/${userId}`;
      console.log('🌐 [HistoryScreen] Making request to:', endpoint);

      // Add timeout for axios request
      const axiosPromise = axios.get(endpoint);
      const axiosTimeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('API request timeout')), 10000);
      });

      const response = await Promise.race([axiosPromise, axiosTimeout]) as any;

      console.log('✅ [HistoryScreen] API Response:', {
        status: response.status,
        statusText: response.statusText,
        dataType: typeof response.data,
        isArray: Array.isArray(response.data),
        dataLength: Array.isArray(response.data) ? response.data.length : 'N/A',
        firstItem: Array.isArray(response.data) && response.data.length > 0 ? response.data[0] : 'No items',
        fullData: response.data
      });

      setEnhancements(response.data);
    } catch (error: any) {
      console.error('❌ [HistoryScreen] Error fetching history:', {
        message: error?.message,
        code: error?.code,
        response: error?.response?.data,
        status: error?.response?.status,
        config: error?.config?.url,
        stack: error?.stack
      });

      // Set empty array to prevent infinite loading
      setEnhancements([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      'enhance': '✨ Enhance',
      'filter': '🎨 Filter',
      'custom-edit': '✏️ Custom Edit',
      'video': '🎬 Video',
      'colorize': '🎨 Colorize',
      'de-scratch': '🔧 De-scratch',
      'enlighten': '💡 Enlighten',
    };
    return labels[type] || type;
  };

  const formatTime = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diff = now.getTime() - then.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const handleHistoryItemPress = (item: Enhancement) => {
    // Backend should return full URLs
    console.log('🔗 [HistoryScreen] Navigation to UniversalResult:', {
      originalUri: item.original_url,
      enhancedUri: item.enhanced_url,
      previewUri: item.preview_url,
      item: item.id,
      mode: item.mode
    });

    navigation.navigate('UniversalResult', {
      originalUri: item.original_url,
      enhancedUri: item.enhanced_url,
      previewUri: item.preview_url,
      blurhash: item.blurhash,
      enhancementId: item.id,
      watermark: item.watermark,
      mode: item.mode as any,
      processingTime: item.processing_time,
    });
  };

  const renderProcessingItem = () => {
    if (!currentJob || currentJob.status === 'completed' || currentJob.status === 'failed') {
      return null;
    }

    return (
      <TouchableOpacity
        style={styles.processingItem}
        activeOpacity={0.9}
      >
        <ImageWithLoading
          source={{ uri: currentJob.originalUri }}
          style={styles.itemImage}
          contentFit="cover"
          transition={200}
          cachePolicy="memory-disk"
          placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
        />
        <View style={styles.itemContent}>
          <View style={styles.itemHeader}>
            <Text style={styles.itemType}>{getTypeLabel(currentJob.type)}</Text>
            <View style={styles.processingBadge}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.processingText}>Processing</Text>
            </View>
          </View>
          <Text style={styles.itemTime}>Started just now</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderHistoryItem = ({ item }: { item: Enhancement }) => {
    // Backend should return full URLs, but handle relative URLs as fallback
    const imageUrl = item.thumbnail_url || item.enhanced_url;

    // Debug logging for HistoryScreen images
    console.log('📚 [HistoryScreen] Rendering history item:', {
      id: item.id,
      thumbnail_url: item.thumbnail_url,
      enhanced_url: item.enhanced_url,
      finalUrl: imageUrl,
      isFullUrl: imageUrl.startsWith('http'),
      blurhash: item.blurhash,
      mode: item.mode
    });

    return (
      <TouchableOpacity
        style={styles.historyItem}
        onPress={() => handleHistoryItemPress(item)}
        activeOpacity={0.8}
      >
        <ImageWithLoading
          source={{ uri: imageUrl }}
          style={styles.itemImage}
          contentFit="cover"
          transition={200}
          cachePolicy="memory-disk"
          placeholder={item.blurhash ? { blurhash: item.blurhash } : { blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
          priority="high"
        />
        <View style={styles.itemContent}>
          <View style={styles.itemHeader}>
            <Text style={styles.itemType}>{getTypeLabel(item.mode)}</Text>
            <View style={styles.completedBadge}>
              <Text style={styles.completedText}>✓ Done</Text>
            </View>
          </View>
          <Text style={styles.itemTime}>{formatTime(item.created_at)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Screen Title */}
      <View style={styles.titleSection}>
        <View style={styles.titleContainer}>
          <View style={styles.titleTextContainer}>
            <Text style={styles.screenTitle}>History</Text>
            <Text style={styles.screenSubtitle}>Your processed images</Text>
          </View>
        </View>
      </View>

      {/* Main Content */}
      <FlatList
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        data={enhancements}
        renderItem={renderHistoryItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        maxToRenderPerBatch={5}
        windowSize={5}
        removeClippedSubviews={true}
        getItemLayout={(data, index) => ({
          length: 96,
          offset: 96 * index,
          index,
        })}
        ListHeaderComponent={() => (
          <>
            {/* Processing Queue Section */}
            {currentJob && currentJob.status === 'processing' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Processing</Text>
                {renderProcessingItem()}
              </View>
            )}

            {/* History Section Title */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent History</Text>
            </View>
          </>
        )}
        ListEmptyComponent={() => (
          isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FF3B30" />
              <Text style={styles.loadingText}>Loading history...</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📷</Text>
              <Text style={styles.emptyText}>No history yet</Text>
              <Text style={styles.emptySubtitle}>Your processed images will appear here</Text>
            </View>
          )
        )}
        ListFooterComponent={() => <View style={styles.bottomSpacing} />}
      />
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

  // Content Styles
  content: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    paddingTop: 8,
  },

  // Section Styles
  section: {
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },

  // Processing Item Styles
  processingItem: {
    flexDirection: 'row',
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#2C2C2E',
  },
  itemContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  itemTime: {
    fontSize: 14,
    color: '#8E8E93',
  },

  // Badge Styles
  processingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  processingText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  completedBadge: {
    backgroundColor: '#28A745',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completedText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // History Item Styles
  historyItem: {
    flexDirection: 'row',
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },

  // Loading and Empty States
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 12,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },

  // Utility Styles
  bottomSpacing: {
    height: 80,
  },
});
