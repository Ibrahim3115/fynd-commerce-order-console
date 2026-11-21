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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onCancel}
      />
      <div className="relative bg-brand-surface border border-brand-border rounded-xl p-6 w-full max-w-md shadow-xl animate-fade-in">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-brand-muted hover:text-brand-text p-1 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3.5 mb-4">
          <div className={`p-2 rounded-lg flex-shrink-0 ${
            dangerous
              ? 'bg-red-500/10 border border-red-500/20 text-red-400'
              : 'bg-brand-accent/10 border border-brand-accent/20 text-brand-accent'
          }`}>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-[17px] font-semibold text-brand-text">{title}</h3>
            <p className="text-[12px] text-brand-muted mt-0.5">Please confirm this action</p>
          </div>
        </div>

        <div className="text-brand-secondary text-[13px] mb-6 leading-relaxed bg-brand-surface-raised p-3.5 rounded-lg border border-brand-border">
          {message}
        </div>

        <div className="flex gap-2.5 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-2 text-[13px] font-medium text-brand-secondary bg-brand-surface-raised border border-brand-border rounded-lg hover:text-brand-text hover:bg-brand-border/40 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-3.5 py-2 text-[13px] font-medium rounded-lg transition-colors ${
              dangerous
                ? 'bg-red-600 hover:bg-red-500 text-white'
                : 'bg-brand-accent hover:bg-brand-accent-hover text-brand-bg font-medium'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};