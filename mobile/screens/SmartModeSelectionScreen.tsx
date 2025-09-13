import * as React from 'react'
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../App';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import sliderGif from '../assets/slider.gif';

type SmartModeSelectionScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'SmartModeSelection'
>;
type SmartModeSelectionScreenRouteProp = RouteProp<
  RootStackParamList,
  'SmartModeSelection'
>;

interface Props {
  navigation: SmartModeSelectionScreenNavigationProp;
  route: SmartModeSelectionScreenRouteProp;
}

type Mode = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  recommended?: boolean;
};

export default function SmartModeSelectionScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { imageUri } = route.params;
  const [showMore, setShowMore] = useState(false);

  const handleModeSelection = (mode: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('Preview', { imageUri, selectedMode: mode });
  };

  const modes: Mode[] = [
    { id: 'auto', title: t('modes.auto.title'), subtitle: t('modes.auto.subtitle'), icon: '🤖', recommended: true },
    { id: 'scratch', title: t('modes.scratch.title'), subtitle: t('modes.scratch.subtitle'), icon: '🧹' },
    { id: 'colorize', title: t('modes.colorize.title'), subtitle: t('modes.colorize.subtitle'), icon: '🎨' },
    { id: 'enhance', title: t('modes.enhance.title'), subtitle: t('modes.enhance.subtitle'), icon: '✨' },
    { id: 'recreate', title: t('modes.recreate.title'), subtitle: t('modes.recreate.subtitle'), icon: '🖼️' },
    { id: 'combine', title: t('modes.combine.title'), subtitle: t('modes.combine.subtitle'), icon: '👥' },
  ];

  const primaryModes = modes.slice(0, 2);
  const secondaryModes = modes.slice(2);

  const renderMode = (mode: Mode) => (
    <TouchableOpacity
      key={mode.id}
      style={styles.modeButton}
      onPress={() => handleModeSelection(mode.id)}
    >
      <View style={styles.cardContent}>
        <View style={styles.textSection}>
          <Text style={styles.modeTitle}>{mode.title}</Text>
          <Text style={styles.modeSubtitle}>{mode.subtitle}</Text>
        </View>
        <View style={styles.imageSection}>
          <Image source={sliderGif} style={styles.previewImage} />
        </View>
      </View>
      {mode.recommended && (
        <View style={styles.recommendedBadge}>
          <Text style={styles.recommendedText}>{t('modes.recommended')}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          navigation.goBack();
        }}>
          <Text style={styles.backButton}>‹ {t('navigation.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('modes.selectMode')}</Text>
      </View>
      <View style={styles.content}>
        {primaryModes.map(renderMode)}
        <TouchableOpacity style={styles.showMoreButton} onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setShowMore(!showMore);
        }}>
          <Text style={styles.showMoreText}>{showMore ? t('modes.showLess') : t('modes.showMore')}</Text>
        </TouchableOpacity>
        {showMore && secondaryModes.map(renderMode)}
      </View>
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
    padding: 16,
    paddingTop: 40,
  },
  backButton: {
    fontSize: 24,
    color: '#007AFF',
    marginRight: 10,
  },
  title: {
    fontFamily: 'SF Pro Display',
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  modeButton: {
    width: '100%',
    height: 140,
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#3A3A3C',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  cardContent: {
    flexDirection: 'row',
    flex: 1,
  },
  textSection: {
    flex: 0.6,
    padding: 20,
    justifyContent: 'center',
  },
  imageSection: {
    flex: 0.4,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 20,
  },
  modeTitle: {
    fontFamily: 'SF Pro Display',
    fontSize: 22,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modeSubtitle: {
    fontFamily: 'SF Pro Text',
    fontSize: 16,
    fontWeight: '400',
    color: '#8E8E93',
    marginTop: 4,
  },
  previewImage: {
    width: 80,
    height: 60,
    borderRadius: 8,
  },
  recommendedBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    position: 'absolute',
    top: 12,
    right: 12,
  },
  recommendedText: {
    fontFamily: 'SF Pro Text',
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  showMoreButton: {
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 32,
    alignSelf: 'center',
  },
  showMoreText: {
    fontFamily: 'SF Pro Text',
    fontSize: 16,
    fontWeight: '500',
    color: '#007AFF',
  },
});
