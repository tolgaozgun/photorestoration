import * as React from 'react';
import { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
  TextInput,
  Text,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import { useUser } from '../contexts/UserContext';
import { useAnalytics } from '../contexts/AnalyticsContext';
import { useTranslation } from 'react-i18next';

type CustomAIEditInputScreenNavigationProp = StackNavigationProp<RootStackParamList, 'CustomAIEditInput'>;

interface CustomAIEditInputScreenProps {
  route: {
    params: {
      imageUri: string;
    };
  };
}

// Mock edit examples
const editExamples = [
  { id: 'remove-bg', title: 'Remove background', icon: '✂️' },
  { id: 'change-lighting', title: 'Change lighting', icon: '💡' },
  { id: 'fix-skin', title: 'Fix skin', icon: '✨' },
  { id: 'add-effects', title: 'Add effects', icon: '🎨' },
  { id: 'change-hair', title: 'Change hair color to blonde', icon: '💇' },
  { id: 'enhance-eyes', title: 'Enhance eyes', icon: '👁️' },
  { id: 'whiten-teeth', title: 'Whiten teeth', icon: '😁' },
  { id: 'smooth-skin', title: 'Smooth skin', icon: '🧴' },
];

export default function CustomAIEditInputScreen({ route }: CustomAIEditInputScreenProps) {
  const navigation = useNavigation<CustomAIEditInputScreenNavigationProp>();
  const { t } = useTranslation();
  const { user, refreshUser } = useUser();
  const { trackEvent } = useAnalytics();
  const [editText, setEditText] = useState('');
  const [loading, setLoading] = useState(false);

  const { imageUri } = route.params;

  useEffect(() => {
    trackEvent('screen_view', { screen: 'custom_ai_edit_input' });
  }, []);

  const handleGenerateEdit = () => {
    if (!editText.trim()) {
      Alert.alert('Please describe your edit', 'Enter a description of what you want to change in your photo.');
      return;
    }

    trackEvent('action', { type: 'generate_edit', description: editText });
    
    // Simulate processing - in real app, this would call an API
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      // Navigate to result screen
      navigation.navigate('UniversalResult', {
        originalUri: imageUri,
        enhancedUri: imageUri, // In real app, this would be the edited image
        enhancementId: 'custom-edit',
        watermark: false,
        mode: 'custom-edit',
        processingTime: 30,
      });
    }, 2000);
  };

  const handleExamplePress = (example: any) => {
    setEditText(example.title);
    trackEvent('action', { type: 'example_selected', example: example.id });
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const renderExamplePill = (example: any) => (
    <TouchableOpacity
      key={example.id}
      style={styles.examplePill}
      onPress={() => handleExamplePress(example)}
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
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={styles.titleTextContainer}>
            <Text style={styles.screenTitle}>Describe Your Edit</Text>
            <Text style={styles.screenSubtitle}>Tell us what you'd like to change</Text>
          </View>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Photo Preview */}
        <View style={styles.photoPreviewSection}>
          <Image source={{ uri: imageUri }} style={styles.photoPreview} />
        </View>

        {/* Edit Input */}
        <View style={styles.inputSection}>
          <TextInput
            style={styles.editInput}
            placeholder="Describe what you want to change..."
            placeholderTextColor="#8E8E93"
            value={editText}
            onChangeText={setEditText}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* Generate Button */}
        <TouchableOpacity
          style={[
            styles.generateButton,
            !editText.trim() && styles.generateButtonDisabled
          ]}
          onPress={handleGenerateEdit}
          disabled={!editText.trim() || loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <Text style={styles.generateButtonText}>Processing...</Text>
          ) : (
            <Text style={styles.generateButtonText}>Generate Edit</Text>
          )}
        </TouchableOpacity>

        {/* Examples */}
        <View style={styles.examplesSection}>
          <Text style={styles.examplesTitle}>Try these examples:</Text>
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

  // Content Styles
  content: {
    flex: 1,
    backgroundColor: '#000000',
  },

  scrollContent: {
    paddingTop: 8,
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
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  backIcon: {
    fontSize: 24,
    color: '#FFFFFF',
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

  // Photo Preview Styles
  photoPreviewSection: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  photoPreview: {
    width: 200,
    height: 200,
    borderRadius: 16,
    resizeMode: 'cover',
  },
  
  // Input Section Styles
  inputSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  editInput: {
    width: '100%',
    height: 120,
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  
  // Generate Button Styles
  generateButton: {
    marginHorizontal: 16,
    height: 52,
    backgroundColor: '#FF3B30',
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  generateButtonDisabled: {
    backgroundColor: '#2C2C2E',
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  
  // Examples Section Styles
  examplesSection: {
    paddingHorizontal: 16,
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
    height: 80, // Space for bottom tab bar
  },
});