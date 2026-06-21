import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type WidgetQuickActionContextValue = {
  queueCameraLog: () => void;
  consumeCameraLog: () => boolean;
};

const WidgetQuickActionContext = createContext<WidgetQuickActionContextValue | null>(null);

export function WidgetQuickActionProvider({ children }: { children: ReactNode }) {
  const [pendingCameraLog, setPendingCameraLog] = useState(false);

  const queueCameraLog = useCallback(() => {
    setPendingCameraLog(true);
  }, []);

  const consumeCameraLog = useCallback(() => {
    if (!pendingCameraLog) return false;
    setPendingCameraLog(false);
    return true;
  }, [pendingCameraLog]);

  const value = useMemo(
    () => ({
      queueCameraLog,
      consumeCameraLog,
    }),
    [queueCameraLog, consumeCameraLog],
  );

  return (
    <WidgetQuickActionContext.Provider value={value}>
      {children}
    </WidgetQuickActionContext.Provider>
  );
}

export function useWidgetQuickAction() {
  const ctx = useContext(WidgetQuickActionContext);
  if (!ctx) {
    throw new Error("useWidgetQuickAction must be used within WidgetQuickActionProvider");
  }
  return ctx;
}
