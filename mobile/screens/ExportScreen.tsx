import * as React from 'react'
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Share,
  Platform,
  SafeAreaView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { RootStackParamList } from '../App';
import { useAnalytics } from '../contexts/AnalyticsContext';

type ExportScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Export'>;
type ExportScreenRouteProp = RouteProp<RootStackParamList, 'Export'>;

interface Props {
  navigation: ExportScreenNavigationProp;
  route: ExportScreenRouteProp;
}

export default function ExportScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { originalUri, enhancedUri, enhancementId, watermark } = route.params;
  const { trackEvent } = useAnalytics();
  const [isSaving, setIsSaving] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const saveToDevice = async () => {
    setIsSaving(true);
    trackEvent('export_action', { type: 'save_to_device' });

    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('home.permissionDenied'), t('home.galleryPermission'));
        return;
      }

      const fileName = `enhanced_${enhancementId}.png`;
      const tempDir = FileSystem.cacheDirectory;
      const filePath = `${tempDir}${fileName}`;

      // Download the file using the new API
      const { uri } = await FileSystem.downloadAsync(enhancedUri, filePath);

      const asset = await MediaLibrary.createAssetAsync(uri);
      await MediaLibrary.createAlbumAsync('Photo Restoration', asset, false);

      Alert.alert(t('settings.success'), t('export.photoSaved'));
      trackEvent('export_success', { type: 'save_to_device' });
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert(t('restoration.error'), t('export.saveFailed'));
      trackEvent('export_error', { type: 'save_to_device', error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setIsSaving(false);
    }
  };

  const sharePhoto = async () => {
    setIsSharing(true);
    trackEvent('export_action', { type: 'share' });

    try {
      const fileName = `enhanced_share_${enhancementId}.png`;
      const tempDir = FileSystem.cacheDirectory;
      const filePath = `${tempDir}${fileName}`;

      // Download the file using the new API
      const { uri } = await FileSystem.downloadAsync(enhancedUri, filePath);

      if (Platform.OS === 'ios') {
        await Share.share({
          url: uri,
        });
      } else {
        await Sharing.shareAsync(uri);
      }

      trackEvent('export_success', { type: 'share' });
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert(t('restoration.error'), t('export.shareFailed'));
      trackEvent('export_error', { type: 'share', error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setIsSharing(false);
    }
  };

  const handlePurchase = () => {
    trackEvent('export_action', { type: 'purchase_from_watermark' });
    navigation.navigate('Purchase');
    Alert.alert(t('purchase.title'), t('purchase.comingSoonMessage'));
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('export.title')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.imageContainer}>
        <Image source={{ uri: enhancedUri }} style={styles.image} resizeMode="contain" />
        {watermark && (
          <View style={styles.watermarkOverlay}>
            <Text style={styles.watermarkText}>{t('export.watermarkText')}</Text>
          </View>
        )}
      </View>

      {watermark && (
        <View style={styles.watermarkNotice}>
          <Text style={styles.watermarkNoticeText}>
            {t('export.watermarkNotice')}
          </Text>
          <Text style={styles.watermarkSubtext}>
            {t('export.watermarkSubtext')}
          </Text>
        </View>
      )}

      <View style={styles.buttonsContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]} 
          onPress={saveToDevice}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.buttonIcon}>💾</Text>
              <Text style={styles.buttonText}>{t('export.saveToDevice')}</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]} 
          onPress={sharePhoto}
          disabled={isSharing}
        >
          {isSharing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.buttonIcon}>📤</Text>
              <Text style={styles.buttonText}>{t('export.sharePhoto')}</Text>
            </>
          )}
        </TouchableOpacity>

        {watermark && (
          <TouchableOpacity 
            style={[styles.button, styles.purchaseButton]} 
            onPress={handlePurchase}
          >
            <Text style={styles.buttonIcon}>✨</Text>
            <Text style={styles.buttonText}>{t('export.removeWatermark')}</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity 
        style={styles.doneButton}
        onPress={() => navigation.navigate('MainTabs')}
      >
        <Text style={styles.doneButtonText}>{t('common.done')}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#000',
    marginBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    flex: 1,
  },
  headerSpacer: {
    width: 44,
  },
  imageContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: 20,
    marginBottom: 20,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  watermarkOverlay: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 8,
    borderRadius: 4,
  },
  watermarkText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  watermarkNotice: {
    backgroundColor: '#333',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  watermarkNoticeText: {
    color: '#FFA500',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  watermarkSubtext: {
    color: '#999',
    fontSize: 14,
  },
  buttonsContainer: {
    gap: 15,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 15,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#333',
  },
  purchaseButton: {
    backgroundColor: '#FFD700',
  },
  buttonIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  doneButton: {
    alignItems: 'center',
    padding: 16,
    marginTop: 20,
  },
  doneButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
});