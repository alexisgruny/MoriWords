"use client";

import { ReactNode, createContext, useCallback, useContext, useRef, useState } from "react";

type ToastVariant = "success" | "error";

type ToastItem = {
  id: number;
  message: string;
  variant: ToastVariant;
};

type ToastContextValue = {
  showToast: (message: string, variant?: ToastVariant) => void;
};

const TOAST_DURATION_MS = 3000;

const ToastContext = createContext<ToastContextValue | null>(null);

// Fournit un système de notification global (coin bas-droit), pour donner
// un retour visuel sur les actions qui ne changent pas la mise en page de
// façon évidente (deck créé, carte ajoutée, révision enregistrée...).
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const showToast = useCallback((message: string, variant: ToastVariant = "success") => {
    const id = nextId.current;
    nextId.current += 1;

    setToasts((current) => [...current, { id, message, variant }]);

    setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, TOAST_DURATION_MS);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-stack" aria-live="polite" aria-atomic="false">
        {toasts.map((toast) => (
          <div key={toast.id} role="status" className={`toast toast-${toast.variant}`}>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// Donne accès à showToast() depuis n'importe quel composant client sous ToastProvider.
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast doit être utilisé à l'intérieur d'un ToastProvider.");
  }

  return context;
}
