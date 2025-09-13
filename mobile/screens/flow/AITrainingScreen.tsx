import * as React from 'react'
import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Animated,
  Dimensions,
  ActivityIndicator,
  Easing,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAnalytics } from '../../contexts/AnalyticsContext';

const { width: screenWidth } = Dimensions.get('window');

interface Props {
  navigation: StackNavigationProp<any>;
  route: RouteProp<any, 'AITraining'>;
}

interface TrainingStep {
  id: string;
  title: string;
  description: string;
  duration: number; // in seconds
  icon: string;
}

export default function AITrainingScreen({ navigation, route }: Props) {
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

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isTraining, setIsTraining] = useState(true);
  const [estimatedTime, setEstimatedTime] = useState(300); // 5 minutes default

  const trainingSteps: TrainingStep[] = [
    {
      id: 'upload',
      title: 'Uploading Photos',
      description: 'Securely uploading your photos to our AI servers',
      duration: 30,
      icon: '📤',
    },
    {
      id: 'analyze',
      title: 'Analyzing Features',
      description: 'AI is analyzing your unique facial features and expressions',
      duration: 60,
      icon: '🔍',
    },
    {
      id: 'train',
      title: 'Training AI Model',
      description: 'Creating a personalized AI model based on your photos',
      duration: 180,
      icon: '🧠',
    },
    {
      id: 'optimize',
      title: 'Optimizing Results',
      description: 'Fine-tuning the AI for best quality output',
      duration: 30,
      icon: '⚡',
    },
  ];

  useEffect(() => {
    trackEvent('screen_view', { screen: 'ai_training', featureId, photoCount: photoUris.length });
    
    // Start animations
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    startPulseAnimation();
    startRotationAnimation();
    startTrainingSimulation();
  }, []);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const startRotationAnimation = () => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  };

  const startTrainingSimulation = () => {
    let currentProgress = 0;
    let stepStartTime = Date.now();
    let currentStepIndex = 0;

    const updateProgress = () => {
      if (!isTraining) return;

      const elapsed = (Date.now() - stepStartTime) / 1000;
      const stepDuration = trainingSteps[currentStepIndex].duration;
      const stepProgress = Math.min(elapsed / stepDuration, 1);
      
      currentProgress = (currentStepIndex + stepProgress) / trainingSteps.length;
      setProgress(currentProgress);

      // Update progress bar animation
      Animated.timing(progressAnim, {
        toValue: currentProgress,
        duration: 300,
        useNativeDriver: false,
      }).start();

      if (stepProgress >= 1 && currentStepIndex < trainingSteps.length - 1) {
        currentStepIndex++;
        setCurrentStep(currentStepIndex);
        stepStartTime = Date.now();
        trackEvent('training_step_complete', { 
          step: trainingSteps[currentStepIndex].id, 
          featureId 
        });
      }

      if (currentProgress < 1) {
        setTimeout(updateProgress, 100);
      } else {
        handleTrainingComplete();
      }
    };

    updateProgress();
  };

  const handleTrainingComplete = () => {
    setIsTraining(false);
    trackEvent('training_complete', { 
      featureId, 
      duration: estimatedTime,
      photoCount: photoUris.length 
    });

    // Auto-navigate to style selection after a delay
    setTimeout(() => {
      navigation.navigate('StyleSelection', {
        featureId,
        featureTitle,
        featureDescription,
        photoUris,
      });
    }, 2000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getRemainingTime = () => {
    const remainingSteps = trainingSteps.length - currentStep - 1;
    const currentStepRemaining = trainingSteps[currentStep].duration - 
      ((progress * trainingSteps.length * trainingSteps[currentStep].duration) % trainingSteps[currentStep].duration);
    
    return Math.max(0, remainingSteps * trainingSteps[currentStep].duration + currentStepRemaining);
  };

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Animated.View 
        style={[
          styles.header,
          { opacity: fadeAnim }
        ]}
      >
        <View style={styles.placeholder} />
        <Text style={styles.title}>AI Training</Text>
        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={() => {
            trackEvent('training_cancelled', { featureId, progress });
            navigation.goBack();
          }}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Main Content */}
      <Animated.ScrollView
        style={[styles.content, { opacity: fadeAnim }]}
        showsVerticalScrollIndicator={false}
      >
        {/* AI Visualization */}
        <Animated.View style={[styles.aiVisualization, { transform: [{ scale: pulseAnim }] }]}>
          <Animated.View style={[styles.brainContainer, { transform: [{ rotate: rotateInterpolate }] }]}>
            <Text style={styles.brainIcon}>🧠</Text>
            <View style={styles.brainGlow}>
              <Text style={styles.brainGlowIcon}>✨</Text>
            </View>
          </Animated.View>
        </Animated.View>

        {/* Progress Overview */}
        <View style={styles.progressOverview}>
          <Text style={styles.progressTitle}>
            {isTraining ? 'Training Your AI' : 'Training Complete!'}
          </Text>
          <Text style={styles.progressSubtitle}>
            {isTraining 
              ? `${Math.round(progress * 100)}% Complete • ${formatTime(getRemainingTime())} remaining`
              : 'Your AI is ready to create amazing results!'
            }
          </Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <Animated.View 
            style={[
              styles.progressBarFill,
              { 
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                })
              }
            ]} 
          />
        </View>

        {/* Current Step */}
        {isTraining && (
          <View style={styles.currentStepCard}>
            <View style={styles.stepIconContainer}>
              <Text style={styles.stepIcon}>{trainingSteps[currentStep].icon}</Text>
            </View>
            <View style={styles.stepInfo}>
              <Text style={styles.stepTitle}>{trainingSteps[currentStep].title}</Text>
              <Text style={styles.stepDescription}>{trainingSteps[currentStep].description}</Text>
            </View>
            <View style={styles.stepIndicator}>
              <ActivityIndicator color="#FF6B6B" size="small" />
            </View>
          </View>
        )}

        {/* Training Steps List */}
        <View style={styles.stepsList}>
          <Text style={styles.stepsListTitle}>Training Process</Text>
          {trainingSteps.map((step, index) => (
            <View 
              key={step.id} 
              style={[
                styles.stepItem,
                index === currentStep && styles.stepItemActive,
                index < currentStep && styles.stepItemCompleted
              ]}
            >
              <View style={[
                styles.stepBullet,
                index < currentStep && styles.stepBulletCompleted,
                index === currentStep && styles.stepBulletActive
              ]}>
                {index < currentStep ? (
                  <Text style={styles.stepCheck}>✓</Text>
                ) : index === currentStep ? (
                  <ActivityIndicator color="#fff" size={12} />
                ) : (
                  <Text style={styles.stepNumber}>{index + 1}</Text>
                )}
              </View>
              <View style={styles.stepItemContent}>
                <Text style={[
                  styles.stepItemTitle,
                  index < currentStep && styles.stepItemTitleCompleted,
                  index === currentStep && styles.stepItemTitleActive
                ]}>
                  {step.title}
                </Text>
                <Text style={[
                  styles.stepItemDescription,
                  index < currentStep && styles.stepItemDescriptionCompleted
                ]}>
                  {step.description}
                </Text>
              </View>
              {index === currentStep && (
                <View style={styles.stepItemTime}>
                  <Text style={styles.stepTimeText}>{formatTime(getRemainingTime())}</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Training Stats */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Training Details</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{photoUris.length}</Text>
              <Text style={styles.statLabel}>Photos</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{trainingSteps.length}</Text>
              <Text style={styles.statLabel}>Steps</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatTime(estimatedTime)}</Text>
              <Text style={styles.statLabel}>Est. Time</Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </Animated.ScrollView>

      {/* Continue Button (appears when training is complete) */}
      {!isTraining && (
        <Animated.View 
          style={[
            styles.footer,
            { opacity: fadeAnim }
          ]}
        >
          <TouchableOpacity
            style={styles.continueButton}
            onPress={() => {
              navigation.navigate('StyleSelection', {
                featureId,
                featureTitle,
                featureDescription,
                photoUris,
              });
            }}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#FF6B6B', '#FF8E53']}
              style={styles.continueGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.continueText}>Continue to Style Selection</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      )}
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  placeholder: {
    width: 60,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  cancelButton: {
    padding: 8,
  },
  cancelText: {
    fontSize: 16,
    color: '#FF6B6B',
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  aiVisualization: {
    alignItems: 'center',
    marginVertical: 40,
  },
  brainContainer: {
    position: 'relative',
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brainIcon: {
    fontSize: 80,
  },
  brainGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
  },
  brainGlowIcon: {
    fontSize: 60,
    opacity: 0.6,
  },
  progressOverview: {
    alignItems: 'center',
    marginBottom: 24,
  },
  progressTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  progressSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#333',
    borderRadius: 4,
    marginHorizontal: 20,
    marginBottom: 32,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FF6B6B',
    borderRadius: 4,
  },
  currentStepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 20,
    padding: 20,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B6B',
  },
  stepIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepIcon: {
    fontSize: 28,
  },
  stepInfo: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
  },
  stepIndicator: {
    marginLeft: 16,
  },
  stepsList: {
    margin: 20,
    marginBottom: 32,
  },
  stepsListTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  stepItemActive: {
    backgroundColor: 'rgba(255, 107, 107, 0.05)',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginHorizontal: -12,
  },
  stepItemCompleted: {
    opacity: 0.7,
  },
  stepBullet: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    marginTop: 2,
  },
  stepBulletActive: {
    backgroundColor: '#FF6B6B',
  },
  stepBulletCompleted: {
    backgroundColor: '#4ECDC4',
  },
  stepCheck: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  stepNumber: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  stepItemContent: {
    flex: 1,
  },
  stepItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 2,
  },
  stepItemTitleActive: {
    color: '#FF6B6B',
  },
  stepItemTitleCompleted: {
    color: '#4ECDC4',
  },
  stepItemDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 18,
  },
  stepItemDescriptionCompleted: {
    color: 'rgba(255, 255, 255, 0.4)',
  },
  stepItemTime: {
    marginLeft: 8,
  },
  stepTimeText: {
    fontSize: 12,
    color: '#FF6B6B',
    fontWeight: '500',
  },
  statsCard: {
    margin: 20,
    padding: 20,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FF6B6B',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
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