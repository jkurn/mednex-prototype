import { createContext, useContext, useState, ReactNode } from "react";

interface SettingsModalContextType {
  isOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
}

const SettingsModalContext = createContext<SettingsModalContextType | null>(null);

export function SettingsModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openSettings = () => setIsOpen(true);
  const closeSettings = () => setIsOpen(false);

  return (
    <SettingsModalContext.Provider value={{ isOpen, openSettings, closeSettings }}>
      {children}
    </SettingsModalContext.Provider>
  );
}

export function useSettingsModal() {
  const context = useContext(SettingsModalContext);
  if (!context) {
    throw new Error("useSettingsModal must be used within a SettingsModalProvider");
  }
  return context;
}
