import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type PendingLogDateContextValue = {
  pendingLogDate: string | null;
  setPendingLogDate: (dateKey: string | null) => void;
};

const PendingLogDateContext = createContext<PendingLogDateContextValue | null>(null);

export function PendingLogDateProvider({ children }: { children: ReactNode }) {
  const [pendingLogDate, setPendingLogDate] = useState<string | null>(null);
  const value = useMemo(
    () => ({ pendingLogDate, setPendingLogDate }),
    [pendingLogDate],
  );
  return (
    <PendingLogDateContext.Provider value={value}>
      {children}
    </PendingLogDateContext.Provider>
  );
}

export function usePendingLogDate() {
  const ctx = useContext(PendingLogDateContext);
  if (!ctx) {
    throw new Error("usePendingLogDate must be used within PendingLogDateProvider");
  }
  return ctx;
}
