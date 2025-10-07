import * as React from 'react';
import { View, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import UserTopBar from './UserTopBar';
import { colors } from '../theme';

interface MainLayoutProps {
  children: React.ReactNode;
  showTopBar?: boolean;
}

export default function MainLayout({ children, showTopBar = true }: MainLayoutProps) {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" />

      {showTopBar && <UserTopBar />}

      <View style={[styles.content, !showTopBar && styles.contentWithoutTopBar]}>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  contentWithoutTopBar: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
});