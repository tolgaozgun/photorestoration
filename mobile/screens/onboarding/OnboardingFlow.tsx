import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Animated } from 'react-native';

import OnboardingScreen1 from './OnboardingScreen1';
import OnboardingScreen2 from './OnboardingScreen2';
import OnboardingScreen3 from './OnboardingScreen3';

const { width: screenWidth } = Dimensions.get('window');

interface Props {
  onComplete: () => void;
  onPhotoSelected: (imageUri: string) => void;
}

export default function OnboardingFlow({ onComplete, onPhotoSelected }: Props) {
  const [currentScreen, setCurrentScreen] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;

  const goToNextScreen = () => {
    if (currentScreen < 2) {
      const newScreen = currentScreen + 1;
      Animated.timing(translateX, {
        toValue: -(newScreen * screenWidth),
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setCurrentScreen(newScreen);
      });
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const handlePhotoSelected = (imageUri: string) => {
    onPhotoSelected(imageUri);
    onComplete();
  };

  useEffect(() => {
    Animated.timing(translateX, {
      toValue: -(currentScreen * screenWidth),
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [currentScreen]);

  // Progress dots
  const renderProgressDots = () => (
    <View style={styles.progressContainer}>
      {[0, 1, 2].map((index) => (
        <View
          key={index}
          style={[
            styles.progressDot,
            index === currentScreen && styles.progressDotActive,
          ]}
        />
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.screenContainer, { transform: [{ translateX }] }]}>
        <View style={[styles.screen, { width: screenWidth }]}>
          <OnboardingScreen1
            onContinue={goToNextScreen}
            onSkip={handleSkip}
          />
        </View>
        
        <View style={[styles.screen, { width: screenWidth }]}>
          <OnboardingScreen2
            onContinue={goToNextScreen}
            onSkip={handleSkip}
          />
        </View>
        
        <View style={[styles.screen, { width: screenWidth }]}>
          <OnboardingScreen3
            onPhotoSelected={handlePhotoSelected}
          />
        </View>
      </Animated.View>

      {renderProgressDots()}
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
    flexDirection: 'row',
  },
  screen: {
    flex: 1,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 4,
  },
  progressDotActive: {
    backgroundColor: '#FF6B6B',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});