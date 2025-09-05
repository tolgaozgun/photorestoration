import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Animated,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAnalytics } from '../../contexts/AnalyticsContext';

interface Props {
  navigation: StackNavigationProp<any>;
}

export default function HistoryScreen({ navigation }: Props) {
  const { trackEvent } = useAnalytics();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    trackEvent('screen_view', { screen: 'history' });
    
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const startNewRestoration = () => {
    trackEvent('action', { type: 'start_new_from_history' });
    navigation.navigate('PhotoInput');
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
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('PhotoInput');
            }
          }}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Recent Restorations</Text>
        <View style={styles.placeholder} />
      </Animated.View>

      {/* Empty State */}
      <Animated.View 
        style={[
          styles.content,
          { opacity: fadeAnim }
        ]}
      >
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>No Restorations Yet</Text>
          <Text style={styles.emptySubtitle}>
            Your restored photos will appear here after you complete your first restoration.
          </Text>
          
          <TouchableOpacity
            style={styles.startButton}
            onPress={startNewRestoration}
            activeOpacity={0.9}
          >
            <Text style={styles.startButtonText}>Start Your First Restoration</Text>
          </TouchableOpacity>
        </View>
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
    marginLeft: -40,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyState: {
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  startButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 24,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
