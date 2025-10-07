import * as React from 'react';
import { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
  Text,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { StackNavigationProp } from '@react-navigation/stack';
import { MainTabParamList } from '../App';

// Define nested stack params
interface CustomAIEDitsStackParamList {
  CustomAIEDitsHome: undefined;
  CustomAIEditInput: { imageUri: string };
}

type CustomAIEDitsNavigationProp = StackNavigationProp<CustomAIEDitsStackParamList>;
import { useUser } from '../../contexts/UserContext';
import { useAnalytics } from '../../contexts/AnalyticsContext';
import { useTranslation } from 'react-i18next';

type CustomAIEDitsScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'CustomAIEDits'> &
  StackNavigationProp<RootStackParamList>;

export default function CustomAIEDitsScreen() {
  const navigation = useNavigation<CustomAIEDitsScreenNavigationProp>();
  const { t } = useTranslation();
  const { refreshUser } = useUser();
  const { trackEvent } = useAnalytics();

  // Edit examples using translations
  const editExamples = [
    { id: 'remove-bg', title: t('content.customAI.removeBackground'), icon: '✂️' },
    { id: 'change-lighting', title: t('content.customAI.changeLighting'), icon: '💡' },
    { id: 'fix-skin', title: t('content.customAI.fixSkin'), icon: '✨' },
    { id: 'add-effects', title: t('content.customAI.addEffects'), icon: '🎨' },
    { id: 'change-hair', title: t('content.customAI.changeHairColor'), icon: '💇' },
    { id: 'enhance-eyes', title: t('content.customAI.enhanceEyes'), icon: '👁️' },
  ];

    const [hasGalleryPermission, setHasGalleryPermission] = useState<boolean | null>(null);
  const [loading] = useState(false);

  useEffect(() => {
    trackEvent('screen_view', { screen: 'custom_ai_edits' });
    refreshUser();
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    const galleryStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
    setHasGalleryPermission(galleryStatus.status === 'granted');
  };

  const pickImageFromGallery = async () => {
    if (!hasGalleryPermission) {
      Alert.alert(t('common.permissionRequired'), t('tabs.customAI.pleaseGrantGalleryPermission'));
      return;
    }

    trackEvent('action', { type: 'gallery_open' });

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled) {
        trackEvent('action', { type: 'image_selected_gallery' });
        // Navigate to edit input screen
        navigation.navigate('CustomAIEditInput', {
          imageUri: result.assets[0].uri
        });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert(t('common.error'), t('tabs.customAI.failedToPickImage'));
    }
  };

  const handleExamplePress = (exampleId: string) => {
    trackEvent('action', { type: 'example_tap', example: exampleId });
    pickImageFromGallery(); // For now, just open gallery. In real app, this could pre-fill the edit input
  };

  const renderExamplePill = (example: any) => (
    <TouchableOpacity
      key={example.id}
      style={styles.examplePill}
      onPress={() => handleExamplePress(example.id)}
      activeOpacity={0.8}
    >
      <Text style={styles.exampleIcon}>{example.icon}</Text>
      <Text style={styles.exampleText}>{example.title}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" />

      {/* Screen Title */}
      <View style={styles.titleSection}>
        <View style={styles.titleContainer}>
          <View style={styles.titleTextContainer}>
            <Text style={styles.screenTitle}>{t('tabs.customAI.title')}</Text>
            <Text style={styles.screenSubtitle}>{t('tabs.customAI.subtitle')}</Text>
          </View>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Top Section - Upload Area */}
        <View style={styles.uploadSection}>
          <Text style={styles.uploadTitle}>{t('tabs.customAI.uploadAnImage')}</Text>
          <Text style={styles.uploadSubtitle}>{t('tabs.customAI.transformYourPhotoWithCustomAIEdits')}</Text>
          
          <Image 
            source={{ uri: 'https://picsum.photos/200/200?random=example' }} 
            style={styles.exampleImage} 
          />
          
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={pickImageFromGallery}
            activeOpacity={0.8}
          >
            <Text style={styles.uploadButtonText}>{t('tabs.customAI.uploadAnImage')}</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Section - Description Area */}
        <View style={styles.descriptionSection}>
          <Text style={styles.descriptionTitle}>{t('tabs.customAI.describeAnyEditYouWant')}</Text>
          <Text style={styles.descriptionText}>
            {t('tabs.customAI.useNaturalLanguageDescription')}
          </Text>
          
          {/* Example Pills */}
          <Text style={styles.examplesTitle}>{t('tabs.customAI.popularEdits')}</Text>
          <View style={styles.examplesContainer}>
            {editExamples.map(renderExamplePill)}
          </View>
        </View>
        
        {/* Bottom spacing for tab bar */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  
  // Title Section Styles
  titleSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleTextContainer: {
    flex: 1,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  screenSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
  },
  
  // Content Styles
  content: {
    flex: 1,
    backgroundColor: '#000000',
  },
  
  // Upload Section Styles
  uploadSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  uploadTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  uploadSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 32,
  },
  exampleImage: {
    width: 200,
    height: 200,
    borderRadius: 16,
    marginBottom: 32,
    resizeMode: 'cover',
  },
  uploadButton: {
    width: '100%',
    height: 52,
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  
  // Description Section Styles
  descriptionSection: {
    backgroundColor: '#111111',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    minHeight: 300,
  },
  descriptionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  descriptionText: {
    fontSize: 16,
    color: '#8E8E93',
    lineHeight: 24,
    marginBottom: 24,
  },
  examplesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  examplesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  examplePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    margin: 4,
  },
  exampleIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  exampleText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  
  // Utility Styles
  bottomSpacing: {
    height: 96,
  },
});