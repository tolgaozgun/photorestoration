import * as React from 'react';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

interface ImageWithLoadingProps {
  source: { uri: string };
  style: any;
  contentFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  transition?: number;
  cachePolicy?: 'none' | 'disk' | 'memory' | 'memory-disk';
  placeholder?: any;
  priority?: 'high' | 'normal' | 'low';
  onLoad?: () => void;
  onError?: () => void;
}

export default function ImageWithLoading({
  source,
  style,
  contentFit = 'cover',
  transition = 200,
  cachePolicy = 'memory-disk',
  placeholder,
  priority = 'normal',
  onLoad,
  onError,
}: ImageWithLoadingProps) {
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    // Validate URI
    if (!source?.uri) {
      setHasError(true);
      setIsLoading(false);
      return;
    }

    if (typeof source.uri !== 'string') {
      setHasError(true);
      setIsLoading(false);
      return;
    }
  }, [source?.uri]);

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
    onLoad?.();
  };

  const handleError = (error: any) => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  };

  return (
    <View style={[style, styles.container]}>
      <Image
        source={source}
        style={[
          StyleSheet.absoluteFillObject,
          { opacity: isLoading || hasError ? 0 : 1 }
        ]}
        contentFit={contentFit}
        transition={transition}
        cachePolicy={cachePolicy}
        placeholder={placeholder}
        priority={priority}
        onLoad={handleLoad}
        onError={handleError}
      />

      {isLoading && (
        <View style={StyleSheet.absoluteFillObject}>
          <ActivityIndicator size="small" color="#FF3B30" style={styles.indicator} />
        </View>
      )}

      {hasError && (
        <View style={StyleSheet.absoluteFillObject}>
          <Ionicons name="image-outline" size={24} color="#8E8E93" style={styles.errorIcon} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  indicator: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorIcon: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
  },
});