import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { PlusFeatureId } from "@lifeplate/shared";
import { PlusPaywallModal } from "@/components/plus/PlusPaywallModal";

type PlusPaywallContextValue = {
  openPaywall: (featureId?: PlusFeatureId, onClose?: () => void) => void;
  closePaywall: () => void;
};

const PlusPaywallContext = createContext<PlusPaywallContextValue | null>(null);

export function PlusPaywallProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [highlightFeatureId, setHighlightFeatureId] = useState<PlusFeatureId | null>(null);
  const onCloseRef = useRef<(() => void) | null>(null);

  const openPaywall = useCallback((featureId?: PlusFeatureId, onClose?: () => void) => {
    setHighlightFeatureId(featureId ?? null);
    onCloseRef.current = onClose ?? null;
    setVisible(true);
  }, []);

  const closePaywall = useCallback(() => {
    setVisible(false);
    setHighlightFeatureId(null);
    const listener = onCloseRef.current;
    onCloseRef.current = null;
    listener?.();
  }, []);

  const value = useMemo(
    () => ({
      openPaywall,
      closePaywall,
    }),
    [openPaywall, closePaywall],
  );

  return (
    <PlusPaywallContext.Provider value={value}>
      {children}
      <PlusPaywallModal
        visible={visible}
        highlightFeatureId={highlightFeatureId}
        onClose={closePaywall}
      />
    </PlusPaywallContext.Provider>
  );
}

export function usePlusPaywall() {
  const ctx = useContext(PlusPaywallContext);
  if (!ctx) {
    throw new Error("usePlusPaywall must be used within PlusPaywallProvider");
  }
  return ctx;
}
