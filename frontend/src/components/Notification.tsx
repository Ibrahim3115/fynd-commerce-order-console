import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface NotificationContextValue {
  notify: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const NotificationContext = createContext<NotificationContextValue>({ notify: () => {} });

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const notify = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismiss = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2.5 w-84 max-w-[calc(100vw-2.5rem)] pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-2xl border backdrop-blur-md animate-slide-in-right bg-brand-surface/95 ${
              toast.type === 'success'
                ? 'border-emerald-500/40 text-emerald-100 shadow-emerald-950/20'
                : toast.type === 'error'
                ? 'border-red-500/40 text-red-100 shadow-red-950/20'
                : 'border-brand-accent/40 text-amber-100 shadow-amber-950/20'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            ) : toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            ) : (
              <Info className="w-4 h-4 text-brand-accent flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="text-xs font-semibold leading-relaxed">{toast.message}</p>
            </div>
            <button
              onClick={() => dismiss(toast.id)}
              className="text-slate-400 hover:text-slate-200 transition-colors p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};
