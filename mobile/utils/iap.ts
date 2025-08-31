import * as InAppPurchases from 'react-native-iap';
import { Platform } from 'react-native';

export const productIds = {
  standard_25: Platform.select({
    ios: 'com.photorestoration.standard25',
    android: 'standard_25',
  })!,
  standard_70: Platform.select({
    ios: 'com.photorestoration.standard70',
    android: 'standard_70',
  })!,
  standard_150: Platform.select({
    ios: 'com.photorestoration.standard150',
    android: 'standard_150',
  })!,
  hd_10: Platform.select({
    ios: 'com.photorestoration.hd10',
    android: 'hd_10',
  })!,
  hd_30: Platform.select({
    ios: 'com.photorestoration.hd30',
    android: 'hd_30',
  })!,
  hd_70: Platform.select({
    ios: 'com.photorestoration.hd70',
    android: 'hd_70',
  })!,
};

export const subscriptionIds = {
  light_monthly: Platform.select({
    ios: 'com.photorestoration.light.monthly',
    android: 'light_monthly',
  })!,
  standard_monthly: Platform.select({
    ios: 'com.photorestoration.standard.monthly',
    android: 'standard_monthly',
  })!,
  premium_monthly: Platform.select({
    ios: 'com.photorestoration.premium.monthly',
    android: 'premium_monthly',
  })!,
  light_yearly: Platform.select({
    ios: 'com.photorestoration.light.yearly',
    android: 'light_yearly',
  })!,
  standard_yearly: Platform.select({
    ios: 'com.photorestoration.standard.yearly',
    android: 'standard_yearly',
  })!,
  premium_yearly: Platform.select({
    ios: 'com.photorestoration.premium.yearly',
    android: 'premium_yearly',
  })!,
};

export async function initializeIAP() {
  try {
    await InAppPurchases.initConnection();
    return true;
  } catch (error) {
    console.error('Failed to initialize IAP:', error);
    return false;
  }
}

export async function getProducts() {
  try {
    const products = await InAppPurchases.getProducts({
      skus: Object.values(productIds),
    });
    return products;
  } catch (error) {
    console.error('Failed to get products:', error);
    return [];
  }
}

export async function getSubscriptions() {
  try {
    const subscriptions = await InAppPurchases.getSubscriptions({
      skus: Object.values(subscriptionIds),
    });
    return subscriptions;
  } catch (error) {
    console.error('Failed to get subscriptions:', error);
    return [];
  }
}

export async function purchaseProduct(productId: string) {
  try {
    const purchase = await InAppPurchases.requestPurchase({ sku: productId });
    return purchase;
  } catch (error) {
    console.error('Purchase failed:', error);
    throw error;
  }
}

export async function purchaseSubscription(subscriptionId: string) {
  try {
    const purchase = await InAppPurchases.requestSubscription({ sku: subscriptionId });
    return purchase;
  } catch (error) {
    console.error('Subscription failed:', error);
    throw error;
  }
}

export async function restorePurchases() {
  try {
    const purchases = await InAppPurchases.getAvailablePurchases();
    return purchases;
  } catch (error) {
    console.error('Restore failed:', error);
    return [];
  }
}