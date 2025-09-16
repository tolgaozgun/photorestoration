import * as React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  SafeAreaView,
  TouchableWithoutFeedback,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { } from '../theme';

const LANGUAGES = [
  { code: 'en', labelKey: 'settings.languageNames.en' },
  { code: 'tr', labelKey: 'settings.languageNames.tr' },
  { code: 'de', labelKey: 'settings.languageNames.de' },
  { code: 'es', labelKey: 'settings.languageNames.es' },
  { code: 'zh', labelKey: 'settings.languageNames.zh' },
];

type Props = {
  isVisible: boolean;
  onClose: () => void;
  onLanguageChange?: (language: string) => void;
};

export default function LanguageModal({ isVisible, onClose, onLanguageChange }: Props) {
  const { t, i18n } = useTranslation();

  const onSelectLanguage = (code: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    i18n.changeLanguage(code);
    if (onLanguageChange) {
      onLanguageChange(code);
    }
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>
        
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onClose();
            }}>
              <Text style={styles.backButton}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.title}>{t('settings.selectLanguage')}</Text>
          </View>

          {/* Language Options */}
          <View style={styles.section}>
            <View style={styles.sectionContent}>
              {LANGUAGES.map((language, index) => {
                const selected = i18n.language === language.code;
                return (
                  <TouchableOpacity
                    key={language.code}
                    style={[
                      styles.languageButton,
                      index === LANGUAGES.length - 1 && styles.lastLanguageButton
                    ]}
                    onPress={() => onSelectLanguage(language.code)}
                  >
                    <Text style={styles.languageText}>{t(language.labelKey)}</Text>
                    {selected && <Text style={styles.checkmark}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 40,
    backgroundColor: '#0a0a0a',
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
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionContent: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#3A3A3C',
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    backgroundColor: 'transparent',
  },
  lastLanguageButton: {
    borderBottomWidth: 0,
  },
  languageText: {
    fontFamily: 'SF Pro Text',
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  checkmark: {
    fontFamily: 'SF Pro Text',
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
  },
});
