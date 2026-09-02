import {
  createContext, ReactNode, useContext, useMemo,
} from 'react';
import { useLocalStorage } from '@/hooks/utils/use-local-storage';

export type PetBubblePlacement = 'above' | 'left' | 'right';

interface PetUiContextType {
  bubblePlacement: PetBubblePlacement;
  setBubblePlacement: (placement: PetBubblePlacement) => void;
}

const PetUiContext = createContext<PetUiContextType | null>(null);

function normalizePlacement(placement: PetBubblePlacement): PetBubblePlacement {
  return ['above', 'left', 'right'].includes(placement) ? placement : 'above';
}

export function PetUiProvider({ children }: { children: ReactNode }): JSX.Element {
  const [bubblePlacement, setBubblePlacement] = useLocalStorage<PetBubblePlacement>(
    'petBubblePlacement',
    'above',
    { filter: normalizePlacement },
  );
  const value = useMemo(() => ({
    bubblePlacement,
    setBubblePlacement,
  }), [bubblePlacement, setBubblePlacement]);

  return <PetUiContext.Provider value={value}>{children}</PetUiContext.Provider>;
}

export function usePetUi(): PetUiContextType {
  const context = useContext(PetUiContext);
  if (!context) throw new Error('usePetUi must be used within a PetUiProvider');
  return context;
}
