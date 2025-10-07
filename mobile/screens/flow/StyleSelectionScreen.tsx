import * as React from 'react'
import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAnalytics } from '../../contexts/AnalyticsContext';

const { width: screenWidth } = Dimensions.get('window');

interface Props {
  navigation: StackNavigationProp<any>;
  route: RouteProp<any, 'StyleSelection'>;
}

interface StyleOption {
  id: string;
  title: string;
  description: string;
  previewUrl: string;
  category: string;
  isPremium?: boolean;
  processingTime: number;
  examples: string[];
}

export default function StyleSelectionScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { 
    featureId, 
    featureTitle, 
    featureDescription, 
    photoUris 
  } = route.params as {
    featureId: string;
    featureTitle: string;
    featureDescription: string;
    photoUris: string[];
  };
  const { trackEvent } = useAnalytics();
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [selectedExample, setSelectedExample] = useState<string | null>(null);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Feature-specific style options
  const getStyleOptions = (): StyleOption[] => {
    switch (featureId) {
      case 'future-baby':
        return [
          {
            id: 'baby-realistic',
            title: 'Realistic Baby',
            description: 'Photorealistic baby prediction with genetic features',
            previewUrl: 'https://via.placeholder.com/300x400/FFB6C1/FFFFFF?text=Baby+1',
            category: 'Realistic',
            processingTime: 120,
            examples: [
              'https://via.placeholder.com/150x150/FFB6C1/FFFFFF?text=Example1',
              'https://via.placeholder.com/150x150/FFC0CB/FFFFFF?text=Example2',
              'https://via.placeholder.com/150x150/FFD1DC/FFFFFF?text=Example3',
            ],
          },
          {
            id: 'baby-artistic',
            title: 'Artistic Baby',
            description: 'Stylized artistic baby illustrations',
            previewUrl: 'https://via.placeholder.com/300x400/DDA0DD/FFFFFF?text=Baby+2',
            category: 'Artistic',
            isPremium: true,
            processingTime: 180,
            examples: [
              'https://via.placeholder.com/150x150/DDA0DD/FFFFFF?text=Art1',
              'https://via.placeholder.com/150x150/DA70D6/FFFFFF?text=Art2',
              'https://via.placeholder.com/150x150/BA55D3/FFFFFF?text=Art3',
            ],
          },
          {
            id: 'baby-ethnic',
            title: 'Ethnic Variations',
            description: 'Explore different ethnic background possibilities',
            previewUrl: 'https://via.placeholder.com/300x400/F0E68C/FFFFFF?text=Baby+3',
            category: 'Variations',
            isPremium: true,
            processingTime: 240,
            examples: [
              'https://via.placeholder.com/150x150/F0E68C/FFFFFF?text=Eth1',
              'https://via.placeholder.com/150x150/EEE8AA/FFFFFF?text=Eth2',
              'https://via.placeholder.com/150x150/F0E68C/FFFFFF?text=Eth3',
            ],
          },
        ];

      case 'digital-twin':
        return [
          {
            id: 'twin-realistic',
            title: '3D Realistic Twin',
            description: 'High-fidelity 3D digital twin',
            previewUrl: 'https://via.placeholder.com/300x400/87CEEB/FFFFFF?text=Twin1',
            category: '3D Model',
            processingTime: 300,
            examples: [
              'https://via.placeholder.com/150x150/87CEEB/FFFFFF?text=3D1',
              'https://via.placeholder.com/150x150/87CEFA/FFFFFF?text=3D2',
              'https://via.placeholder.com/150x150/B0E0E6/FFFFFF?text=3D3',
            ],
          },
          {
            id: 'twin-anime',
            title: 'Anime Twin',
            description: 'Anime-style digital twin character',
            previewUrl: 'https://via.placeholder.com/300x400/FFB6C1/FFFFFF?text=Twin2',
            category: 'Anime',
            isPremium: true,
            processingTime: 180,
            examples: [
              'https://via.placeholder.com/150x150/FFB6C1/FFFFFF?text=Anime1',
              'https://via.placeholder.com/150x150/FFC0CB/FFFFFF?text=Anime2',
              'https://via.placeholder.com/150x150/FFD1DC/FFFFFF?text=Anime3',
            ],
          },
          {
            id: 'twin-futuristic',
            title: 'Futuristic Twin',
            description: 'Sci-fi style digital avatar',
            previewUrl: 'https://via.placeholder.com/300x400/9370DB/FFFFFF?text=Twin3',
            category: 'Sci-Fi',
            isPremium: true,
            processingTime: 240,
            examples: [
              'https://via.placeholder.com/150x150/9370DB/FFFFFF?text=Future1',
              'https://via.placeholder.com/150x150/8A2BE2/FFFFFF?text=Future2',
              'https://via.placeholder.com/150x150/9932CC/FFFFFF?text=Future3',
            ],
          },
        ];

      case 'outfit-tryon':
        return [
          {
            id: 'outfit-casual',
            title: 'Casual Wear',
            description: 'Everyday casual clothing styles',
            previewUrl: 'https://via.placeholder.com/300x400/98FB98/FFFFFF?text=Casual',
            category: 'Casual',
            processingTime: 150,
            examples: [
              'https://via.placeholder.com/150x150/98FB98/FFFFFF?text=Casual1',
              'https://via.placeholder.com/150x150/90EE90/FFFFFF?text=Casual2',
              'https://via.placeholder.com/150x150/00FF7F/FFFFFF?text=Casual3',
            ],
          },
          {
            id: 'outfit-formal',
            title: 'Business Formal',
            description: 'Professional business attire',
            previewUrl: 'https://via.placeholder.com/300x400/4682B4/FFFFFF?text=Formal',
            category: 'Business',
            isPremium: true,
            processingTime: 180,
            examples: [
              'https://via.placeholder.com/150x150/4682B4/FFFFFF?text=Formal1',
              'https://via.placeholder.com/150x150/5F9EA0/FFFFFF?text=Formal2',
              'https://via.placeholder.com/150x150/6495ED/FFFFFF?text=Formal3',
            ],
          },
          {
            id: 'outfit-evening',
            title: 'Evening Wear',
            description: 'Elegant evening and formal wear',
            previewUrl: 'https://via.placeholder.com/300x400/DDA0DD/FFFFFF?text=Evening',
            category: 'Evening',
            isPremium: true,
            processingTime: 200,
            examples: [
              'https://via.placeholder.com/150x150/DDA0DD/FFFFFF?text=Evening1',
              'https://via.placeholder.com/150x150/DA70D6/FFFFFF?text=Evening2',
              'https://via.placeholder.com/150x150/BA55D3/FFFFFF?text=Evening3',
            ],
          },
        ];

      default:
        return [
          {
            id: 'style-default',
            title: 'Default Style',
            description: 'Standard AI generation style',
            previewUrl: 'https://via.placeholder.com/300x400/FF6B6B/FFFFFF?text=Default',
            category: 'Default',
            processingTime: 120,
            examples: [
              'https://via.placeholder.com/150x150/FF6B6B/FFFFFF?text=Def1',
              'https://via.placeholder.com/150x150/FF8E53/FFFFFF?text=Def2',
              'https://via.placeholder.com/150x150/FFA07A/FFFFFF?text=Def3',
            ],
          },
        ];
    }
  };

  const styleOptions = getStyleOptions();

  useEffect(() => {
    trackEvent('screen_view', { screen: 'style_selection', featureId });
    
    // Entry animation
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

  const handleStyleSelect = (styleId: string) => {
    setSelectedStyle(styleId);
    trackEvent('style_selected', { styleId, featureId });
  };

  const handleGenerate = () => {
    if (!selectedStyle) {
      Alert.alert('Select Style', 'Please select a style to continue');
      return;
    }

    const selectedOption = styleOptions.find(opt => opt.id === selectedStyle);
    if (!selectedOption) return;

    trackEvent('generation_started', { 
      styleId: selectedStyle, 
      featureId,
      processingTime: selectedOption.processingTime 
    });

    navigation.navigate('AIGenerationResult', {
      featureId,
      featureTitle,
      featureDescription,
      photoUris,
      selectedStyle,
      styleTitle: selectedOption.title,
      processingTime: selectedOption.processingTime,
    });
  };

  const renderStyleCard = (style: StyleOption, index: number) => {
    const isSelected = selectedStyle === style.id;
    
    return (
      <Animated.View
        key={style.id}
        style={[
          {
            opacity: fadeAnim,
            transform: [{
              translateY: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, index * 10],
              })
            }]
          }
        ]}
      >
        <TouchableOpacity
          style={[
            styles.styleCard,
            isSelected && styles.styleCardSelected,
          ]}
          onPress={() => handleStyleSelect(style.id)}
          activeOpacity={0.9}
        >
          {/* Preview Image */}
          <View style={styles.previewContainer}>
            <Image source={{ uri: style.previewUrl }} style={styles.previewImage} />
            {style.isPremium && (
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumText}>PREMIUM</Text>
              </View>
            )}
            {isSelected && (
              <View style={styles.selectedOverlay}>
                <Text style={styles.selectedIcon}>✓</Text>
              </View>
            )}
          </View>

          {/* Style Info */}
          <View style={styles.styleInfo}>
            <View style={styles.styleHeader}>
              <Text style={[
                styles.styleTitle,
                isSelected && styles.styleTitleSelected
              ]}>
                {style.title}
              </Text>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{style.category}</Text>
              </View>
            </View>
            
            <Text style={styles.styleDescription}>{style.description}</Text>
            
            <View style={styles.styleMeta}>
              <View style={styles.timeInfo}>
                <Text style={styles.timeIcon}>⏱️</Text>
                <Text style={styles.timeText}>{Math.floor(style.processingTime / 60)}m</Text>
              </View>
              
              <View style={styles.exampleCount}>
                <Text style={styles.exampleIcon}>🖼️</Text>
                <Text style={styles.exampleText}>{style.examples.length} examples</Text>
              </View>
            </View>

            {/* Example Images */}
            <View style={styles.examplesContainer}>
              <Text style={styles.examplesTitle}>Examples:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {style.examples.map((example, exampleIndex) => (
                  <TouchableOpacity
                    key={exampleIndex}
                    style={[
                      styles.exampleImage,
                      selectedExample === `${style.id}_${exampleIndex}` && styles.exampleImageSelected
                    ]}
                    onPress={() => setSelectedExample(`${style.id}_${exampleIndex}`)}
                  >
                    <Image source={{ uri: example }} style={styles.exampleThumbnail} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
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
        <Text style={styles.title}>Choose Style</Text>
        <View style={styles.placeholder} />
      </Animated.View>

      {/* Content */}
      <Animated.ScrollView
        style={[styles.content, { opacity: fadeAnim }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Feature Info */}
        <View style={styles.featureInfo}>
          <Text style={styles.featureTitle}>{featureTitle}</Text>
          <Text style={styles.featureDescription}>{featureDescription}</Text>
        </View>

        {/* Style Selection */}
        <View style={styles.selectionSection}>
          <Text style={styles.selectionTitle}>Select Generation Style</Text>
          <Text style={styles.selectionSubtitle}>
            Choose how you want your AI to generate results
          </Text>
        </View>

        {/* Style Options */}
        <View style={styles.stylesContainer}>
          {styleOptions.map((style, index) => renderStyleCard(style, index))}
        </View>

        <View style={styles.bottomSpacing} />
      </Animated.ScrollView>

      {/* Generate Button */}
      <Animated.View 
        style={[
          styles.footer,
          { opacity: fadeAnim }
        ]}
      >
        <TouchableOpacity
          style={[
            styles.generateButton,
            !selectedStyle && styles.generateButtonDisabled
          ]}
          onPress={handleGenerate}
          disabled={!selectedStyle}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={selectedStyle ? ['#FF6B6B', '#FF8E53'] : ['#666', '#888']}
            style={styles.generateGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.generateText}>
              {selectedStyle ? 'Generate Results' : 'Select a Style'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
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
    marginLeft: -40,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  featureInfo: {
    margin: 20,
    padding: 20,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    alignItems: 'center',
  },
  featureTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 22,
  },
  selectionSection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  selectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  selectionSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 20,
  },
  stylesContainer: {
    paddingHorizontal: 20,
  },
  styleCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  styleCardSelected: {
    borderColor: '#FF6B6B',
    backgroundColor: 'rgba(255, 107, 107, 0.05)',
  },
  previewContainer: {
    position: 'relative',
    height: 200,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  premiumBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  premiumText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '700',
  },
  selectedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 107, 107, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedIcon: {
    fontSize: 48,
    color: '#fff',
    fontWeight: '700',
  },
  styleInfo: {
    padding: 20,
  },
  styleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  styleTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  styleTitleSelected: {
    color: '#FF6B6B',
  },
  categoryBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  categoryText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  styleDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 12,
    lineHeight: 20,
  },
  styleMeta: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 16,
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeIcon: {
    fontSize: 14,
  },
  timeText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  exampleCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  exampleIcon: {
    fontSize: 14,
  },
  exampleText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  examplesContainer: {
    marginTop: 8,
  },
  examplesTitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 8,
  },
  exampleImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  exampleImageSelected: {
    borderColor: '#FF6B6B',
  },
  exampleThumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
    resizeMode: 'cover',
  },
  bottomSpacing: {
    height: 100,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(10, 10, 10, 0.95)',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  generateButton: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  generateGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  generateText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});