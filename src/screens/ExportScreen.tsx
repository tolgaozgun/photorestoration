import React, { useState } from 'react';
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
} from 'react-native';
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
        Alert.alert('Permission Denied', 'Please enable photo library access in settings.');
        return;
      }

      const fileUri = FileSystem.documentDirectory + `enhanced_${enhancementId}.jpg`;
      await FileSystem.downloadAsync(enhancedUri, fileUri);

      const asset = await MediaLibrary.createAssetAsync(fileUri);
      await MediaLibrary.createAlbumAsync('Photo Restoration', asset, false);

      Alert.alert('Success', 'Photo saved to your gallery!');
      trackEvent('export_success', { type: 'save_to_device' });
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to save photo. Please try again.');
      trackEvent('export_error', { type: 'save_to_device', error: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const sharePhoto = async () => {
    setIsSharing(true);
    trackEvent('export_action', { type: 'share' });

    try {
      const fileUri = FileSystem.documentDirectory + `enhanced_share_${enhancementId}.jpg`;
      await FileSystem.downloadAsync(enhancedUri, fileUri);

      if (Platform.OS === 'ios') {
        await Share.share({
          url: fileUri,
        });
      } else {
        await Sharing.shareAsync(fileUri);
      }

      trackEvent('export_success', { type: 'share' });
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Error', 'Failed to share photo. Please try again.');
      trackEvent('export_error', { type: 'share', error: error.message });
    } finally {
      setIsSharing(false);
    }
  };

  const handlePurchase = () => {
    trackEvent('export_action', { type: 'purchase_from_watermark' });
    navigation.navigate('Home');
    Alert.alert('Purchase Credits', 'Purchase functionality coming soon!');
  };

  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: enhancedUri }} style={styles.image} resizeMode="contain" />
        {watermark && (
          <View style={styles.watermarkOverlay}>
            <Text style={styles.watermarkText}>Photo Restoration AI</Text>
          </View>
        )}
      </View>

      {watermark && (
        <View style={styles.watermarkNotice}>
          <Text style={styles.watermarkNoticeText}>
            ⚠️ This image contains a watermark
          </Text>
          <Text style={styles.watermarkSubtext}>
            Purchase credits to remove watermark
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
              <Text style={styles.buttonText}>Save to Device</Text>
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
              <Text style={styles.buttonText}>Share Photo</Text>
            </>
          )}
        </TouchableOpacity>

        {watermark && (
          <TouchableOpacity 
            style={[styles.button, styles.purchaseButton]} 
            onPress={handlePurchase}
          >
            <Text style={styles.buttonIcon}>✨</Text>
            <Text style={styles.buttonText}>Remove Watermark</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity 
        style={styles.doneButton}
        onPress={() => navigation.navigate('Home')}
      >
        <Text style={styles.doneButtonText}>Done</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
  },
  imageContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    overflow: 'hidden',
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