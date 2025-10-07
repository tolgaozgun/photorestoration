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

  // Extensive debugging
  React.useEffect(() => {
    console.log('🖼️ [ImageWithLoading] Component mounted with:', {
      uri: source?.uri,
      uriType: typeof source?.uri,
      uriLength: source?.uri?.length,
      hasUri: !!source?.uri,
      isUriString: typeof source?.uri === 'string',
      platform: Platform.OS,
      cachePolicy,
      priority,
      contentFit
    });

    // Validate URI
    if (!source?.uri) {
      console.error('❌ [ImageWithLoading] No URI provided to source');
      setHasError(true);
      setIsLoading(false);
      return;
    }

    if (typeof source.uri !== 'string') {
      console.error('❌ [ImageWithLoading] URI is not a string:', typeof source.uri, source.uri);
      setHasError(true);
      setIsLoading(false);
      return;
    }

    // Check URI patterns
    const uri = source.uri;
    if (uri.startsWith('http://') || uri.startsWith('https://')) {
      console.log('🌐 [ImageWithLoading] Remote URI detected:', uri.substring(0, 100) + '...');
    } else if (uri.startsWith('file://')) {
      console.log('📁 [ImageWithLoading] Local file URI detected:', uri);
    } else if (uri.startsWith('data:')) {
      console.log('📊 [ImageWithLoading] Data URI detected, length:', uri.length);
    } else {
      console.log('❓ [ImageWithLoading] Unknown URI format:', uri.substring(0, 50) + '...');
    }

    // Test if URI is accessible
    if (uri.startsWith('http')) {
      fetch(uri, { method: 'HEAD' })
        .then(response => {
          console.log('✅ [ImageWithLoading] HTTP HEAD response:', {
            status: response.status,
            statusText: response.statusText,
            contentType: response.headers.get('content-type'),
            contentLength: response.headers.get('content-length')
          });
        })
        .catch(error => {
          console.error('❌ [ImageWithLoading] HTTP HEAD request failed:', error.message);
        });
    }
  }, [source?.uri]);

  const handleLoad = () => {
    console.log('✅ [ImageWithLoading] Image loaded successfully:', source?.uri?.substring(0, 50) + '...');
    setIsLoading(false);
    setHasError(false);
    onLoad?.();
  };

  const handleError = (error: any) => {
    console.error('❌ [ImageWithLoading] Image failed to load:', {
      uri: source?.uri,
      error: error?.message || error,
      errorType: typeof error,
      errorStack: error?.stack,
      platform: Platform.OS
    });
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