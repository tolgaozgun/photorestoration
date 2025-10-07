import * as React from 'react'
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
  TextStyle,
} from 'react-native';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import { colors, spacing, borderRadius, typography } from '../theme';

interface Enhancement {
  id: string;
  original_url: string;
  enhanced_url: string;
  thumbnail_url: string;
  resolution: string;
  mode: string;
  created_at: string;
  processing_time: number;
  watermark: boolean;
}

const { width: screenWidth } = Dimensions.get('window');
const numColumns = 3;
const itemSize = (screenWidth - spacing['5xl'] - (numColumns - 1) * spacing.lg) / numColumns;

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
    // Backend should return full URLs
    navigation.navigate('Result', {
      originalUri: enhancement.original_url,
      enhancedUri: enhancement.enhanced_url,
      enhancementId: enhancement.id,
      watermark: enhancement.watermark,
      mode: enhancement.mode,
      processingTime: enhancement.processing_time,
    });
  };


  const renderEnhancement = ({ item }: { item: Enhancement }) => (
    <TouchableOpacity
      style={styles.enhancementItem}
      onPress={() => handleEnhancementPress(item)}
    >
      <Image
        source={{ uri: item.thumbnail_url }}
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
    paddingTop: spacing.xlLegacy,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['5xl'],
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['5xl'],
  },
  emptyText: {
    color: colors.text.primary,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold as TextStyle['fontWeight'],
    marginBottom: spacing.lg,
  },
  emptySubtext: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.lg,
  },
  sectionTitle: {
    color: colors.text.primary,
    fontSize: typography.fontSize['5xl'],
    fontWeight: typography.fontWeight.bold as TextStyle['fontWeight'],
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xlLegacy,
  },
  listContent: {
    paddingHorizontal: spacing.xlLegacy,
  },
  row: {
    justifyContent: 'space-between',
  },
  enhancementItem: {
    width: itemSize,
    height: itemSize,
    marginBottom: spacing.lg,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: colors.background.secondary,
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
    padding: spacing.sm,
  },
  resolutionBadge: {
    color: colors.text.primary,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold as TextStyle['fontWeight'],
    textAlign: 'center',
  },
});