import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  SafeAreaView,
  Animated,
  Dimensions,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAnalytics } from '../../contexts/AnalyticsContext';

const { width: screenWidth } = Dimensions.get('window');

type ModeType = 'enhance' | 'colorize' | 'de-scratch' | 'enlighten' | 'recreate' | 'combine';

interface ModeData {
  id: ModeType;
  icon: string;
  title: string;
  description: string;
  subtitle: string;
  isRecommended?: boolean;
  isAdvanced?: boolean;
}

const ALL_MODES: ModeData[] = [
  {
    id: 'enhance',
    icon: '✨',
    title: 'Auto Enhance',
    description: 'Perfect for blurry or low-quality photos',
    subtitle: 'Remove blur & sharpen details',
    isRecommended: true,
  },
  {
    id: 'de-scratch',
    icon: '🧹',
    title: 'Fix Scratches',
    description: 'Remove scratches, spots, and damage',
    subtitle: 'Repair physical damage',
  },
  {
    id: 'colorize',
    icon: '🎨',
    title: 'Add Color',
    description: 'Bring life to black & white photos',
    subtitle: 'Colorize old memories',
  },
  {
    id: 'enlighten',
    icon: '💡',
    title: 'Fix Lighting',
    description: 'Correct dark or overexposed photos',
    subtitle: 'Balance exposure & contrast',
  },
  {
    id: 'recreate',
    icon: '🖼️',
    title: 'Restore Portraits',
    description: 'Rebuild severely damaged faces',
    subtitle: 'Advanced face restoration',
  },
  {
    id: 'combine',
    icon: '👥',
    title: 'Merge Ancestors',
    description: 'Combine features with family photos',
    subtitle: 'Experimental feature',
  },
];

interface Props {
  navigation: StackNavigationProp<any>;
  route: RouteProp<any, 'ModeSelection'>;
}

export default function ModeSelectionScreen({ navigation, route }: Props) {
  const { imageUri } = route.params as { imageUri: string };
  const { trackEvent } = useAnalytics();
  const [selectedMode, setSelectedMode] = useState<ModeType>('enhance');

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    trackEvent('screen_view', { screen: 'mode_selection' });
    
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
    ]).start();
  }, []);

  const handleModeSelect = (mode: ModeType) => {
    setSelectedMode(mode);
    trackEvent('mode_selected', { mode, screen: 'mode_selection' });
  };

  const handleContinue = () => {
    trackEvent('action', { type: 'continue_to_preview', mode: selectedMode });
    navigation.navigate('Preview', { 
      imageUri, 
      selectedMode 
    });
  };


  const renderModeCard = (mode: ModeData, index: number) => {
    const isSelected = selectedMode === mode.id;
    
    return (
      <Animated.View
        key={mode.id}
        style={[
          {
            opacity: fadeAnim,
            transform: [{
              translateY: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, index * 5],
              })
            }]
          }
        ]}
      >
        <TouchableOpacity
          style={[
            styles.modeCard,
            isSelected && styles.modeCardSelected,
          ]}
          onPress={() => handleModeSelect(mode.id)}
          activeOpacity={0.9}
        >
          {mode.isRecommended && (
            <View style={styles.recommendedBadge}>
              <Text style={styles.recommendedText}>Recommended</Text>
            </View>
          )}
          
          <View style={styles.modeContent}>
            <View style={styles.modeIcon}>
              <Text style={styles.modeEmoji}>{mode.icon}</Text>
            </View>
            
            <View style={styles.modeInfo}>
              <View style={styles.modeHeader}>
                <Text style={[
                  styles.modeTitle,
                  isSelected && styles.modeTitleSelected
                ]}>
                  {mode.title}
                </Text>
              </View>
              <Text style={styles.modeDescription}>{mode.description}</Text>
              <Text style={styles.modeSubtitle}>{mode.subtitle}</Text>
            </View>

            {isSelected && (
              <View style={styles.selectedIndicator}>
                <Text style={styles.selectedCheck}>✓</Text>
              </View>
            )}
          </View>

        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Animated.View 
        style={[
          styles.header,
          { opacity: fadeAnim }
        ]}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Choose Enhancement</Text>
        <View style={styles.placeholder} />
      </Animated.View>

      {/* Photo Preview */}
      <Animated.View 
        style={[
          styles.imagePreview,
          { opacity: fadeAnim }
        ]}
      >
        <Image source={{ uri: imageUri }} style={styles.previewImage} />
      </Animated.View>

      {/* Mode Selection */}
      <View style={styles.content}>
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Primary Modes */}
          <Animated.View style={{ opacity: fadeAnim }}>
            <Text style={styles.sectionTitle}>Select the best option for your photo:</Text>
          </Animated.View>

          {ALL_MODES.map((mode, index) => renderModeCard(mode, index))}
        </ScrollView>
      </View>

      {/* Continue Button */}
      <Animated.View 
        style={[
          styles.footer,
          { opacity: fadeAnim }
        ]}
      >
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#FF6B6B', '#FF8E53']}
            style={styles.continueGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.continueText}>Continue with {selectedMode === 'enhance' ? 'Auto Enhance' : ALL_MODES.find(m => m.id === selectedMode)?.title}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  backArrow: {
    fontSize: 24,
    color: '#fff',
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginLeft: -40, // Compensate for back button
  },
  placeholder: {
    width: 40,
  },
  imagePreview: {
    height: 120,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 20,
    fontWeight: '500',
  },
  modeCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  modeCardSelected: {
    borderColor: '#FF6B6B',
    backgroundColor: 'rgba(255, 107, 107, 0.05)',
  },
  recommendedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recommendedText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  modeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modeIcon: {
    width: 56,
    height: 56,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  modeEmoji: {
    fontSize: 28,
  },
  modeInfo: {
    flex: 1,
  },
  modeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  modeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  modeTitleSelected: {
    color: '#FF6B6B',
  },
  modeDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
    lineHeight: 20,
  },
  modeSubtitle: {
    fontSize: 12,
    color: '#888',
  },
  selectedIndicator: {
    width: 32,
    height: 32,
    backgroundColor: '#FF6B6B',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  selectedCheck: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 32,
  },
  continueButton: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  continueGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  continueText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});