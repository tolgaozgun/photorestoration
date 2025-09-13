import * as React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing } from '../theme';

interface ContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function Container({ children, style }: ContainerProps) {
  return (
    <View style={[styles.container, style]}>
      {children}
    </View>
  );
}

interface SectionProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function Section({ children, style }: SectionProps) {
  return (
    <View style={[styles.section, style]}>
      {children}
    </View>
  );
}

interface RowProps {
  children: React.ReactNode;
  style?: ViewStyle;
  spacing?: number | 'small' | 'medium' | 'large';
}

export function Row({ children, style, spacing = 6 }: RowProps) {
  const getSpacing = () => {
    switch (spacing) {
      case 'small': return 3;
      case 'medium': return 6;
      case 'large': return 12;
      default: return spacing as number;
    }
  };
  const spacingValue = getSpacing();
  return (
    <View style={[styles.row, { marginHorizontal: -spacingValue / 2 }, style]}>
      {React.Children.map(children, (child, index) => (
        <View key={index} style={{ marginHorizontal: spacingValue / 2 }}>
          {child}
        </View>
      ))}
    </View>
  );
}

interface SpacerProps {
  size?: number | 'small' | 'medium' | 'large';
}

export function Spacer({ size = 12 }: SpacerProps) {
  const getSize = () => {
    switch (size) {
      case 'small': return 6;
      case 'medium': return 12;
      case 'large': return 18;
      default: return size as number;
    }
  };

  return <View style={{ height: getSize() }} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  section: {
    marginBottom: spacing['2xl'],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
});