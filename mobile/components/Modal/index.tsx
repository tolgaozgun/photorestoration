import React from 'react';
import { 
  Modal as RNModal,
  View,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ViewStyle,
  ModalProps as RNModalProps,
} from 'react-native';
import { colors, borderRadius, spacing, layout } from '../../theme';
import { Text } from '../Text';
import { Button } from '../Button';
import { Header } from '../Navigation';

interface ModalProps extends RNModalProps {
  visible: boolean;
  onClose?: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  variant?: 'fullScreen' | 'centered' | 'bottomSheet';
  showCloseButton?: boolean;
  showHeader?: boolean;
  animationType?: 'slide' | 'fade' | 'none';
}

export const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  title,
  subtitle,
  children,
  variant = 'centered',
  showCloseButton = true,
  showHeader = true,
  animationType = 'slide',
  ...props
}) => {
  const getModalStyle = (): ViewStyle => {
    switch (variant) {
      case 'fullScreen':
        return styles.fullScreenModal;
      case 'bottomSheet':
        return styles.bottomSheetModal;
      default:
        return styles.centeredModal;
    }
  };

  const getOverlayStyle = (): ViewStyle => {
    switch (variant) {
      case 'fullScreen':
        return styles.fullScreenOverlay;
      case 'bottomSheet':
        return styles.bottomSheetOverlay;
      default:
        return styles.centeredOverlay;
    }
  };

  const renderHeader = () => {
    if (!showHeader && !title && !subtitle) return null;

    return (
      <Header
        title={title}
        subtitle={subtitle}
        leftAction={
          showCloseButton && (
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text variant="title" color="primary">×</Text>
            </TouchableOpacity>
          )
        }
        transparent={variant === 'fullScreen'}
      />
    );
  };

  return (
    <RNModal
      visible={visible}
      transparent={true}
      animationType={animationType}
      statusBarTranslucent={variant === 'fullScreen'}
      {...props}
    >
      <TouchableWithoutFeedback onPress={variant === 'centered' ? onClose : undefined}>
        <View style={getOverlayStyle()}>
          <TouchableWithoutFeedback>
            <View style={getModalStyle()}>
              {renderHeader()}
              {children}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
};

interface AlertModalProps {
  visible: boolean;
  onClose?: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  variant?: 'info' | 'warning' | 'error' | 'success';
}

export const AlertModal: React.FC<AlertModalProps> = ({
  visible,
  onClose,
  title,
  message,
  confirmText = 'OK',
  cancelText,
  onConfirm,
  onCancel,
  _variant = 'info',
}) => {
  
  return (
    <Modal
      visible={visible}
      onClose={onClose || onCancel}
      title={title}
      variant="centered"
      animationType="fade"
    >
      <View style={styles.alertContent}>
        <Text 
          variant="body" 
          color="secondary" 
          style={styles.alertMessage}
          textAlign="center"
        >
          {message}
        </Text>
        
        <View style={styles.alertActions}>
          {cancelText && (
            <Button
              variant="secondary"
              onPress={onCancel || onClose}
              style={styles.alertButton}
            >
              {cancelText}
            </Button>
          )}
          <Button
            variant="primary"
            onPress={onConfirm || onClose}
            style={styles.alertButton}
          >
            {confirmText}
          </Button>
        </View>
      </View>
    </Modal>
  );
};

interface LoadingModalProps {
  visible: boolean;
  message?: string;
  progress?: number;
}

export const LoadingModal: React.FC<LoadingModalProps> = ({
  visible,
  message = 'Loading...',
  progress,
}) => {
  return (
    <Modal
      visible={visible}
      variant="centered"
      animationType="fade"
      showCloseButton={false}
    >
      <View style={styles.loadingContent}>
        <View style={styles.loadingSpinner}>
          {/* Custom loading spinner animation */}
          <View style={styles.loadingSpinnerInner} />
        </View>
        
        {message && (
          <Text 
            variant="body" 
            color="secondary" 
            style={styles.loadingMessage}
            textAlign="center"
          >
            {message}
          </Text>
        )}
        
        {progress !== undefined && (
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { width: `${progress}%` }
              ]}
            />
          </View>
        )}
      </View>
    </Modal>
  );
};

interface BottomSheetProps {
  visible: boolean;
  onClose?: () => void;
  title?: string;
  children: React.ReactNode;
  snapPoints?: string[];
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  visible,
  onClose,
  title,
  children,
  _snapPoints = ['50%', '80%'],
}) => {
  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={title}
      variant="bottomSheet"
      animationType="slide"
    >
      <View style={styles.bottomSheetContent}>
        {/* Handle indicator */}
        <View style={styles.bottomSheetHandle} />
        
        {children}
      </View>
    </Modal>
  );
};

// Premium upgrade modal
interface PremiumModalProps {
  visible: boolean;
  onClose?: () => void;
  onUpgrade?: () => void;
  features?: string[];
  price?: string;
}

export const PremiumModal: React.FC<PremiumModalProps> = ({
  visible,
  onClose,
  onUpgrade,
  features = [
    'Unlimited enhancements',
    'HD quality exports',
    'Remove watermarks',
    'Priority processing',
    'Advanced AI features'
  ],
  price = '$9.99/month',
}) => {
  return (
    <Modal
      visible={visible}
      onClose={onClose}
      variant="centered"
      animationType="slide"
    >
      <View style={styles.premiumContent}>
        {/* Crown icon */}
        <View style={styles.premiumIcon}>
          <Text variant="display" color="primary">👑</Text>
        </View>
        
        <Text variant="title" color="primary" weight="bold" textAlign="center">
          Go Premium
        </Text>
        
        <Text 
          variant="body" 
          color="secondary" 
          style={styles.premiumDescription}
          textAlign="center"
        >
          Unlock all features and enhance your photos with unlimited access
        </Text>
        
        {/* Features list */}
        <View style={styles.premiumFeatures}>
          {features.map((feature, index) => (
            <View key={index} style={styles.premiumFeatureItem}>
              <Text variant="body" color="primary">✓</Text>
              <Text variant="body" color="secondary" style={styles.premiumFeatureText}>
                {feature}
              </Text>
            </View>
          ))}
        </View>
        
        {/* Price */}
        <Text variant="title" color="primary" weight="bold" textAlign="center">
          {price}
        </Text>
        
        {/* Actions */}
        <View style={styles.premiumActions}>
          <Button
            variant="premium"
            onPress={onUpgrade}
            style={styles.premiumButton}
          >
            Upgrade Now
          </Button>
          
          <Button
            variant="tertiary"
            onPress={onClose}
            style={styles.premiumCancelButton}
          >
            Maybe Later
          </Button>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  // Overlay styles
  centeredOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  fullScreenOverlay: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },

  bottomSheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
  },

  // Modal container styles
  centeredModal: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.huge,
    maxWidth: layout.modal.content.maxWidth,
    width: '90%',
    maxHeight: '80%',
    overflow: 'hidden',
  },

  fullScreenModal: {
    flex: 1,
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: borderRadius.huge,
    borderTopRightRadius: borderRadius.huge,
  },

  bottomSheetModal: {
    backgroundColor: colors.background.secondary,
    borderTopLeftRadius: borderRadius.huge,
    borderTopRightRadius: borderRadius.huge,
    maxHeight: '80%',
  },

  // Common styles
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Alert modal styles
  alertContent: {
    padding: spacing.large,
  },

  alertMessage: {
    marginBottom: spacing.large,
    lineHeight: 24,
  },

  alertActions: {
    flexDirection: 'row',
    gap: spacing.medium,
  },

  alertButton: {
    flex: 1,
  },

  // Loading modal styles
  loadingContent: {
    padding: spacing.extraLarge,
    alignItems: 'center',
    minWidth: 200,
  },

  loadingSpinner: {
    width: 40,
    height: 40,
    marginBottom: spacing.medium,
  },

  loadingSpinnerInner: {
    width: '100%',
    height: '100%',
    borderWidth: 3,
    borderColor: colors.accent.primary,
    borderTopColor: 'transparent',
    borderRadius: 20,
    // Add rotation animation
  },

  loadingMessage: {
    marginBottom: spacing.medium,
  },

  progressBar: {
    width: 200,
    height: 4,
    backgroundColor: colors.background.tertiary,
    borderRadius: 2,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    backgroundColor: colors.accent.primary,
    borderRadius: 2,
  },

  // Bottom sheet styles
  bottomSheetContent: {
    padding: spacing.large,
  },

  bottomSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.background.tertiary,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.medium,
  },

  // Premium modal styles
  premiumContent: {
    padding: spacing.extraLarge,
    alignItems: 'center',
  },

  premiumIcon: {
    marginBottom: spacing.medium,
  },

  premiumDescription: {
    marginBottom: spacing.large,
    lineHeight: 24,
  },

  premiumFeatures: {
    width: '100%',
    marginBottom: spacing.large,
  },

  premiumFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.medium,
  },

  premiumFeatureText: {
    marginLeft: spacing.small,
  },

  premiumActions: {
    width: '100%',
    gap: spacing.medium,
  },

  premiumButton: {
    width: '100%',
  },

  premiumCancelButton: {
    width: '100%',
  },
});

export default Modal;