import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';

interface Enhancement {
  id: string;
  original_url: string;
  enhanced_url: string;
  thumbnail_url: string;
  resolution: string;
  created_at: string;
  processing_time: number;
  watermark: boolean;
}

const { width: screenWidth } = Dimensions.get('window');
const numColumns = 3;
const itemSize = (screenWidth - 40 - (numColumns - 1) * 10) / numColumns;

export default function EnhancementHistory() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [enhancements, setEnhancements] = useState<Enhancement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadEnhancements();
  }, []);

  const loadEnhancements = async (isRefreshing = false) => {
    try {
      if (isRefreshing) setRefreshing(true);
      else setLoading(true);

      const userId = await SecureStore.getItemAsync('userId');
      if (!userId) return;

      const response = await axios.get(
        `${API_BASE_URL}${API_ENDPOINTS.enhance}ments/${userId}`
      );

      setEnhancements(response.data.enhancements);
    } catch (error) {
      console.error('Error loading enhancements:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleEnhancementPress = (enhancement: Enhancement) => {
    navigation.navigate('Export', {
      originalUri: `${API_BASE_URL}${enhancement.original_url}`,
      enhancedUri: `${API_BASE_URL}${enhancement.enhanced_url}`,
      enhancementId: enhancement.id,
      watermark: enhancement.watermark,
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderEnhancement = ({ item }: { item: Enhancement }) => (
    <TouchableOpacity
      style={styles.enhancementItem}
      onPress={() => handleEnhancementPress(item)}
    >
      <Image
        source={{ uri: `${API_BASE_URL}${item.thumbnail_url}` }}
        style={styles.thumbnail}
      />
      <View style={styles.enhancementInfo}>
        <Text style={styles.resolutionBadge}>{item.resolution.toUpperCase()}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading && enhancements.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!loading && enhancements.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No restorations yet</Text>
        <Text style={styles.emptySubtext}>
          Upload a photo to get started
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Recent Restorations</Text>
      <FlatList
        data={enhancements}
        renderItem={renderEnhancement}
        keyExtractor={(item) => item.id}
        numColumns={numColumns}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        refreshing={refreshing}
        onRefresh={() => loadEnhancements(true)}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#666',
    fontSize: 14,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  listContent: {
    paddingHorizontal: 20,
  },
  row: {
    justifyContent: 'space-between',
  },
  enhancementItem: {
    width: itemSize,
    height: itemSize,
    marginBottom: 10,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  enhancementInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 4,
  },
  resolutionBadge: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
});