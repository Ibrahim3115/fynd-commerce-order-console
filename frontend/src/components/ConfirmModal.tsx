import React from 'react';
import { AlertTriangle, X, ShieldAlert } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm animate-fade-in"
        onClick={onCancel}
      />
      <div className="relative bg-brand-surface border border-brand-border rounded-xl p-6 w-full max-w-md shadow-2xl animate-fade-in">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-brand-muted hover:text-brand-text p-1 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3.5 mb-4">
          <div className={`p-2.5 rounded-lg ${dangerous ? 'bg-red-500/10 border border-red-500/30' : 'bg-brand-accent/10 border border-brand-accent/30'}`}>
            {dangerous ? (
              <ShieldAlert className="w-5 h-5 text-red-400" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-brand-accent" />
            )}
          </div>
          <div>
            <h3 className="text-base font-bold text-brand-text">{title}</h3>
            <p className="text-xs text-brand-muted mt-0.5">Operation requires explicit authorization</p>
          </div>
        </div>
        <p className="text-slate-300 text-sm mb-6 leading-relaxed bg-brand-surface-2 p-3.5 rounded-lg border border-brand-border">
          {message}
        </p>
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold text-brand-muted bg-brand-surface-2 border border-brand-border rounded-lg hover:text-brand-text hover:bg-slate-800 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors shadow-lg ${
              dangerous
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-950/50'
                : 'bg-brand-accent hover:bg-brand-accent-hover text-brand-bg shadow-amber-950/50'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
