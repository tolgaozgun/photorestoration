import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  SafeAreaView,
  Dimensions,
} from 'react-native';
// import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth } = Dimensions.get('window');

interface Props {
  onContinue: () => void;
  onSkip: () => void;
}

export default function OnboardingScreen1({ onContinue }: Props) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Visual Demo */}
        <Animated.View 
          style={[
            styles.imageSection,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim }
              ]
            }
          ]}
        >
          <View style={styles.splitContainer}>
            <View style={styles.beforeSection}>
              <View style={styles.damagedImage}>
                <Text style={styles.imageIcon}>📷</Text>
                <View style={styles.scratchOverlay}>
                  <View style={styles.scratch1} />
                  <View style={styles.scratch2} />
                  <View style={styles.fadeOverlay} />
                </View>
              </View>
              <Text style={styles.imageLabel}>Damaged</Text>
            </View>

            <Animated.View style={[styles.arrowContainer, { opacity: fadeAnim }]}>
              <Text style={styles.arrow}>→</Text>
            </Animated.View>

            <View style={styles.afterSection}>
              <View style={styles.restoredImage}>
                <Text style={styles.imageIcon}>✨</Text>
                <View style={styles.enhancedGlow} />
              </View>
              <Text style={styles.imageLabel}>Restored</Text>
            </View>
          </View>
        </Animated.View>

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
          <Text style={styles.title}>Bring Old Photos Back to Life</Text>
          <Text style={styles.subtitle}>
            Restore damaged, faded, or scratched photos in seconds
          </Text>
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
              <Text style={styles.continueText}>Continue</Text>
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
    paddingHorizontal: 32,
    justifyContent: 'space-between',
  },
  imageSection: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splitContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  beforeSection: {
    alignItems: 'center',
    flex: 1,
  },
  afterSection: {
    alignItems: 'center',
    flex: 1,
  },
  arrowContainer: {
    paddingHorizontal: 20,
  },
  arrow: {
    fontSize: 32,
    color: '#FF6B6B',
  },
  damagedImage: {
    width: 120,
    height: 120,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  restoredImage: {
    width: 120,
    height: 120,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  imageIcon: {
    fontSize: 48,
  },
  scratchOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  scratch1: {
    position: 'absolute',
    width: 80,
    height: 2,
    backgroundColor: '#333',
    top: 30,
    left: 20,
    transform: [{ rotate: '15deg' }],
  },
  scratch2: {
    position: 'absolute',
    width: 60,
    height: 2,
    backgroundColor: '#333',
    bottom: 40,
    right: 15,
    transform: [{ rotate: '-20deg' }],
  },
  fadeOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  enhancedGlow: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 16,
    backgroundColor: 'rgba(255, 107, 107, 0.3)',
  },
  imageLabel: {
    marginTop: 12,
    color: '#888',
    fontSize: 14,
    fontWeight: '500',
  },
  textSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  buttonSection: {
    paddingBottom: 32,
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