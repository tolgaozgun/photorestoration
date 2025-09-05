import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import * as Haptics from 'expo-haptics';

type HistoryScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'History'
>;

interface Props {
  navigation: HistoryScreenNavigationProp;
}

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

export default function HistoryScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [enhancements, setEnhancements] = useState<Enhancement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const userId = await SecureStore.getItemAsync('userId');
      if (!userId) {
        // Handle case where user is not initialized (e.g., navigate to onboarding)
        setIsLoading(false);
        return;
      }

      const response = await axios.get(`${API_BASE_URL}${API_ENDPOINTS.enhancements}/${userId}`);
      setEnhancements(response.data.enhancements);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderItem = ({ item }: { item: Enhancement }) => (
    <TouchableOpacity 
      style={styles.historyItem}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        // Navigate to a detail screen or re-process the image
      }}
    >
      <Image source={{ uri: `${API_BASE_URL}${item.thumbnail_url}` }} style={styles.thumbnail} />
      <View style={styles.itemDetails}>
        <Text style={styles.itemTitle}>{t(`modes.${item.mode}.title`)}</Text>
        <Text style={styles.itemSubtitle}>{new Date(item.created_at).toLocaleDateString()}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('PhotoInput');
            }
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backButton}>‹ {t('navigation.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('history.title')}</Text>
      </View>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
        </View>
      ) : enhancements.length === 0 ? (
        <View style={styles.content}>
          <Image 
            source={require('../assets/empty-history.png')} 
            style={styles.illustration}
          />
          <Text style={styles.emptyPrimaryText}>{t('history.emptyPrimary')}</Text>
          <Text style={styles.emptySecondaryText}>{t('history.emptySecondary')}</Text>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.navigate('PhotoInput');
            }}
          >
            <LinearGradient
              colors={['#007AFF', '#0051D5']}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.buttonText}>{t('history.cta')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={enhancements}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.historyList}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 40,
  },
  backButton: {
    fontSize: 24,
    color: '#007AFF',
    marginRight: 10,
  },
  title: {
    fontFamily: 'SF Pro Display',
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  illustration: {
    width: 160,
    height: 160,
    marginBottom: 24,
    tintColor: '#8E8E93',
  },
  emptyPrimaryText: {
    fontFamily: 'SF Pro Display',
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySecondaryText: {
    fontFamily: 'SF Pro Text',
    fontSize: 17,
    fontWeight: '400',
    color: '#8E8E93',
    marginBottom: 40,
    textAlign: 'center',
  },
  button: {
    width: 280,
    height: 56,
    borderRadius: 16,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 5,
  },
  buttonGradient: {
    flex: 1,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontFamily: 'SF Pro Text',
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyList: {
    padding: 16,
  },
  historyItem: {
    flexDirection: 'row',
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    alignItems: 'center',
    padding: 12,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
  },
  itemTitle: {
    fontFamily: 'SF Pro Display',
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  itemSubtitle: {
    fontFamily: 'SF Pro Text',
    fontSize: 14,
    color: '#8E8E93',
  },
});
