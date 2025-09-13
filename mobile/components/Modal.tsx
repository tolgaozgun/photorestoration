import * as React from 'react';
import { View, Modal as NativeModal, StyleSheet, ActivityIndicator, Text, ViewStyle, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { Text as CustomText } from './Text';
import { colors, spacing, borderRadius, shadows } from '../theme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  style?: ViewStyle;
}

export function Modal({ visible, onClose, children, style }: ModalProps) {
  return (
    <NativeModal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, style]}>
        <View style={styles.content}>
          {children}
        </View>
      </View>
    </NativeModal>
  );
}

interface LoadingModalProps {
  visible: boolean;
  message?: string;
  style?: ViewStyle;
  onClose?: () => void;
}

export function LoadingModal({ visible, message = "Loading...", style, onClose = () => {} }: LoadingModalProps) {
  return (
    <Modal visible={visible} onClose={onClose} style={style}>
      <View style={styles.loadingContent}>
        <ActivityIndicator size="large" color="#007AFF" />
        <CustomText variant="secondary" style={styles.loadingText}>
          {message}
        </CustomText>
      </View>
    </Modal>
  );
}

// Bottom Sheet Modal Component
interface BottomSheetModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  height?: number;
}

export function BottomSheetModal({ visible, onClose, title, children, height = 300 }: BottomSheetModalProps) {
  const slideAnim = React.useRef(new Animated.Value(height)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 12,
      }).start();
    } else {
      Animated.spring(slideAnim, {
        toValue: height,
        useNativeDriver: true,
        tension: 80,
        friction: 12,
      }).start();
    }
  }, [visible, height]);

  return (
    <NativeModal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.bottomSheetOverlay}>
        <TouchableOpacity 
          style={styles.bottomSheetBackdrop} 
          onPress={onClose}
          activeOpacity={1}
        />
        <Animated.View style={[
          styles.bottomSheetContainer,
          {
            height: height,
            transform: [{ translateY: slideAnim }],
          },
        ]}>
          {/* Drag Handle */}
          <View style={styles.dragHandle}>
            <View style={styles.dragHandleBar} />
          </View>
          
          {/* Title */}
          {title && (
            <View style={styles.bottomSheetHeader}>
              <CustomText variant="title" style={styles.bottomSheetTitle}>
                {title}
              </CustomText>
            </View>
          )}
          
          {/* Content */}
          <View style={styles.bottomSheetContent}>
            {children}
          </View>
        </Animated.View>
      </View>
    </NativeModal>
  );
}

// Confirmation Modal Component
interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
}

export function ConfirmationModal({ 
  visible, 
  title, 
  message, 
  confirmText = "Confirm", 
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  destructive = false 
}: ConfirmationModalProps) {
  return (
    <NativeModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.confirmationOverlay}>
        <View style={styles.confirmationContainer}>
          <CustomText variant="title" style={styles.confirmationTitle}>
            {title}
          </CustomText>
          <CustomText variant="secondary" style={styles.confirmationMessage}>
            {message}
          </CustomText>
          <View style={styles.confirmationButtons}>
            <TouchableOpacity 
              style={styles.confirmationCancel}
              onPress={onCancel}
            >
              <CustomText style={styles.confirmationCancelText}>
                {cancelText}
              </CustomText>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.confirmationConfirm,
                destructive && styles.confirmationConfirmDestructive
              ]}
              onPress={onConfirm}
            >
              <CustomText style={[
                styles.confirmationConfirmText,
                ...(destructive ? [styles.confirmationConfirmTextDestructive] : [])
              ]}>
                {confirmText}
              </CustomText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </NativeModal>
  );
}

// Success Modal Component
interface SuccessModalProps {
  visible: boolean;
  title: string;
  message: string;
  buttonText?: string;
  onButtonPress: () => void;
  icon?: string;
}

export function SuccessModal({ 
  visible, 
  title, 
  message, 
  buttonText = "OK", 
  onButtonPress,
  icon = "✓"
}: SuccessModalProps) {
  return (
    <NativeModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onButtonPress}
    >
      <View style={styles.successOverlay}>
        <View style={styles.successContainer}>
          <View style={styles.successIconContainer}>
            <Text style={styles.successIcon}>{icon}</Text>
          </View>
          <CustomText variant="title" style={styles.successTitle}>
            {title}
          </CustomText>
          <CustomText variant="secondary" style={styles.successMessage}>
            {message}
          </CustomText>
          <TouchableOpacity 
            style={styles.successButton}
            onPress={onButtonPress}
          >
            <CustomText style={styles.successButtonText}>
              {buttonText}
            </CustomText>
          </TouchableOpacity>
        </View>
      </View>
    </NativeModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.largeLegacy,
    padding: spacing.xlLegacy,
    minWidth: 300,
    maxWidth: '80%',
  },
  loadingContent: {
    alignItems: 'center',
    padding: spacing.xlLegacy,
  },
  loadingText: {
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  
  // Bottom Sheet Styles
  bottomSheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  bottomSheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  bottomSheetContainer: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    ...shadows.xl,
  },
  dragHandle: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  dragHandleBar: {
    width: 40,
    height: 4,
    backgroundColor: colors.border.borderSecondary,
    borderRadius: 2,
  },
  bottomSheetHeader: {
    paddingHorizontal: spacing.xlLegacy,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.borderSecondary,
  },
  bottomSheetTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  bottomSheetContent: {
    flex: 1,
    paddingHorizontal: spacing.xlLegacy,
    paddingTop: spacing.lg,
  },
  
  // Confirmation Modal Styles
  confirmationOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmationContainer: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.xl,
    padding: spacing.xlLegacy,
    width: screenWidth - 64,
    ...shadows.xl,
  },
  confirmationTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  confirmationMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  confirmationButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  confirmationCancel: {
    flex: 1,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background.tertiary,
    alignItems: 'center',
  },
  confirmationCancelText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
  },
  confirmationConfirm: {
    flex: 1,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  confirmationConfirmDestructive: {
    backgroundColor: '#FF3B30',
  },
  confirmationConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.inverse,
  },
  confirmationConfirmTextDestructive: {
    color: '#FFFFFF',
  },
  
  // Success Modal Styles
  successOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successContainer: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.xl,
    padding: spacing.xlLegacy,
    width: screenWidth - 64,
    alignItems: 'center',
    ...shadows.xl,
  },
  successIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  successIcon: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  successMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  successButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    width: '100%',
    alignItems: 'center',
  },
  successButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.inverse,
  },
});