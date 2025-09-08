import React from 'react';
import { 
  View, 
  StyleSheet, 
  ViewStyle, 
  SafeAreaView, 
  ScrollViewProps,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { colors, spacing, borderRadius } from '../../theme';

interface ContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  safe?: boolean;
  edges?: Array<'top' | 'bottom' | 'left' | 'right'>;
}

export const Container: React.FC<ContainerProps> = ({
  children,
  style,
  safe = true,
  edges = ['top', 'bottom', 'left', 'right'],
}) => {
  const Wrapper = safe ? SafeAreaView : View;
  
  return (
    <Wrapper style={[styles.container, style]} edges={edges}>
      {children}
    </Wrapper>
  );
};

interface ScreenProps extends ContainerProps {
  scrollable?: boolean;
  refreshControl?: ScrollViewProps['refreshControl'];
  contentContainerStyle?: ScrollViewProps['contentContainerStyle'];
}

export const Screen: React.FC<ScreenProps> = ({
  children,
  scrollable = false,
  refreshControl,
  contentContainerStyle,
  style,
  ...props
}) => {
  if (scrollable) {
    return (
      <Container style={style} {...props}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl}
        >
          {children}
        </ScrollView>
      </Container>
    );
  }

  return (
    <Container style={[styles.screen, style]} {...props}>
      {children}
    </Container>
  );
};

interface SectionProps {
  children: React.ReactNode;
  title?: string;
  emoji?: string;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  spacing?: 'small' | 'medium' | 'large';
}

export const Section: React.FC<SectionProps> = ({
  children,
  title,
  emoji,
  style,
  contentStyle,
  spacing: sectionSpacing = 'medium',
}) => {
  const getSpacing = () => {
    switch (sectionSpacing) {
      case 'small':
        return spacing.small;
      case 'large':
        return spacing.extraLarge;
      default:
        return spacing.large;
    }
  };

  return (
    <View style={[styles.section, style]}>
      {title && (
        <View style={[styles.sectionHeader, { marginBottom: getSpacing() }]}>
          {emoji && (
            <Text style={styles.sectionEmoji}>{emoji}</Text>
          )}
          <Text variant="title" weight="semibold">
            {title}
          </Text>
        </View>
      )}
      <View style={[styles.sectionContent, contentStyle]}>
        {children}
      </View>
    </View>
  );
};

interface RowProps {
  children: React.ReactNode;
  style?: ViewStyle;
  spacing?: 'small' | 'medium' | 'large';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  wrap?: boolean;
}

export const Row: React.FC<RowProps> = ({
  children,
  style,
  spacing: rowSpacing = 'medium',
  align = 'start',
  justify = 'start',
  wrap = false,
}) => {
  const getSpacing = () => {
    switch (rowSpacing) {
      case 'small':
        return spacing.small;
      case 'large':
        return spacing.large;
      default:
        return spacing.medium;
    }
  };

  const getAlignItems = () => {
    switch (align) {
      case 'center':
        return 'center';
      case 'end':
        return 'flex-end';
      case 'stretch':
        return 'stretch';
      default:
        return 'flex-start';
    }
  };

  const getJustifyContent = () => {
    switch (justify) {
      case 'center':
        return 'center';
      case 'end':
        return 'flex-end';
      case 'between':
        return 'space-between';
      case 'around':
        return 'space-around';
      case 'evenly':
        return 'space-evenly';
      default:
        return 'flex-start';
    }
  };

  return (
    <View
      style={[
        styles.row,
        {
          marginHorizontal: -getSpacing() / 2,
          alignItems: getAlignItems(),
          justifyContent: getJustifyContent(),
          flexWrap: wrap ? 'wrap' : 'nowrap',
        },
        style,
      ]}
    >
      {React.Children.map(children, (child, index) => (
        <View
          key={index}
          style={{
            marginHorizontal: getSpacing() / 2,
          }}
        >
          {child}
        </View>
      ))}
    </View>
  );
};

interface ColumnProps {
  children: React.ReactNode;
  style?: ViewStyle;
  spacing?: 'small' | 'medium' | 'large';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
}

export const Column: React.FC<ColumnProps> = ({
  children,
  style,
  spacing: columnSpacing = 'medium',
  align = 'stretch',
  justify = 'start',
}) => {
  const getSpacing = () => {
    switch (columnSpacing) {
      case 'small':
        return spacing.small;
      case 'large':
        return spacing.large;
      default:
        return spacing.medium;
    }
  };

  const getAlignItems = () => {
    switch (align) {
      case 'center':
        return 'center';
      case 'end':
        return 'flex-end';
      case 'start':
        return 'flex-start';
      default:
        return 'stretch';
    }
  };

  const getJustifyContent = () => {
    switch (justify) {
      case 'center':
        return 'center';
      case 'end':
        return 'flex-end';
      case 'between':
        return 'space-between';
      case 'around':
        return 'space-around';
      case 'evenly':
        return 'space-evenly';
      default:
        return 'flex-start';
    }
  };

  return (
    <View
      style={[
        styles.column,
        {
          justifyContent: getJustifyContent(),
          alignItems: getAlignItems(),
        },
        style,
      ]}
    >
      {React.Children.map(children, (child, index) => (
        <View
          key={index}
          style={{
            marginBottom: index < React.Children.count(children) - 1 ? getSpacing() : 0,
          }}
        >
          {child}
        </View>
      ))}
    </View>
  );
};

interface SpacerProps {
  size?: 'micro' | 'small' | 'medium' | 'large' | 'extraLarge' | 'huge';
  horizontal?: boolean;
}

export const Spacer: React.FC<SpacerProps> = ({
  size = 'medium',
  horizontal = false,
}) => {
  const getSize = () => {
    switch (size) {
      case 'micro':
        return spacing.micro;
      case 'small':
        return spacing.small;
      case 'large':
        return spacing.large;
      case 'extraLarge':
        return spacing.extraLarge;
      case 'huge':
        return spacing.huge;
      default:
        return spacing.medium;
    }
  };

  return (
    <View
      style={{
        [horizontal ? 'width' : 'height']: getSize(),
      }}
    />
  );
};

interface DividerProps {
  style?: ViewStyle;
  spacing?: 'small' | 'medium' | 'large';
}

export const Divider: React.FC<DividerProps> = ({ style, spacing: dividerSpacing = 'medium' }) => {
  const getMarginVertical = () => {
    switch (dividerSpacing) {
      case 'small':
        return spacing.small;
      case 'large':
        return spacing.large;
      default:
        return spacing.medium;
    }
  };

  return (
    <View
      style={[
        styles.divider,
        {
          marginVertical: getMarginVertical(),
        },
        style,
      ]}
    />
  );
};

// Import Text component
import { Text } from '../Text';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },

  screen: {
    flex: 1,
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
  },

  section: {
    marginBottom: spacing.extraLarge,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  sectionEmoji: {
    fontSize: 20,
    marginRight: spacing.small,
  },

  sectionContent: {
    flex: 1,
  },

  row: {
    flexDirection: 'row',
  },

  column: {
    flexDirection: 'column',
  },

  divider: {
    height: 1,
    backgroundColor: colors.background.tertiary,
  },
});

export default Container;