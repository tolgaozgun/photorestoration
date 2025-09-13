import * as React from 'react'
import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type FlowStep = 'photo-input' | 'mode-selection' | 'preview' | 'result';
type ModeType = 'enhance' | 'colorize' | 'de-scratch' | 'enlighten' | 'recreate' | 'combine';

interface FlowState {
  currentStep: FlowStep;
  selectedPhoto: string | null;
  selectedMode: ModeType | null;
  processingSettings: {
    qualityLevel: number;
    resolution: 'standard' | 'hd';
  } | null;
  result: {
    originalUri: string;
    enhancedUri: string;
    enhancementId: string;
    watermark: boolean;
    processingTime: number;
  } | null;
}

interface FlowContextType {
  flowState: FlowState;
  setCurrentStep: (step: FlowStep) => void;
  setSelectedPhoto: (photoUri: string) => void;
  setSelectedMode: (mode: ModeType) => void;
  setProcessingSettings: (settings: { qualityLevel: number; resolution: 'standard' | 'hd' }) => void;
  setResult: (result: FlowState['result']) => void;
  resetFlow: () => void;
  canNavigateToStep: (step: FlowStep) => boolean;
}

const FlowContext = createContext<FlowContextType | undefined>(undefined);

const initialFlowState: FlowState = {
  currentStep: 'photo-input',
  selectedPhoto: null,
  selectedMode: null,
  processingSettings: null,
  result: null,
};

interface FlowProviderProps {
  children: ReactNode;
}

export function FlowProvider({ children }: FlowProviderProps) {
  const [flowState, setFlowState] = useState<FlowState>(initialFlowState);

  const setCurrentStep = useCallback((step: FlowStep) => {
    setFlowState(prev => ({ ...prev, currentStep: step }));
  }, []);

  const setSelectedPhoto = useCallback((photoUri: string) => {
    setFlowState(prev => ({ 
      ...prev, 
      selectedPhoto: photoUri,
      currentStep: 'mode-selection'
    }));
  }, []);

  const setSelectedMode = useCallback((mode: ModeType) => {
    setFlowState(prev => ({ 
      ...prev, 
      selectedMode: mode,
      currentStep: 'preview'
    }));
  }, []);

  const setProcessingSettings = useCallback((settings: { qualityLevel: number; resolution: 'standard' | 'hd' }) => {
    setFlowState(prev => ({ ...prev, processingSettings: settings }));
  }, []);

  const setResult = useCallback((result: FlowState['result']) => {
    setFlowState(prev => ({ 
      ...prev, 
      result,
      currentStep: 'result'
    }));
  }, []);

  const resetFlow = useCallback(() => {
    setFlowState(initialFlowState);
  }, []);

  const canNavigateToStep = useCallback((step: FlowStep): boolean => {
    switch (step) {
      case 'photo-input':
        return true;
      case 'mode-selection':
        return flowState.selectedPhoto !== null;
      case 'preview':
        return flowState.selectedPhoto !== null && flowState.selectedMode !== null;
      case 'result':
        return flowState.result !== null;
      default:
        return false;
    }
  }, [flowState]);

  const contextValue: FlowContextType = {
    flowState,
    setCurrentStep,
    setSelectedPhoto,
    setSelectedMode,
    setProcessingSettings,
    setResult,
    resetFlow,
    canNavigateToStep,
  };

  return (
    <FlowContext.Provider value={contextValue}>
      {children}
    </FlowContext.Provider>
  );
}

export function useFlow(): FlowContextType {
  const context = useContext(FlowContext);
  if (context === undefined) {
    throw new Error('useFlow must be used within a FlowProvider');
  }
  return context;
}