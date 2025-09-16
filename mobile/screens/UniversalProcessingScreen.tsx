import * as React from 'react';
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  BackHandler,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import { useAnalytics } from '../contexts/AnalyticsContext';

type UniversalProcessingScreenNavigationProp = StackNavigationProp<RootStackParamList, 'UniversalProcessing'>;

interface UniversalProcessingScreenProps {
  route: {
    params: {
      imageUri: string;
      processingType: 'enhance' | 'filter' | 'video' | 'custom-edit' | 'ai-generation';
      estimatedTime?: number;
    };
  };
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Keep for potential future use
const _screenWidth = screenWidth;
const _screenHeight = screenHeight;

export default function UniversalProcessingScreen({ route }: UniversalProcessingScreenProps) {
  const navigation = useNavigation<UniversalProcessingScreenNavigationProp>();
  const { trackEvent } = useAnalytics();
  const [processingStage, setProcessingStage] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isCancelled, setIsCancelled] = useState(false);

  const { imageUri, processingType, estimatedTime = 30 } = route.params;

  // Processing stages for different types
  const processingStages = {
    enhance: ['Uploading image...', 'Analyzing image...', 'Processing with AI...', 'Applying enhancements...', 'Almost ready!'],
    filter: ['Uploading image...', 'Preparing filter...', 'Applying AI filter...', 'Refining details...', 'Complete!'],
    video: ['Uploading image...', 'Analyzing content...', 'Generating video frames...', 'Rendering animation...', 'Finalizing video!'],
    'custom-edit': ['Uploading image...', 'Understanding request...', 'Applying AI edits...', 'Optimizing result...', 'Ready!'],
    'ai-generation': ['Uploading photos...', 'Training AI model...', 'Generating content...', 'Refining output...', 'Complete!'],
  };

  useEffect(() => {
    trackEvent('screen_view', { screen: 'universal_processing', type: processingType });
    
    // Handle back button
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => backHandler.remove();
  }, [processingType]);

  useEffect(() => {
    if (isCancelled) return;

    const stageDuration = estimatedTime * 1000 / processingStages[processingType].length;
    const stageInterval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + (100 / (estimatedTime * 10)); // Update every 100ms
        if (newProgress >= 100) {
          clearInterval(stageInterval);
          handleProcessingComplete();
          return 100;
        }
        return newProgress;
      });
    }, 100);

    const stageTimer = setInterval(() => {
      setProcessingStage(prev => {
        if (prev >= processingStages[processingType].length - 1) {
          clearInterval(stageTimer);
          return prev;
        }
        return prev + 1;
      });
    }, stageDuration);

    return () => {
      clearInterval(stageInterval);
      clearInterval(stageTimer);
    };
  }, [processingType, estimatedTime, isCancelled]);

  const handleBackPress = () => {
    if (!isCancelled) {
      handleCancel();
    }
    return true;
  };

  const handleCancel = () => {
    trackEvent('action', { type: 'processing_cancelled', processing_type: processingType });
    setIsCancelled(true);
    navigation.goBack();
  };

  const handleProcessingComplete = () => {
    trackEvent('action', { type: 'processing_complete', processing_type: processingType });
    
    // Navigate to appropriate result screen based on type
    setTimeout(() => {
      navigation.navigate('UniversalResult', {
        originalUri: imageUri,
        enhancedUri: imageUri, // In real app, this would be the processed image
        enhancementId: `${processingType}-result`,
        watermark: false,
        mode: processingType,
        processingTime: estimatedTime,
      });
    }, 500);
  };

  const getProcessingTitle = () => {
    const titles = {
      enhance: 'Enhancing Photo',
      filter: 'Applying Filter',
      video: 'Creating Video',
      'custom-edit': 'Applying Edit',
      'ai-generation': 'Generating Content',
    };
    return titles[processingType];
  };

  return (
    <View style={styles.container}>
      {/* Blurred Background */}
      <Image source={{ uri: imageUri }} style={styles.backgroundImage} blurRadius={20} />
      <View style={styles.overlay} />

      {/* Processing Content */}
      <View style={styles.processingContent}>
        {/* Progress Circle */}
        <View style={styles.progressContainer}>
          <View style={styles.progressCircle}>
            <View style={[styles.progressFill, { transform: [{ rotate: `${progress * 3.6}deg` }] }]} />
            <View style={styles.progressInnerCircle}>
              <Text style={styles.progressText}>{Math.round(progress)}%</Text>
            </View>
          </View>
        </View>

        {/* Processing Title */}
        <Text style={styles.processingTitle}>{getProcessingTitle()}</Text>
        
        {/* Processing Status */}
        <Text style={styles.processingStatus}>
          {processingStages[processingType][processingStage]}
        </Text>

        {/* Time Estimate */}
        <Text style={styles.timeEstimate}>
          {isCancelled ? 'Cancelling...' : `~${estimatedTime} seconds`}
        </Text>

        {/* Cancel Button */}
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  overlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  processingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  progressContainer: {
    marginBottom: 32,
  },
  progressCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#2C2C2E',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  progressFill: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderTopColor: '#FF3B30',
    borderTopWidth: 8,
    borderRightColor: '#FF3B30',
    borderRightWidth: 8,
    transformOrigin: 'center',
  },
  progressInnerCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  processingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  processingStatus: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 8,
  },
  timeEstimate: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 32,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  cancelText: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '500',
  },
});