import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  SafeAreaView,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
// import { LinearGradient } from 'expo-linear-gradient';

interface Props {
  onPhotoSelected: (imageUri: string) => void;
}

export default function OnboardingScreen3({ onPhotoSelected }: Props) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Start pulsing animation for the main button
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    
    pulseAnimation.start();

    return () => pulseAnimation.stop();
  }, []);

  const requestPermissionAndPickImage = async () => {
    try {
      // Request permissions
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow access to your photos to continue.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => {} },
          ]
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        onPhotoSelected(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to access photos. Please try again.');
    }
  };

  const takePicture = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (permissionResult.status !== 'granted') {
        Alert.alert(
          'Camera Permission Required',
          'Please allow camera access to take photos.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => {} },
          ]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        onPhotoSelected(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to access camera. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <Animated.View 
          style={[
            styles.headerSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [30, 0]
              })}]
            }
          ]}
        >
          <View style={styles.iconContainer}>
            <Text style={styles.headerIcon}>📸</Text>
          </View>
          <Text style={styles.title}>Let's restore your first photo</Text>
          <Text style={styles.subtitle}>
            Choose a damaged or old photo to see the magic
          </Text>
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View 
          style={[
            styles.actionsSection,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          {/* Primary Action - Access Photos */}
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={requestPermissionAndPickImage}
              activeOpacity={0.9}
            >
              <View style={styles.primaryGradient}>
                <Text style={styles.primaryIcon}>🖼️</Text>
                <Text style={styles.primaryText}>Choose from Photos</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* Secondary Action - Take Photo */}
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={takePicture}
            activeOpacity={0.8}
          >
            <View style={styles.secondaryContent}>
              <Text style={styles.secondaryIcon}>📷</Text>
              <Text style={styles.secondaryText}>Take New Photo</Text>
            </View>
          </TouchableOpacity>

          {/* Tertiary Action - Scan Document */}
          <TouchableOpacity
            style={styles.tertiaryButton}
            onPress={requestPermissionAndPickImage} // For now, same as photos
            activeOpacity={0.7}
          >
            <Text style={styles.tertiaryText}>Scan Document</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Helper Text */}
        <Animated.View 
          style={[
            styles.helperSection,
            {
              opacity: fadeAnim,
            }
          ]}
        >
          <Text style={styles.helperText}>
            💡 Works best with old family photos, faded memories, or scratched images
          </Text>
        </Animated.View>
      </View>
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
    paddingHorizontal: 32,
    paddingVertical: 32,
    justifyContent: 'space-between',
  },
  headerSection: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.2)',
  },
  headerIcon: {
    fontSize: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 24,
  },
  actionsSection: {
    flex: 1.5,
    justifyContent: 'center',
  },
  primaryButton: {
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    marginBottom: 20,
  },
  primaryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 32,
    backgroundColor: '#FF6B6B',
    borderRadius: 24,
  },
  primaryIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  primaryText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    marginBottom: 16,
  },
  secondaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
  },
  secondaryIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  secondaryText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  tertiaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  tertiaryText: {
    fontSize: 16,
    color: '#FF6B6B',
    fontWeight: '500',
  },
  helperSection: {
    alignItems: 'center',
    paddingBottom: 16,
  },
  helperText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
});