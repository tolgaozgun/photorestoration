import * as React from 'react';
import { View, TouchableOpacity, Image, StyleSheet, ViewStyle, ImageStyle, TextStyle } from 'react-native';
import { Text } from './Text';
import { colors, spacing, borderRadius, shadows, typography, components } from '../theme';

interface CardProps {
  children?: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  variant?: 'default' | 'photo' | 'video';
  size?: 'small' | 'medium' | 'large';
  title?: string;
  metadata?: string;
  isPremium?: boolean;
}

export function Card({ children, onPress, style, variant = 'default', size = 'medium', title, metadata, isPremium = false }: CardProps) {
  const CardComponent = onPress ? TouchableOpacity : View;
  
  return (
    <CardComponent
      style={[
        styles.card, 
        variant === 'photo' ? styles.photoCard : 
        variant === 'video' ? styles.videoCard : null, 
        size === 'small' ? styles.smallCard : 
        size === 'medium' ? styles.mediumCard : 
        size === 'large' ? styles.largeCard : null, 
        style
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {title ? (
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text variant="primary" style={styles.cardTitle}>
              {title}
            </Text>
            {isPremium && (
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumBadgeText}>PRO</Text>
              </View>
            )}
          </View>
          {metadata && (
            <Text variant="secondary" style={styles.cardMetadata}>
              {metadata}
            </Text>
          )}
          {children}
        </View>
      ) : (
        children
      )}
    </CardComponent>
  );
}

interface GalleryCardProps {
  title: string;
  category?: string;
  subtitle?: string;
  imageUrl?: string;
  onPress?: () => void;
  style?: ViewStyle;
  imageStyle?: ImageStyle;
  variant?: 'photo' | 'video';
  size?: 'small' | 'medium' | 'large';
  isPremium?: boolean;
}

export function GalleryCard({ 
  title, 
  category, 
  subtitle, 
  imageUrl, 
  onPress, 
  style, 
  imageStyle, 
  variant = 'photo',
  size = 'medium',
  isPremium = false 
}: GalleryCardProps) {
  const getSizeStyle = () => {
    switch (size) {
      case 'small': return styles.smallCard;
      case 'large': return styles.largeCard;
      default: return styles.mediumCard;
    }
  };

  const getImageSizeStyle = () => {
    switch (size) {
      case 'small': return styles.smallCardImage;
      case 'large': return styles.largeCardImage;
      default: return styles.mediumCardImage;
    }
  };

  return (
    <Card onPress={onPress} style={StyleSheet.flatten([styles.galleryCard, getSizeStyle(), style])} variant={variant} size={size}>
      {imageUrl && (
        <Image
          source={{ uri: imageUrl }}
          style={StyleSheet.flatten([styles.galleryCardImage, getImageSizeStyle(), imageStyle])}
          resizeMode="cover"
          defaultSource={{ uri: 'https://via.placeholder.com/160x160/333333/FFFFFF?text=Loading' }}
        />
      )}
      <View style={styles.galleryCardContent}>
        <View style={styles.galleryCardTitleContainer}>
          <Text variant="primary" style={styles.galleryCardTitle} numberOfLines={2} ellipsizeMode="tail">
            {title}
          </Text>
        </View>
                {subtitle && (
          <Text variant="muted" style={styles.galleryCardSubtitle}>
            {subtitle}
          </Text>
        )}
      </View>
    </Card>
  );
}

interface ModeCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  isActive?: boolean;
}

export function ModeCard({ title, description, icon, onPress, style, isActive = false }: ModeCardProps) {
  return (
    <Card 
      onPress={onPress} 
      style={StyleSheet.flatten([styles.modeCard, isActive && styles.modeCardActive, style])}
    >
      <View style={styles.modeCardIcon}>
        {icon}
      </View>
      <View style={styles.modeCardContent}>
        <Text variant="primary" style={styles.modeCardTitle}>
          {title}
        </Text>
        <Text variant="secondary" style={styles.modeCardDescription}>
          {description}
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  // Base card styles
  card: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.xlLegacy,
    overflow: 'hidden',
    ...shadows.md,
  },
  
  // Card content styles
  cardContent: {
    padding: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  cardTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold as TextStyle['fontWeight'],
    flex: 1,
    marginRight: spacing.lg,
  },
  cardMetadata: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  },
  
  // Size variants
  smallCard: {
    width: components.galleryCard.small.width,
  },
  mediumCard: {
    width: components.galleryCard.medium.width,
  },
  largeCard: {
    width: components.galleryCard.large.width,
  },
  
  // Variant styles
  photoCard: {
    backgroundColor: colors.background.card,
  },
  videoCard: {
    backgroundColor: colors.background.tertiary,
  },
  
  // Gallery card styles
  galleryCard: {
    marginRight: spacing.xlLegacy,
  },
  galleryCardImage: {
    borderTopLeftRadius: borderRadius.xlLegacy,
    borderTopRightRadius: borderRadius.xlLegacy,
  },
  smallCardImage: {
    height: components.galleryCard.small.height - 40,
  },
  mediumCardImage: {
    height: components.galleryCard.medium.height - 40,
  },
  largeCardImage: {
    height: components.galleryCard.large.height - 40,
  },
  galleryCardContent: {
    padding: spacing.lg,
  },
  galleryCardTitleContainer: {
    marginBottom: spacing.xs,
  },
  galleryCardTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold as TextStyle['fontWeight'],
    lineHeight: 18,
    color: colors.text.primary,
    minHeight: 36,
  },
    galleryCardSubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.muted,
  },
  premiumBadge: {
    backgroundColor: colors.accent.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    minWidth: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumBadgeText: {
    color: colors.text.primary,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold as TextStyle['fontWeight'],
  },
  
  // Mode card styles
  modeCard: {
    padding: spacing.xlLegacy,
    borderWidth: 1,
    borderColor: colors.border.primary,
    flexDirection: 'row',
    alignItems: 'center',
  },
  modeCardActive: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}33`,
  },
  modeCardIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  modeCardContent: {
    flex: 1,
  },
  modeCardTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold as TextStyle['fontWeight'],
    marginBottom: spacing.sm,
  },
  modeCardDescription: {
    fontSize: typography.fontSize.lg,
    lineHeight: typography.lineHeight.normal,
  },
});