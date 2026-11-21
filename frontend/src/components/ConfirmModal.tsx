import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  dangerous?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  dangerous = false,
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-brand-card border border-brand-border rounded-xl p-6 w-full max-w-md shadow-2xl">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-lg ${dangerous ? 'bg-red-500/20' : 'bg-amber-500/20'}`}>
            <AlertTriangle className={`w-5 h-5 ${dangerous ? 'text-red-400' : 'text-amber-400'}`} />
          </div>
          <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
        </div>
        <p className="text-slate-400 text-sm mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-300 bg-brand-panel border border-brand-border rounded-lg hover:bg-brand-border transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors
              ${dangerous
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-brand-orange hover:bg-brand-orange-dark text-white'
              }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
