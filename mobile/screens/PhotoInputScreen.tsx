import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

type PhotoInputScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'PhotoInput'
>;

interface Props {
  navigation: PhotoInputScreenNavigationProp;
}

export default function PhotoInputScreen({ navigation }: Props) {
  const { t } = useTranslation();

  const pickImage = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('home.permissionRequired'), t('home.galleryPermission'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
      navigation.navigate('SmartModeSelection', { imageUri: result.assets[0].uri });
    }
  };

  const takePhoto = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('home.permissionRequired'), t('home.cameraPermission'));
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 1,
    });

    if (!result.canceled) {
      navigation.navigate('SmartModeSelection', { imageUri: result.assets[0].uri });
    }
  };

  const handleHistoryPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('History');
  };

  const handleProfilePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('Profile');
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#1A1A1A', '#000000']}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      <View style={styles.header}>
        <TouchableOpacity onPress={handleProfilePress}>
          <Text style={styles.headerIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        <Image 
          source={require('../assets/restoration-icon.png')} 
          style={styles.restorationIcon}
        />
        <Text style={styles.headline}>{t('photoInput.headline')}</Text>
        <Text style={styles.subtitle}>{t('photoInput.subtitle')}</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={pickImage}>
          <LinearGradient
            colors={['#007AFF', '#0051D5']}
            style={styles.primaryButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.primaryButtonText}>{t('photoInput.chooseFromPhotos')}</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={takePhoto}>
          <Text style={styles.secondaryButtonText}>{t('photoInput.takeNewPhoto')}</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.historyLink} onPress={handleHistoryPress}>
        <Text style={styles.historyLinkText}>{t('photoInput.viewHistory')}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  header: {
    alignItems: 'flex-end',
    padding: 16,
  },
  headerIcon: {
    fontSize: 24,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  restorationIcon: {
    width: 120,
    height: 120,
    marginBottom: 24,
    tintColor: '#D4AF37',
  },
  headline: {
    fontFamily: 'SF Pro Display',
    fontSize: 32,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'SF Pro Text',
    fontSize: 18,
    fontWeight: '400',
    color: '#8E8E93',
    marginBottom: 60,
    textAlign: 'center',
  },
  primaryButton: {
    width: '90%',
    maxWidth: 320,
    height: 56,
    borderRadius: 16,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 5,
    marginBottom: 16,
  },
  primaryButtonGradient: {
    flex: 1,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    fontFamily: 'SF Pro Text',
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    width: '90%',
    maxWidth: 320,
    height: 56,
    backgroundColor: 'transparent',
    borderColor: '#3A3A3C',
    borderWidth: 2,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontFamily: 'SF Pro Text',
    fontSize: 18,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  historyLink: {
    position: 'absolute',
    bottom: 32,
    alignSelf: 'center',
  },
  historyLinkText: {
    fontFamily: 'SF Pro Text',
    fontSize: 16,
    color: '#8E8E93',
  },
});
