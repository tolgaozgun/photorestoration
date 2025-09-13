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
} from 'react-native';
import { colors, borderRadius, spacing, layout } from '../../theme';
import { Text } from '../Text';

interface CardProps extends TouchableOpacityProps {
  variant?: 'photo' | 'video' | 'premium' | 'standard';
  size?: 'small' | 'medium' | 'large';
  imageUrl?: string;
  imageSource?: ImageSourcePropType;
  title?: string;
  subtitle?: string;
  metadata?: string;
  category?: string;
  isPremium?: boolean;
  showOverlay?: boolean;
  aspectRatio?: '4:3' | '16:9' | '1:1';
}

export const Card: React.FC<CardProps> = ({
  variant = 'standard',
  size = 'medium',
  imageUrl,
  imageSource,
  title,
  subtitle,
  metadata,
  category,
  isPremium = false,
  showOverlay = true,
  aspectRatio = '4:3',
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
      case 'video':
        return {
          ...baseStyle,
          ...styles.mediaCard,
        };
      case 'premium':
        return {
          ...baseStyle,
          ...styles.premiumCard,
        };
      default:
        return baseStyle;
    }
  };

  const getCardSize = (): { width: number; height: number } => {
    const baseWidth = layout.card.standardWidth;
    
    switch (size) {
      case 'small':
        return {
          width: 120,
          height: aspectRatio === '16:9' ? 68 : aspectRatio === '1:1' ? 120 : 90,
        };
      case 'large':
        return {
          width: 180,
          height: aspectRatio === '16:9' ? 101 : aspectRatio === '1:1' ? 180 : 135,
        };
      default: // medium
        return {
          width: baseWidth,
          height: aspectRatio === '16:9' ? 79 : aspectRatio === '1:1' ? baseWidth : 105,
        };
    }
  };

  const getImageStyle = (): ImageStyle => {
    const { width, height } = getCardSize();
    return {
      width: '100%',
      height: '100%',
      borderRadius: borderRadius.large,
    };
  };

  const cardSize = getCardSize();

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
      {/* Image Background */}
      {(imageUrl || imageSource) && (
        <Image
          source={imageSource || { uri: imageUrl }}
          style={getImageStyle()}
          resizeMode="cover"
        />
      )}

      {/* Overlay Gradient */}
      {showOverlay && (imageUrl || imageSource) && (
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
            weight="medium" 
            style={styles.title}
            numberOfLines={2}
          >
            {title}
          </Text>
        )}

        {/* Subtitle */}
        {subtitle && (
          <Text 
            variant="caption" 
            color="secondary" 
            style={styles.subtitle}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        )}

        {/* Metadata */}
        {metadata && (
          <Text 
            variant="caption" 
            color="secondary" 
            style={styles.metadata}
          >
            {metadata}
          </Text>
        )}

        {/* Video Indicator */}
        {variant === 'video' && (
          <View style={styles.videoIndicator}>
            <View style={styles.videoIcon} />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

// Gallery Card for horizontal scrolling sections
interface GalleryCardProps extends CardProps {
  emoji?: string;
  description?: string;
  onPressSeeAll?: () => void;
}

export const GalleryCard: React.FC<GalleryCardProps> = ({
  emoji,
  description,
  onPressSeeAll,
  ...props
}) => {
  return (
    <View style={styles.galleryContainer}>
      <Card {...props} />
      
      {/* Description */}
      {description && (
        <Text 
          variant="caption" 
          color="secondary" 
          style={styles.galleryDescription}
          numberOfLines={2}
        >
          {description}
        </Text>
      )}
    </View>
  );
};

// Mode Selection Card for enhancement modes
interface ModeCardProps extends CardProps {
  mode: 'enhance' | 'colorize' | 'de-scratch' | 'enlighten' | 'recreate' | 'combine';
  processingTime?: string;
  isRecommended?: boolean;
}

export const ModeCard: React.FC<ModeCardProps> = ({
  mode,
  processingTime,
  isRecommended = false,
  ...props
}) => {
  const getModeInfo = () => {
    switch (mode) {
      case 'enhance':
        return { emoji: '✨', title: 'Enhance', description: 'Improve overall quality' };
      case 'colorize':
        return { emoji: '🎨', title: 'Colorize', description: 'Add color to B&W photos' };
      case 'de-scratch':
        return { emoji: '🔧', title: 'De-scratch', description: 'Remove damage and scratches' };
      case 'enlighten':
        return { emoji: '☀️', title: 'Enlighten', description: 'Brighten and enhance' };
      case 'recreate':
        return { emoji: '🎭', title: 'Recreate', description: 'AI reconstruction' };
      case 'combine':
        return { emoji: '🔄', title: 'Combine', description: 'Multiple techniques' };
      default:
        return { emoji: '✨', title: 'Enhance', description: 'Improve overall quality' };
    }
  };

  const modeInfo = getModeInfo();

  return (
    <Card
      variant="photo"
      size="medium"
      title={modeInfo.title}
      subtitle={modeInfo.description}
      metadata={processingTime}
      category={isRecommended ? 'RECOMMENDED' : undefined}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.background.secondary,
    overflow: 'hidden',
    position: 'relative',
  },

  mediaCard: {
    shadowColor: colors.text.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  premiumCard: {
    borderWidth: 1,
    borderColor: colors.accent.primary,
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: borderRadius.large,
    overflow: 'hidden',
  },

  overlayGradient: {
    flex: 1,
    backgroundColor: 'transparent',
    backgroundImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.4) 100%)',
  },

  content: {
    ...StyleSheet.absoluteFillObject,
    padding: spacing.small,
    justifyContent: 'flex-end',
  },

  premiumBadge: {
    position: 'absolute',
    top: spacing.small,
    right: spacing.small,
    backgroundColor: colors.accent.primary,
    paddingHorizontal: spacing.micro,
    paddingVertical: 2,
    borderRadius: borderRadius.small,
  },

  categoryTag: {
    position: 'absolute',
    top: spacing.small,
    left: spacing.small,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: spacing.micro,
    paddingVertical: 2,
    borderRadius: borderRadius.small,
  },

  title: {
    marginBottom: 2,
  },

  subtitle: {
    marginBottom: 4,
  },

  metadata: {
    fontSize: 12,
  },

  videoIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -12 }, { translateY: -12 }],
  },

  videoIcon: {
    width: 24,
    height: 24,
    backgroundColor: colors.text.primary,
    borderRadius: 12,
    marginLeft: 6,
  },

  galleryContainer: {
    marginRight: spacing.small,
  },

  galleryDescription: {
    marginTop: spacing.micro,
    width: layout.card.standardWidth,
  },
});

export default Card;