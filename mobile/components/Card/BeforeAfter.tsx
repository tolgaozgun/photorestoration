import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  PanResponder,
  Animated,
  Image,
  Dimensions,
  TouchableOpacity,
  Text,
} from 'react-native';
import { colors, borderRadius } from '../../theme';

interface BeforeAfterProps {
  beforeImage: string;
  afterImage: string;
  width?: number;
  height?: number;
  autoPlay?: boolean;
  loopDuration?: number; // in milliseconds
  style?: any;
}

export const BeforeAfterSlider: React.FC<BeforeAfterProps> = ({
  beforeImage,
  afterImage,
  width = Dimensions.get('window').width - 32,
  height = 250,
  autoPlay = false,
  loopDuration = 3000,
  style,
}) => {
  const [sliderPosition, setSliderPosition] = useState(width / 2);
  const [isAutoPlaying, setIsAutoPlaying] = useState(autoPlay);
  const animatedValue = useRef(new Animated.Value(width / 2)).current;

  useEffect(() => {
    if (autoPlay) {
      startAutoPlay();
    }
  }, [autoPlay]);

  const startAutoPlay = () => {
    setIsAutoPlaying(true);
    
    const animate = () => {
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: width * 0.8,
          duration: loopDuration / 2,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: width * 0.2,
          duration: loopDuration / 2,
          useNativeDriver: false,
        }),
      ]).start(() => {
        if (isAutoPlaying) {
          animate();
        }
      });
    };

    animate();
  };

  const stopAutoPlay = () => {
    setIsAutoPlaying(false);
    animatedValue.stopAnimation();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (isAutoPlaying) {
          stopAutoPlay();
        }
        
        const newPosition = sliderPosition + gestureState.dx;
        const clampedPosition = Math.max(0, Math.min(width, newPosition));
        
        setSliderPosition(clampedPosition);
        animatedValue.setValue(clampedPosition);
      },
      onPanResponderRelease: () => {
        if (autoPlay) {
          startAutoPlay();
        }
      },
    })
  ).current;

  const overlayWidth = animatedValue.interpolate({
    inputRange: [0, width],
    outputRange: [0, width],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.container, { width, height }, style]}>
      {/* Before Image (Background) */}
      <Image
        source={{ uri: beforeImage }}
        style={styles.image}
        resizeMode="cover"
      />
      
      {/* After Image (Overlay) */}
      <Animated.View
        style={[
          styles.afterImageContainer,
          {
            width: overlayWidth,
          },
        ]}
      >
        <Image
          source={{ uri: afterImage }}
          style={styles.image}
          resizeMode="cover"
        />
      </Animated.View>

      {/* Slider Handle */}
      <Animated.View
        style={[
          styles.sliderHandle,
          {
            left: animatedValue,
          },
        ]}
        {...panResponder.panHandlers}
      >
        <View style={styles.sliderLine} />
        <View style={styles.sliderCircle} />
      </Animated.View>

      {/* Labels */}
      <View style={styles.labelContainer}>
        <View style={styles.label}>
          <Animated.Text style={[styles.labelText, { color: colors.text.primary }]}>
            Before
          </Animated.Text>
        </View>
        <View style={[styles.label, styles.afterLabel]}>
          <Animated.Text style={[styles.labelText, { color: colors.text.primary }]}>
            After
          </Animated.Text>
        </View>
      </View>

      {/* Auto-play indicator */}
      {isAutoPlaying && (
        <View style={styles.autoPlayIndicator}>
          <Animated.Text style={styles.autoPlayText}>▶ Auto</Animated.Text>
        </View>
      )}
    </View>
  );
};

interface BeforeAfterToggleProps {
  beforeImage: string;
  afterImage: string;
  width?: number;
  height?: number;
  autoPlay?: boolean;
  toggleDuration?: number; // in milliseconds
  style?: any;
}

export const BeforeAfterToggle: React.FC<BeforeAfterToggleProps> = ({
  beforeImage,
  afterImage,
  width = Dimensions.get('window').width - 32,
  height = 250,
  autoPlay = false,
  toggleDuration = 2000,
  style,
}) => {
  const [showAfter, setShowAfter] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(autoPlay);

  useEffect(() => {
    if (autoPlay) {
      startAutoPlay();
    }
  }, [autoPlay]);

  const startAutoPlay = () => {
    setIsAutoPlaying(true);
    
    const toggle = () => {
      setShowAfter(prev => !prev);
      if (isAutoPlaying) {
        setTimeout(toggle, toggleDuration);
      }
    };

    toggle();
  };

  const stopAutoPlay = () => {
    setIsAutoPlaying(false);
  };

  const handlePress = () => {
    if (isAutoPlaying) {
      stopAutoPlay();
    }
    setShowAfter(!showAfter);
  };

  return (
    <View style={[styles.container, { width, height }, style]}>
      {/* Before Image */}
      <Image
        source={{ uri: beforeImage }}
        style={[styles.image, { position: 'absolute' }]}
        resizeMode="cover"
      />
      
      {/* After Image */}
      <Image
        source={{ uri: afterImage }}
        style={[
          styles.image,
          { 
            position: 'absolute',
            opacity: showAfter ? 1 : 0,
          },
        ]}
        resizeMode="cover"
      />

      {/* Toggle Button */}
      <TouchableOpacity
        style={styles.toggleButton}
        onPress={handlePress}
      >
        <Text style={styles.toggleButtonText}>
          {showAfter ? 'Before' : 'After'}
        </Text>
      </TouchableOpacity>

      {/* Auto-play indicator */}
      {isAutoPlaying && (
        <View style={styles.autoPlayIndicator}>
          <Animated.Text style={styles.autoPlayText}>▶ Auto</Animated.Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.large,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: colors.background.secondary,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  afterImageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    overflow: 'hidden',
  },
  sliderHandle: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 40,
    marginLeft: -20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  sliderLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: colors.text.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 3,
  },
  sliderCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.text.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  labelContainer: {
    position: 'absolute',
    top: spacing.small,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.small,
    zIndex: 5,
  },
  label: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: spacing.small,
    paddingVertical: 4,
    borderRadius: borderRadius.small,
  },
  afterLabel: {
    backgroundColor: 'rgba(255, 107, 107, 0.8)',
  },
  labelText: {
    fontSize: 12,
    fontWeight: '600',
  },
  toggleButton: {
    position: 'absolute',
    bottom: spacing.small,
    right: spacing.small,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: spacing.small,
    paddingVertical: 6,
    borderRadius: borderRadius.small,
    zIndex: 5,
  },
  toggleButtonText: {
    color: colors.text.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  autoPlayIndicator: {
    position: 'absolute',
    top: spacing.small,
    left: spacing.small,
    backgroundColor: 'rgba(255, 107, 107, 0.8)',
    paddingHorizontal: spacing.small,
    paddingVertical: 4,
    borderRadius: borderRadius.small,
    zIndex: 5,
  },
  autoPlayText: {
    color: colors.text.primary,
    fontSize: 10,
    fontWeight: '600',
  },
});

// Import spacing from theme
const { spacing } = require('../../theme');