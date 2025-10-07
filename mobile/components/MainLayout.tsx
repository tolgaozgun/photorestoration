import * as React from 'react';
import { View, StyleSheet } from 'react-native';
import UserTopBar from './UserTopBar';
import { colors } from '../theme';

interface MainLayoutProps {
  children: React.ReactNode;
  showTopBar?: boolean;
}

export default function MainLayout({ children, showTopBar = true }: MainLayoutProps) {
  return (
    <View style={styles.container}>
      {showTopBar && <UserTopBar />}
      <View style={[styles.content, !showTopBar && styles.contentWithoutTopBar]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    flex: 1,
    // Account for the top bar height (approximately 64-88px depending on platform)
  },
  contentWithoutTopBar: {
    flex: 1,
    marginTop: 0,
  },
});