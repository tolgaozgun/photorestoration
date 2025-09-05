import React, { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  SafeAreaView,
} from 'react-native';
// import { LinearGradient } from 'expo-linear-gradient';

interface Props {
  onContinue: () => void;
  onSkip: () => void;
}

export default function OnboardingScreen2({ onContinue }: Props) {
  const { t } = useTranslation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const iconAnims = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Animate icons sequentially
      Animated.stagger(200, 
        iconAnims.map(anim =>
          Animated.spring(anim, {
            toValue: 1,
            tension: 20,
            friction: 7,
            useNativeDriver: true,
          })
        )
      ).start();
    });
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Process Flow */}
        <Animated.View 
          style={[
            styles.processSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.processFlow}>
            {/* Step 1 */}
            <Animated.View 
              style={[
                styles.processStep,
                {
                  opacity: iconAnims[0],
                  transform: [{ scale: iconAnims[0] }]
                }
              ]}
            >
              <View style={styles.stepIcon}>
                <Text style={styles.stepEmoji}>📱</Text>
              </View>
              <Text style={styles.stepText}>{t('onboarding.screen2.step1')}</Text>
            </Animated.View>

            {/* Connector */}
            <View style={styles.connector}>
              <View style={styles.connectorLine} />
              <Text style={styles.connectorArrow}>→</Text>
            </View>

            {/* Step 2 */}
            <Animated.View 
              style={[
                styles.processStep,
                {
                  opacity: iconAnims[1],
                  transform: [{ scale: iconAnims[1] }]
                }
              ]}
            >
              <View style={styles.stepIcon}>
                <Text style={styles.stepEmoji}>✨</Text>
              </View>
              <Text style={styles.stepText}>{t('onboarding.screen2.step2')}</Text>
            </Animated.View>

            {/* Connector */}
            <View style={styles.connector}>
              <View style={styles.connectorLine} />
              <Text style={styles.connectorArrow}>→</Text>
            </View>

            {/* Step 3 */}
            <Animated.View 
              style={[
                styles.processStep,
                {
                  opacity: iconAnims[2],
                  transform: [{ scale: iconAnims[2] }]
                }
              ]}
            >
              <View style={styles.stepIcon}>
                <Text style={styles.stepEmoji}>💾</Text>
              </View>
              <Text style={styles.stepText}>{t('onboarding.screen2.step3')}</Text>
            </Animated.View>
          </View>
        </Animated.View>

        {/* Text Content */}
        <Animated.View 
          style={[
            styles.textSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Text style={styles.title}>{t('onboarding.screen2.title')}</Text>
          <Text style={styles.subtitle}>
            {t('onboarding.screen2.subtitle')}
          </Text>
        </Animated.View>

        {/* Continue Button */}
        <Animated.View 
          style={[
            styles.buttonSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <TouchableOpacity
            style={styles.continueButton}
            onPress={onContinue}
            activeOpacity={0.9}
          >
            <View style={styles.continueGradient}>
              <Text style={styles.continueText}>{t('onboarding.getStarted')}</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'space-between',
  },
  processSection: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  processFlow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  processStep: {
    alignItems: 'center',
    flex: 1,
  },
  stepIcon: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.2)',
  },
  stepEmoji: {
    fontSize: 36,
  },
  stepText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  connector: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  connectorLine: {
    width: 30,
    height: 2,
    backgroundColor: 'rgba(255, 107, 107, 0.3)',
    marginBottom: 4,
  },
  connectorArrow: {
    fontSize: 16,
    color: '#FF6B6B',
  },
  textSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 30,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonSection: {
    paddingBottom: 32,
  },
  continueButton: {
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  continueGradient: {
    paddingVertical: 18,
    paddingHorizontal: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B6B',
    borderRadius: 24,
  },
  continueText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
});