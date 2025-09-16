import * as React from 'react'
import { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  SafeAreaView,
} from 'react-native';
// import { LinearGradient } from 'expo-linear-gradient';

interface Props {
  onContinue: () => void;
  onSkip: () => void;
}

export default function OnboardingScreen2({ onContinue, onSkip }: Props) {
  const { t } = useTranslation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const iconAnims = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  useEffect(() => {
    // Reset animations
    fadeAnim.setValue(0);
    slideAnim.setValue(30);
    iconAnims.forEach(anim => anim.setValue(0));

    // Start animations
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
    ]).start(() => {
      // Animate icons sequentially
      Animated.stagger(200,
        iconAnims.map(anim =>
          Animated.spring(anim, {
            toValue: 1,
            tension: 20,
            friction: 7,
            useNativeDriver: true,
          })
        )
      ).start();
    });
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Skip Button at Top */}
      <Animated.View
        style={[
          styles.topSkipSection,
          {
            opacity: fadeAnim,
          }
        ]}
      >
        <TouchableOpacity
          style={styles.topSkipButton}
          onPress={onSkip}
          activeOpacity={0.8}
        >
          <Text style={styles.topSkipButtonText}>Skip</Text>
        </TouchableOpacity>
      </Animated.View>

      <View style={styles.content}>
        {/* Text Content */}
        <Animated.View
          style={[
            styles.textSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Text style={styles.title}>Photo Access Permissions</Text>
          <Text style={styles.subtitle}>
            We need these permissions to provide the best photo restoration experience
          </Text>
        </Animated.View>

        {/* Permissions List */}
        <Animated.View
          style={[
            styles.permissionsSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.permissionsList}>
            {/* Photo Library Permission */}
            <Animated.View
              style={[
                styles.permissionItem,
                {
                  opacity: iconAnims[0],
                  transform: [{ scale: iconAnims[0] }]
                }
              ]}
            >
              <View style={styles.permissionIcon}>
                <Text style={styles.permissionEmoji}>🖼️</Text>
              </View>
              <View style={styles.permissionContent}>
                <Text style={styles.permissionTitle}>Photo Library Access</Text>
                <Text style={styles.permissionDescription}>
                  Access your photos to restore and enhance them
                </Text>
              </View>
            </Animated.View>

            {/* Camera Permission */}
            <Animated.View
              style={[
                styles.permissionItem,
                {
                  opacity: iconAnims[1],
                  transform: [{ scale: iconAnims[1] }]
                }
              ]}
            >
              <View style={styles.permissionIcon}>
                <Text style={styles.permissionEmoji}>📷</Text>
              </View>
              <View style={styles.permissionContent}>
                <Text style={styles.permissionTitle}>Camera Access</Text>
                <Text style={styles.permissionDescription}>
                  Take new photos to restore them instantly
                </Text>
              </View>
            </Animated.View>

            {/* Storage Permission */}
            <Animated.View
              style={[
                styles.permissionItem,
                {
                  opacity: iconAnims[2],
                  transform: [{ scale: iconAnims[2] }]
                }
              ]}
            >
              <View style={styles.permissionIcon}>
                <Text style={styles.permissionEmoji}>💾</Text>
              </View>
              <View style={styles.permissionContent}>
                <Text style={styles.permissionTitle}>Save Restored Photos</Text>
                <Text style={styles.permissionDescription}>
                  Save your enhanced photos to your device
                </Text>
              </View>
            </Animated.View>
          </View>
        </Animated.View>

        {/* Continue Button */}
        <Animated.View
          style={[
            styles.buttonSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <TouchableOpacity
            style={styles.continueButton}
            onPress={onContinue}
            activeOpacity={0.9}
          >
            <View style={styles.continueGradient}>
              <Text style={styles.continueText}>Grant Permissions</Text>
            </View>
          </TouchableOpacity>
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
  topSkipSection: {
    alignItems: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  topSkipButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  topSkipButtonText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },
  permissionsSection: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  permissionsList: {
    width: '100%',
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.1)',
  },
  permissionIcon: {
    width: 60,
    height: 60,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.2)',
  },
  permissionEmoji: {
    fontSize: 28,
  },
  permissionContent: {
    flex: 1,
  },
  permissionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  permissionDescription: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    lineHeight: 20,
  },
  textSection: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 30,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonSection: {
    paddingBottom: 16,
    paddingTop: 16,
  },
  continueButton: {
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  continueGradient: {
    paddingVertical: 18,
    paddingHorizontal: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B6B',
    borderRadius: 24,
  },
  continueText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
});