import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import { useUser } from '../contexts/UserContext';
import { useAnalytics } from '../contexts/AnalyticsContext';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

interface Props {
  navigation: HomeScreenNavigationProp;
}

export default function HomeScreen({ navigation }: Props) {
  const { user, refreshUser } = useUser();
  const { trackEvent } = useAnalytics();
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [hasGalleryPermission, setHasGalleryPermission] = useState<boolean | null>(null);

  useEffect(() => {
    trackEvent('screen_view', { screen: 'home' });
    refreshUser();
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    const cameraStatus = await Camera.requestCameraPermissionsAsync();
    setHasCameraPermission(cameraStatus.status === 'granted');
    
    const galleryStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
    setHasGalleryPermission(galleryStatus.status === 'granted');
  };

  const pickImageFromGallery = async () => {
    if (!hasGalleryPermission) {
      Alert.alert('Permission Required', 'Please enable gallery access in settings.');
      return;
    }

    trackEvent('action', { type: 'gallery_open' });

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
      trackEvent('action', { type: 'image_selected_gallery' });
      navigation.navigate('RestorationPreview', { imageUri: result.assets[0].uri });
    }
  };

  const takePhoto = async () => {
    if (!hasCameraPermission) {
      Alert.alert('Permission Required', 'Please enable camera access in settings.');
      return;
    }

    trackEvent('action', { type: 'camera_open' });

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
      trackEvent('action', { type: 'photo_taken' });
      navigation.navigate('RestorationPreview', { imageUri: result.assets[0].uri });
    }
  };

  const getTotalCredits = () => {
    if (!user) return { standard: 0, hd: 0 };
    
    let standardTotal = user.standardCredits;
    let hdTotal = user.hdCredits;

    if (user.subscriptionType && user.subscriptionExpires && user.subscriptionExpires > new Date()) {
      standardTotal += user.remainingTodayStandard;
      hdTotal += user.remainingTodayHd;
    }

    return { standard: standardTotal, hd: hdTotal };
  };

  const credits = getTotalCredits();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Restore Your Photos</Text>
        <Text style={styles.subtitle}>AI-powered enhancement</Text>
      </View>

      <View style={styles.creditsContainer}>
        <View style={styles.creditBox}>
          <Text style={styles.creditLabel}>Standard</Text>
          <Text style={styles.creditValue}>{credits.standard}</Text>
          <Text style={styles.creditUnit}>images left</Text>
        </View>
        <View style={styles.creditBox}>
          <Text style={styles.creditLabel}>HD</Text>
          <Text style={styles.creditValue}>{credits.hd}</Text>
          <Text style={styles.creditUnit}>images left</Text>
        </View>
      </View>

      <View style={styles.buttonsContainer}>
        <TouchableOpacity style={styles.button} onPress={pickImageFromGallery}>
          <Text style={styles.buttonIcon}>🖼️</Text>
          <Text style={styles.buttonText}>Upload from Gallery</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={takePhoto}>
          <Text style={styles.buttonIcon}>📸</Text>
          <Text style={styles.buttonText}>Take Photo</Text>
        </TouchableOpacity>
      </View>

      {user && credits.standard === 0 && credits.hd === 0 && (
        <TouchableOpacity 
          style={styles.purchaseButton}
          onPress={() => {
            trackEvent('action', { type: 'purchase_button_tap' });
            Alert.alert('Purchase Credits', 'Purchase functionality coming soon!');
          }}
        >
          <Text style={styles.purchaseButtonText}>Get More Credits</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
  },
  header: {
    marginTop: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#888',
  },
  creditsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 40,
    marginBottom: 60,
  },
  creditBox: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 140,
  },
  creditLabel: {
    color: '#888',
    fontSize: 14,
    marginBottom: 8,
  },
  creditValue: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
  },
  creditUnit: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  buttonsContainer: {
    gap: 20,
  },
  button: {
    backgroundColor: '#333',
    padding: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  buttonIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  purchaseButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
  },
  purchaseButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});