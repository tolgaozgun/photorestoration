import * as React from 'react'
import { useRef, useEffect, useState } from 'react';
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
}

export default function OnboardingScreen3({ onContinue }: Props) {
  const { t } = useTranslation();
  const [isPressed, setIsPressed] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const featureAnims = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  useEffect(() => {
    // Reset animations
    fadeAnim.setValue(0);
    slideAnim.setValue(30);
    featureAnims.forEach(anim => anim.setValue(0));

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
      // Animate features sequentially
      Animated.stagger(150,
        featureAnims.map(anim =>
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

  const features = [
    { icon: '✨', title: 'AI Photos', description: 'Generate stunning AI-powered photos' },
    { icon: '🎨', title: 'AI Filters', description: 'Apply creative filters to your images' },
    { icon: '🎬', title: 'AI Videos', description: 'Create amazing video content' },
    { icon: '🔧', title: 'Custom AI', description: 'Use custom AI tools for editing' },
    { icon: '📸', title: 'Enhance', description: 'Restore and enhance your photos' },
  ];

  const handleContinue = () => {
    if (isPressed) {
      return;
    }
    console.log('OnboardingScreen3: Get Started pressed');
    setIsPressed(true);
    onContinue();
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
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.iconContainer}>
            <Text style={styles.headerIcon}>🚀</Text>
          </View>
          <Text style={styles.title}>What You Can Do</Text>
          <Text style={styles.subtitle}>
            Explore five powerful screens with different AI capabilities
          </Text>
        </Animated.View>

        {/* Features List */}
        <Animated.View
          style={[
            styles.featuresSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.featuresList}>
            {features.map((feature, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.featureItem,
                  {
                    opacity: featureAnims[index],
                    transform: [{ scale: featureAnims[index] }]
                  }
                ]}
              >
                <View style={styles.featureIcon}>
                  <Text style={styles.featureEmoji}>{feature.icon}</Text>
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </View>
              </Animated.View>
            ))}
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
            onPress={handleContinue}
            activeOpacity={0.9}
          >
            <View style={styles.continueGradient}>
              <Text style={styles.continueText}>Get Started</Text>
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 64,
    height: 64,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.2)',
  },
  headerIcon: {
    fontSize: 28,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 28,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 20,
  },
  featuresSection: {
    flex: 1,
    marginBottom: 20,
  },
  featuresList: {
    paddingVertical: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.1)',
  },
  featureIcon: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.2)',
  },
  featureEmoji: {
    fontSize: 20,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  featureDescription: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
    lineHeight: 16,
  },
  buttonSection: {
    marginTop: 16,
  },
  continueButton: {
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    marginBottom: 8,
    minHeight: 48, // Ensure minimum touch target
  },
  continueGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B6B',
    borderRadius: 24,
  },
  continueText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
});