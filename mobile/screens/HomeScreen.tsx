import * as React from 'react';
import { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

// Import all 5 tab screens
import EnhanceScreen from './tabs/EnhanceScreen';
import AIPhotosScreen from './tabs/AIPhotosScreen';
import AIFiltersScreen from './tabs/AIFiltersScreen';
import AIVideosScreen from './tabs/AIVideosScreen';
import CustomAIEDitsScreen from './tabs/CustomAIEDitsScreen';

export default function HomeScreen() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'enhance' | 'ai-photos' | 'ai-filters' | 'ai-videos' | 'custom-ai'>('enhance');

  const tabs = [
    { id: 'enhance', label: t('navigation.tabs.enhance'), icon: 'sparkles', iconOutline: 'sparkles-outline' },
    { id: 'ai-photos', label: t('navigation.tabs.aiPhotos'), icon: 'person', iconOutline: 'person-outline' },
    { id: 'ai-filters', label: t('navigation.tabs.aiFilters'), icon: 'color-palette', iconOutline: 'color-palette-outline' },
    { id: 'ai-videos', label: t('navigation.tabs.aiVideos'), icon: 'videocam', iconOutline: 'videocam-outline' },
    { id: 'custom-ai', label: t('navigation.tabs.customAI'), icon: 'create', iconOutline: 'create-outline' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'enhance':
        return <EnhanceScreen />;
      case 'ai-photos':
        return <AIPhotosScreen />;
      case 'ai-filters':
        return <AIFiltersScreen />;
      case 'ai-videos':
        return <AIVideosScreen />;
      case 'custom-ai':
        return <CustomAIEDitsScreen />;
      default:
        return <EnhanceScreen />;
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Navigation */}
      <View style={styles.topNav}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.topNavContent}
        >
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.topNavItem,
                activeTab === tab.id && styles.topNavItemActive
              ]}
              onPress={() => {
                    console.log('🔄 [HomeScreen] Tab switched:', { from: activeTab, to: tab.id });
                    setActiveTab(tab.id as any);
                  }}
              activeOpacity={0.7}
            >
              <Ionicons
                name={activeTab === tab.id ? tab.icon : tab.iconOutline}
                size={18}
                color={activeTab === tab.id ? '#000000' : '#8E8E93'}
              />
              <Text style={[
                styles.topNavLabel,
                activeTab === tab.id && styles.topNavLabelActive
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {renderContent()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  topNav: {
    backgroundColor: '#000000',
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C1E',
  },
  topNavContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  topNavItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1C1C1E',
    gap: 6,
  },
  topNavItemActive: {
    backgroundColor: '#FFFFFF',
  },
    topNavLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
  },
  topNavLabelActive: {
    color: '#000000',
  },
  content: {
    flex: 1,
  },
});