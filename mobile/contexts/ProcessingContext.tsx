import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useNavigation } from '@react-navigation/native';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

interface ProcessingJob {
  id: string;
  type: 'enhance' | 'filter' | 'custom-edit' | 'video' | 'ai-generation';
  status: 'processing' | 'completed' | 'failed';
  progress?: number;
  originalUri?: string;
  enhancedUri?: string;
  enhancementId?: string;
  watermark?: boolean;
  processingTime?: number;
  error?: string;
}

interface ProcessingContextType {
  startProcessing: (job: Omit<ProcessingJob, 'status'>) => void;
  completeProcessing: (jobId: string, result: Partial<ProcessingJob>) => void;
  failProcessing: (jobId: string, error: string) => void;
  currentJob: ProcessingJob | null;
  clearJob: () => void;
}

const ProcessingContext = createContext<ProcessingContextType | undefined>(undefined);

export const useProcessing = () => {
  const context = useContext(ProcessingContext);
  if (!context) {
    throw new Error('useProcessing must be used within ProcessingProvider');
  }
  return context;
};

export const ProcessingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentJob, setCurrentJob] = useState<ProcessingJob | null>(null);
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const navigation = useNavigation();

  const showNotification = useCallback(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
  }, [slideAnim]);

  const hideNotification = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [slideAnim]);

  const requestNotificationPermissions = async () => {
    if (Platform.OS === 'android' || Platform.OS === 'ios') {
      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    }
    return false;
  };

  const sendPushNotification = async (title: string, body: string, data?: any) => {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: null, // Show immediately
    });
  };

  const startProcessing = useCallback((job: Omit<ProcessingJob, 'status'>) => {
    const newJob: ProcessingJob = {
      ...job,
      status: 'processing',
    };
    setCurrentJob(newJob);
    showNotification();
  }, [showNotification]);

  const completeProcessing = useCallback((jobId: string, result: Partial<ProcessingJob>) => {
    setCurrentJob(prev => {
      if (prev?.id !== jobId) return prev;
      return {
        ...prev,
        ...result,
        status: 'completed',
      };
    });

    // Send push notification
    const typeLabels = {
      enhance: 'Enhancement',
      filter: 'Filter',
      'custom-edit': 'Custom Edit',
      video: 'Video',
      'ai-generation': 'AI Generation',
    };

    const label = typeLabels[result.type as keyof typeof typeLabels] || 'Processing';
    sendPushNotification(
      `${label} Complete! 🎉`,
      'Tap to view your processed image',
      { jobId, ...result }
    );

    // Auto-hide after 3 seconds if completed
    setTimeout(() => {
      hideNotification();
    }, 3000);
  }, [hideNotification]);

  const failProcessing = useCallback((jobId: string, error: string) => {
    setCurrentJob(prev => {
      if (prev?.id !== jobId) return prev;
      return {
        ...prev,
        status: 'failed',
        error,
      };
    });

    sendPushNotification(
      'Processing Failed',
      error || 'Something went wrong. Please try again.',
      { jobId, error }
    );

    // Auto-hide after 4 seconds if failed
    setTimeout(() => {
      hideNotification();
    }, 4000);
  }, [hideNotification]);

  const clearJob = useCallback(() => {
    hideNotification();
    setTimeout(() => {
      setCurrentJob(null);
    }, 300);
  }, [hideNotification]);

  const handleNotificationTap = useCallback(() => {
    if (currentJob?.status === 'completed' && currentJob.enhancedUri) {
      // Navigate to result screen
      navigation.navigate('UniversalResult', {
        originalUri: currentJob.originalUri!,
        enhancedUri: currentJob.enhancedUri,
        enhancementId: currentJob.enhancementId!,
        watermark: currentJob.watermark || false,
        mode: currentJob.type,
        processingTime: currentJob.processingTime || 0,
      });
      clearJob();
    }
  }, [currentJob, navigation, clearJob]);

  const getNotificationColor = () => {
    if (!currentJob) return '#FF3B30';
    switch (currentJob.status) {
      case 'processing':
        return '#FF3B30';
      case 'completed':
        return '#28A745';
      case 'failed':
        return '#FFA500';
      default:
        return '#FF3B30';
    }
  };

  const getNotificationMessage = () => {
    if (!currentJob) return '';

    const typeLabels = {
      enhance: 'Enhancing',
      filter: 'Applying filter',
      'custom-edit': 'Applying custom edit',
      video: 'Creating video',
      'ai-generation': 'Generating',
    };

    switch (currentJob.status) {
      case 'processing':
        return `${typeLabels[currentJob.type]} your photo...`;
      case 'completed':
        return 'Processing complete! Tap to view';
      case 'failed':
        return currentJob.error || 'Processing failed';
      default:
        return '';
    }
  };

  const getNotificationIcon = () => {
    if (!currentJob) return '⚡';
    switch (currentJob.status) {
      case 'processing':
        return '⚡';
      case 'completed':
        return '✓';
      case 'failed':
        return '✕';
      default:
        return '⚡';
    }
  };

  return (
    <ProcessingContext.Provider
      value={{
        startProcessing,
        completeProcessing,
        failProcessing,
        currentJob,
        clearJob,
      }}
    >
      {children}

      {/* Global Processing Notification Bar */}
      {currentJob && (
        <Animated.View
          style={[
            styles.notificationBar,
            {
              backgroundColor: getNotificationColor(),
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.notificationContent}
            onPress={handleNotificationTap}
            activeOpacity={0.9}
            disabled={currentJob.status === 'processing'}
          >
            <View style={styles.notificationLeft}>
              <Text style={styles.notificationIcon}>{getNotificationIcon()}</Text>
              <Text style={styles.notificationText} numberOfLines={1}>
                {getNotificationMessage()}
              </Text>
            </View>

            {currentJob.status === 'processing' && (
              <View style={styles.spinner}>
                <Text style={styles.spinnerText}>●</Text>
              </View>
            )}

            {currentJob.status !== 'processing' && (
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  clearJob();
                }}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        </Animated.View>
      )}
    </ProcessingContext.Provider>
  );
};

const styles = StyleSheet.create({
  notificationBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 12,
    paddingHorizontal: 16,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notificationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  notificationIcon: {
    fontSize: 20,
    marginRight: 8,
    color: '#FFFFFF',
  },
  notificationText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  spinner: {
    marginLeft: 12,
  },
  spinnerText: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
