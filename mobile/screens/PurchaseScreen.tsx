import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import { useTranslation } from 'react-i18next';
import { useAnalytics } from '../contexts/AnalyticsContext';
import * as Haptics from 'expo-haptics';

type PurchaseScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Purchase'>;

interface Props {
  navigation: PurchaseScreenNavigationProp;
}

export default function PurchaseScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { trackEvent } = useAnalytics();

  const handlePurchase = (productId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    trackEvent('purchase_action', { type: 'initiate_purchase', productId });
    Alert.alert(t('purchase.comingSoonTitle'), t('purchase.comingSoonMessage'));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          navigation.goBack();
        }}>
          <Text style={styles.backButton}>‹ {t('navigation.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('purchase.title')}</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.description}>{t('purchase.description')}</Text>
        <TouchableOpacity style={styles.purchaseButton} onPress={() => handlePurchase('standard_25')}>
          <Text style={styles.purchaseButtonText}>{t('purchase.standard25')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.purchaseButton} onPress={() => handlePurchase('hd_10')}>
          <Text style={styles.purchaseButtonText}>{t('purchase.hd10')}</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  description: {
    fontFamily: 'SF Pro Text',
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 40,
  },
  purchaseButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  purchaseButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
