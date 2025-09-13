import React from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  TouchableOpacityProps, 
  Image, 
  ImageSourcePropType,
  ViewStyle,
  ImageStyle,
  Platform,
} from 'react-native';
import { colors, borderRadius, spacing, layout } from '../../theme';
import { Text } from '../Text';

// Note: For advanced animation support, install these libraries:
// npm install lottie-react-native react-native-fast-image react-native-video
// import FastImage from 'react-native-fast-image';
// import Lottie from 'lottie-react-native';
// import Video from 'react-native-video';

interface AnimatedCardProps extends TouchableOpacityProps {
  variant?: 'photo' | 'video' | 'premium' | 'standard';
  size?: 'small' | 'medium' | 'large';
  imageUrl?: string;
  animatedUrl?: string; // For WebP or animated images
  lottieUrl?: string; // For Lottie animations
  videoUrl?: string; // For video loops
  imageSource?: ImageSourcePropType;
  title?: string;
  subtitle?: string;
  metadata?: string;
  category?: string;
  isPremium?: boolean;
  showOverlay?: boolean;
  aspectRatio?: '4:3' | '16:9' | '1:1';
  autoPlay?: boolean; // For animations
  loop?: boolean; // For animations
  muted?: boolean; // For videos
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  variant = 'standard',
  size = 'medium',
  imageUrl,
  animatedUrl,
  lottieUrl,
  videoUrl,
  imageSource,
  title,
  subtitle,
  metadata,
  category,
  isPremium = false,
  showOverlay = true,
  aspectRatio = '4:3',
  autoPlay = true,
  loop = true,
  muted = true,
  style,
  onPress,
  ...props
}) => {
  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      ...styles.base,
      borderRadius: borderRadius.large,
    };

    switch (variant) {
      case 'photo':
        return { ...baseStyle, backgroundColor: colors.background.secondary };
      case 'video':
        return { ...baseStyle, backgroundColor: colors.background.tertiary };
      case 'premium':
        return { ...baseStyle, backgroundColor: 'rgba(255, 107, 107, 0.1)' };
      default:
        return { ...baseStyle, backgroundColor: colors.background.secondary };
    }
  };

  const getCardSize = () => {
    switch (size) {
      case 'small':
        return { width: 120, height: aspectRatio === '1:1' ? 120 : 160 };
      case 'large':
        return { width: 180, height: aspectRatio === '1:1' ? 180 : 240 };
      default: // medium
        return { width: layout.card.standardWidth, height: aspectRatio === '1:1' ? layout.card.standardWidth : layout.card.standardWidth * 1.33 };
    }
  };

  const getImageStyle = (): ImageStyle => {
    const cardSize = getCardSize();
    return {
      width: cardSize.width,
      height: cardSize.height,
      borderRadius: borderRadius.large,
    };
  };

  const getAspectRatio = () => {
    switch (aspectRatio) {
      case '16:9': return 9 / 16;
      case '1:1': return 1;
      default: return 3 / 4; // 4:3
    }
  };

  const cardSize = getCardSize();

  const renderAnimatedContent = () => {
    // For now, support static images and basic animations
    // TODO: Install animation libraries for advanced features
    
    if (imageUrl || imageSource) {
      return (
        <Image
          source={imageSource || { uri: imageUrl }}
          style={getImageStyle()}
          resizeMode="cover"
        />
      );
    }

    // Placeholder if no media
    return (
      <View style={[getImageStyle(), styles.placeholder]}>
        <Text variant="title" color="secondary">📷</Text>
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={[
        getCardStyle(),
        { width: cardSize.width, height: cardSize.height },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
      {...props}
    >
      {/* Animated Content */}
      {renderAnimatedContent()}

      {/* Overlay Gradient */}
      {showOverlay && (imageUrl || animatedUrl || lottieUrl || videoUrl) && (
        <View style={styles.overlay}>
          <View style={styles.overlayGradient} />
        </View>
      )}

      {/* Content Overlay */}
      <View style={styles.content}>
        {/* Premium Badge */}
        {isPremium && (
          <View style={styles.premiumBadge}>
            <Text variant="caption" color="primary" weight="medium">
              PRO
            </Text>
          </View>
        )}

        {/* Category Tag */}
        {category && (
          <View style={styles.categoryTag}>
            <Text variant="caption" color="primary" weight="medium">
              {category}
            </Text>
          </View>
        )}

        {/* Title */}
        {title && (
          <Text 
            variant="body" 
            color="primary" 
            weight="semibold" 
            numberOfLines={2}
            style={styles.title}
          >
            {title}
          </Text>
        )}

        {/* Subtitle */}
        {subtitle && (
          <Text 
            variant="caption" 
            color="secondary" 
            numberOfLines={1}
            style={styles.subtitle}
          >
            {subtitle}
          </Text>
        )}

        {/* Metadata (for videos) */}
        {metadata && (
          <View style={styles.metadataContainer}>
            <Text variant="caption" color="secondary">
              {metadata}
            </Text>
          </View>
        )}
      </View>

      {/* Video Indicator */}
      {variant === 'video' && (
        <View style={styles.videoIndicator}>
          <Text style={styles.videoIcon}>▶</Text>
        </View>
      )}

      {/* Animation Indicator */}
      {false && (
        <View style={styles.animationIndicator}>
          <Text style={styles.animationIcon}>✨</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
    position: 'relative',
  },
  placeholder: {
    backgroundColor: colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  overlayGradient: {
    height: 120,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderBottomLeftRadius: borderRadius.large,
    borderBottomRightRadius: borderRadius.large,
  },
  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.small,
    zIndex: 2,
  },
  premiumBadge: {
    position: 'absolute',
    top: spacing.small,
    right: spacing.small,
    backgroundColor: colors.accent.primary,
    paddingHorizontal: spacing.small,
    paddingVertical: 2,
    borderRadius: borderRadius.small,
    zIndex: 3,
  },
  categoryTag: {
    position: 'absolute',
    top: spacing.small,
    left: spacing.small,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: spacing.small,
    paddingVertical: 2,
    borderRadius: borderRadius.small,
    zIndex: 3,
  },
  title: {
    marginBottom: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  metadataContainer: {
    position: 'absolute',
    top: spacing.small,
    left: spacing.small,
    right: spacing.small,
    alignItems: 'center',
    zIndex: 3,
  },
  videoIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -12 }, { translateY: -12 }],
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoIcon: {
    color: colors.text.primary,
    fontSize: 12,
  },
  animationIndicator: {
    position: 'absolute',
    top: spacing.small,
    right: spacing.small + 30,
    backgroundColor: 'rgba(255, 107, 107, 0.8)',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  animationIcon: {
    color: colors.text.primary,
    fontSize: 10,
  },
});

export default AnimatedCard;