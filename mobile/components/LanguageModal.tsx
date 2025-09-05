import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  SafeAreaView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'tr', label: 'Türkçe' },
  { code: 'de', label: 'Deutsch' },
  { code: 'zh', label: '中文' },
];

type Props = {
  isVisible: boolean;
  onClose: () => void;
};

export default function LanguageModal({ isVisible, onClose }: Props) {
  const { i18n } = useTranslation();

  const onSelectLanguage = (code: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    i18n.changeLanguage(code);
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
        <View style={styles.modalView}>
          <Text style={styles.title}>Select Language</Text>
          {LANGUAGES.map((language) => {
            const selected = i18n.language === language.code;
            return (
              <TouchableOpacity
                key={language.code}
                style={styles.languageButton}
                onPress={() => onSelectLanguage(language.code)}
              >
                <Text style={[styles.languageText, selected && styles.selectedLanguageText]}>
                  {language.label}
                </Text>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity style={styles.closeButton} onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onClose();
          }}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    margin: 20,
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '80%',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#fff',
  },
  languageButton: {
    width: '100%',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  languageText: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
  },
  selectedLanguageText: {
    fontWeight: 'bold',
    color: '#007AFF',
  },
  closeButton: {
    marginTop: 20,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#FF6B6B',
  },
});
