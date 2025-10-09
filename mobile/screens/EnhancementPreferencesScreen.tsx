import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
  SafeAreaView,
  StatusBar,
  BackHandler,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import MainLayout from '../components/MainLayout';
import { useNavigationDebugger } from '../hooks/useNavigationDebugger';

export default function EnhancementPreferencesScreen() {
  const { t } = useTranslation();
  const [selectedQuality, setSelectedQuality] = useState<'fast' | 'good' | 'best'>('good');
  const [autoEnhance, setAutoEnhance] = useState(true);
  const [saveOriginal, setSaveOriginal] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Use navigation debugging hook
  const { logNavigationState } = useNavigationDebugger('EnhancementPreferencesScreen');

  useEffect(() => {
    console.log('🚀 [EnhancementPreferencesScreen] Component mounted');
    logNavigationState();

    // Entry animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        delay: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [logNavigationState]);

  const QualityOption = ({ value, title, description, icon }: {
    value: 'fast' | 'good' | 'best';
    title: string;
    description: string;
    icon: string;
  }) => (
    <TouchableOpacity
      style={[
        styles.qualityOption,
        selectedQuality === value && styles.qualityOptionSelected
      ]}
      onPress={() => setSelectedQuality(value)}
    >
      <View style={styles.qualityOptionLeft}>
        <Ionicons
          name={icon}
          size={24}
          color={selectedQuality === value ? '#FF3B30' : '#8E8E93'}
        />
        <View style={styles.qualityOptionText}>
          <Text style={styles.qualityOptionTitle}>{title}</Text>
          <Text style={styles.qualityOptionDescription}>{description}</Text>
        </View>
      </View>
      {selectedQuality === value && (
        <Ionicons name="checkmark-circle" size={24} color="#FF3B30" />
      )}
    </TouchableOpacity>
  );

  const ToggleOption = ({ title, description, value, onToggle }: {
    title: string;
    description: string;
    value: boolean;
    onToggle: () => void;
  }) => (
    <TouchableOpacity
      style={styles.toggleOption}
      onPress={onToggle}
    >
      <View style={styles.toggleOptionLeft}>
        <View style={styles.toggleOptionText}>
          <Text style={styles.toggleOptionTitle}>{title}</Text>
          <Text style={styles.toggleOptionDescription}>{description}</Text>
        </View>
      </View>
      <View style={[
        styles.toggleSwitch,
        value && styles.toggleSwitchActive
      ]}>
        <View style={[
          styles.toggleSwitchCircle,
          value && styles.toggleSwitchCircleActive
        ]} />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" />

      {/* Screen Title */}
      <View style={styles.titleSection}>
        <View style={styles.titleContainer}>
          <View style={styles.titleTextContainer}>
            <Text style={styles.screenTitle}>{t('enhancementPreferences.title')}</Text>
            <Text style={styles.screenSubtitle}>{t('enhancementPreferences.subtitle')}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* Quality Section */}
        <Animated.View
          style={[
            styles.section,
            styles.firstSection,
            { opacity: fadeAnim },
          ]}
        >
          <Text style={styles.sectionTitle}>{t('enhancementPreferences.quality.title')}</Text>
          <View style={styles.sectionContent}>
            <QualityOption
              value="fast"
              title={t('enhancementPreferences.quality.fast.title')}
              description={t('enhancementPreferences.quality.fast.description')}
              icon="flash-outline"
            />
            <QualityOption
              value="good"
              title={t('enhancementPreferences.quality.good.title')}
              description={t('enhancementPreferences.quality.good.description')}
              icon="star-outline"
            />
            <QualityOption
              value="best"
              title={t('enhancementPreferences.quality.best.title')}
              description={t('enhancementPreferences.quality.best.description')}
              icon="diamond-outline"
            />
          </View>
        </Animated.View>

        {/* Processing Section */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: Animated.multiply(slideAnim, 0.8) }],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>{t('enhancementPreferences.processing.title')}</Text>
          <View style={styles.sectionContent}>
            <ToggleOption
              title={t('enhancementPreferences.processing.autoEnhance.title')}
              description={t('enhancementPreferences.processing.autoEnhance.description')}
              value={autoEnhance}
              onToggle={() => setAutoEnhance(!autoEnhance)}
            />
            <ToggleOption
              title={t('enhancementPreferences.processing.saveOriginal.title')}
              description={t('enhancementPreferences.processing.saveOriginal.description')}
              value={saveOriginal}
              onToggle={() => setSaveOriginal(!saveOriginal)}
            />
          </View>
        </Animated.View>

        {/* Advanced Section */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: Animated.multiply(slideAnim, 0.6) }],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>{t('enhancementPreferences.advanced.title')}</Text>
          <View style={styles.sectionContent}>
            <TouchableOpacity
              style={styles.advancedOption}
              onPress={() => Alert.alert(
                t('enhancementPreferences.advanced.faceDetection.title'),
                t('enhancementPreferences.advanced.faceDetection.description')
              )}
            >
              <View style={styles.advancedOptionLeft}>
                <Ionicons name="person-outline" size={22} color="#8E8E93" />
                <View style={styles.advancedOptionText}>
                  <Text style={styles.advancedOptionTitle}>{t('enhancementPreferences.advanced.faceDetection.title')}</Text>
                  <Text style={styles.advancedOptionDescription}>{t('enhancementPreferences.advanced.faceDetection.description')}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.advancedOption}
              onPress={() => Alert.alert(
                t('enhancementPreferences.advanced.noiseReduction.title'),
                t('enhancementPreferences.advanced.noiseReduction.description')
              )}
            >
              <View style={styles.advancedOptionLeft}>
                <Ionicons name="filter-outline" size={22} color="#8E8E93" />
                <View style={styles.advancedOptionText}>
                  <Text style={styles.advancedOptionTitle}>{t('enhancementPreferences.advanced.noiseReduction.title')}</Text>
                  <Text style={styles.advancedOptionDescription}>{t('enhancementPreferences.advanced.noiseReduction.description')}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Save Button */}
        <Animated.View
          style={[
            styles.saveSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: Animated.multiply(slideAnim, 0.4) }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.saveButton}
            onPress={() => {
              Alert.alert(
                t('enhancementPreferences.saveAlert.title'),
                t('enhancementPreferences.saveAlert.message')
              );
            }}
          >
            <Text style={styles.saveButtonText}>{t('enhancementPreferences.saveButton')}</Text>
          </TouchableOpacity>
        </Animated.View>

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
  scrollContent: {
    paddingBottom: 100,
  },
  section: {
    marginTop: 32,
    paddingHorizontal: 16,
  },
  firstSection: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
    marginLeft: 4,
  },
  sectionContent: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#3A3A3C',
  },

  // Quality Option Styles
  qualityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A3C',
  },
  qualityOptionSelected: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
  },
  qualityOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  qualityOptionText: {
    marginLeft: 16,
    flex: 1,
  },
  qualityOptionTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  qualityOptionDescription: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 18,
  },

  // Toggle Option Styles
  toggleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A3C',
  },
  toggleOptionLeft: {
    flex: 1,
  },
  toggleOptionText: {
    flex: 1,
  },
  toggleOptionTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  toggleOptionDescription: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 18,
  },
  toggleSwitch: {
    width: 51,
    height: 31,
    borderRadius: 15.5,
    backgroundColor: '#3A3A3C',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingHorizontal: 2,
  },
  toggleSwitchActive: {
    backgroundColor: '#FF3B30',
    alignItems: 'flex-end',
  },
  toggleSwitchCircle: {
    width: 27,
    height: 27,
    borderRadius: 13.5,
    backgroundColor: '#FFFFFF',
  },
  toggleSwitchCircleActive: {
    // Same style, just positioned differently by parent
  },

  // Advanced Option Styles
  advancedOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A3C',
  },
  advancedOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  advancedOptionText: {
    marginLeft: 16,
    flex: 1,
  },
  advancedOptionTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  advancedOptionDescription: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 18,
  },

  // Save Button Styles
  saveSection: {
    marginTop: 32,
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  saveButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});