import * as React from 'react'
import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { View, StyleSheet, Dimensions, TouchableOpacity, Text } from 'react-native';
import { Animated } from 'react-native';

import OnboardingScreen1 from './OnboardingScreen1';
import OnboardingScreen2 from './OnboardingScreen2';
import OnboardingScreen3 from './OnboardingScreen3';

const { width: screenWidth } = Dimensions.get('window');

interface Props {
  onComplete: () => void;
}

export default function OnboardingFlow({ onComplete }: Props) {
  const { t } = useTranslation();
  const [currentScreen, setCurrentScreen] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const goToNextScreen = () => {
    if (currentScreen < 2) {
      // Fade out current screen
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        // Change screen
        setCurrentScreen(currentScreen + 1);
        // Reset fade animation for new screen
        fadeAnim.setValue(0);
        // Fade in new screen
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }
  };

  const goToPreviousScreen = () => {
    if (currentScreen > 0) {
      // Fade out current screen
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        // Change screen
        setCurrentScreen(currentScreen - 1);
        // Reset fade animation for new screen
        fadeAnim.setValue(0);
        // Fade in new screen
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }
  };

  const handleSkip = () => {
    if (isCompleting) {
      return;
    }
    console.log('OnboardingFlow: Skip pressed, calling onComplete');
    setIsCompleting(true);
    onComplete();
  };

  const handleComplete = () => {
    if (isCompleting) {
      return;
    }
    console.log('OnboardingFlow: Get Started pressed, calling onComplete');
    setIsCompleting(true);
    onComplete();
  };

  // Reset fade animation when screen changes
  useEffect(() => {
    fadeAnim.setValue(1);
  }, [currentScreen]);

  // Progress dots
  const renderProgressDots = () => (
    <>
      {[0, 1, 2].map((index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.progressDot,
            index === currentScreen && styles.progressDotActive,
          ]}
          onPress={() => {
            if (index !== currentScreen) {
              Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
              }).start(() => {
                setCurrentScreen(index);
                // Reset fade animation for new screen
                fadeAnim.setValue(0);
                Animated.timing(fadeAnim, {
                  toValue: 1,
                  duration: 300,
                  useNativeDriver: true,
                }).start();
              });
            }
          }}
        />
      ))}
    </>
  );

  // Render current screen only
  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 0:
        return (
          <OnboardingScreen1
            onContinue={goToNextScreen}
            onSkip={handleSkip}
          />
        );
      case 1:
        return (
          <OnboardingScreen2
            onContinue={goToNextScreen}
            onSkip={handleSkip}
          />
        );
      case 2:
        return (
          <OnboardingScreen3
            onContinue={handleComplete}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Navigation Controls */}
      {currentScreen < 2 && currentScreen > 0 && (
        <View style={styles.navigationContainer}>
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={goToPreviousScreen}
          >
            <Text style={styles.backButtonText}>‹ {t('navigation.back')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Current Screen */}
      <Animated.View style={[styles.screenContainer, { opacity: fadeAnim }]}>
        {renderCurrentScreen()}
      </Animated.View>

      {/* Progress Dots */}
      <View style={styles.progressContainer}>
        {renderProgressDots()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  screenContainer: {
    flex: 1,
    paddingBottom: 80, // Make room for progress dots
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: '#0a0a0a',
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 6,
  },
  progressDotActive: {
    backgroundColor: '#FF6B6B',
    width: 14,
    height: 14,
    borderRadius: 7,
  },
});