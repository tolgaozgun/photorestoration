import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../App';
import { useTranslation } from 'react-i18next';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import * as MediaLibrary from 'expo-media-library';

type SaveAndShareScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'SaveAndShare'
>;
type SaveAndShareScreenRouteProp = RouteProp<
  RootStackParamList,
  'SaveAndShare'
>;

interface Props {
  navigation: SaveAndShareScreenNavigationProp;
  route: SaveAndShareScreenRouteProp;
}

export default function SaveAndShareScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { enhancedImageUri } = route.params;

  const handleSave = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('home.permissionRequired'), t('home.galleryPermission'));
        return;
      }

      const fileName = 'restored_photo.png';
      const tempDir = FileSystem.cacheDirectory;
      const filePath = `${tempDir}${fileName}`;

      // Download the file using the new API
      const { uri } = await FileSystem.downloadAsync(enhancedImageUri, filePath);
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert(t('result.saveSuccessTitle'), t('result.saveSuccessMessage'));
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert(t('result.saveErrorTitle'), t('result.saveErrorMessage'));
    }
  };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const fileName = 'restored_photo_share.png';
      const tempDir = FileSystem.cacheDirectory;
      const filePath = `${tempDir}${fileName}`;

      // Download the file using the new API
      const { uri } = await FileSystem.downloadAsync(enhancedImageUri, filePath);
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert(t('result.shareErrorTitle'), t('result.shareNotAvailableMessage'));
        return;
      }
      await Sharing.shareAsync(uri);
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert(t('result.shareErrorTitle'), t('result.shareErrorMessage'));
    }
  };

  const handleTryAnother = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.replace('PhotoInput');
  };

  const handleViewHistory = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('History');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('saveAndShare.title')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <Image source={{ uri: enhancedImageUri }} style={styles.resultImage} />
      <View style={styles.footer}>
        <TouchableOpacity style={styles.button} onPress={handleSave}>
          <Text style={styles.buttonText}>{t('result.save')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleShare}>
          <Text style={styles.buttonText}>{t('result.share')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={handleTryAnother}>
          <Text style={styles.secondaryButtonText}>{t('result.tryAnother')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.historyLink} onPress={handleViewHistory}>
          <Text style={styles.historyLinkText}>{t('result.viewHistory')}</Text>
        </TouchableOpacity>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0a0a0a',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    flex: 1,
  },
  headerSpacer: {
    width: 44,
  },
  resultImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  footer: {
    padding: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    borderColor: '#007AFF',
    borderWidth: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 18,
    fontWeight: '600',
  },
  historyLink: {
    alignSelf: 'center',
    paddingVertical: 10,
  },
  historyLinkText: {
    color: '#8E8E93',
    fontSize: 16,
    fontFamily: 'SF Pro Text',
  },
});
