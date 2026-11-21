import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AlertTriangle, Info, CheckCircle2, HelpCircle, X } from 'lucide-react';

export type AlertType = 'info' | 'warning' | 'error' | 'success';

interface AlertOptions {
  title?: string;
  message: string;
  type?: AlertType;
  confirmLabel?: string;
}

interface ConfirmOptions {
  title?: string;
  message: string;
  type?: AlertType;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

interface AlertContextType {
  showAlert: (options: AlertOptions | string) => void;
  showConfirm: (options: ConfirmOptions) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isConfirmMode, setIsConfirmMode] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<AlertType>('warning');
  const [confirmLabel, setConfirmLabel] = useState('OK');
  const [cancelLabel, setCancelLabel] = useState('BATAL');
  const [confirmCallback, setConfirmCallback] = useState<(() => void | Promise<void>) | null>(null);
  const [cancelCallback, setCancelCallback] = useState<(() => void) | null>(null);

  const showAlert = (options: AlertOptions | string) => {
    if (typeof options === 'string') {
      setTitle('PEMBERITAHUAN');
      setMessage(options);
      setType('warning');
      setConfirmLabel('OK');
    } else {
      setTitle(options.title || (options.type === 'error' ? 'KESALAHAN' : 'PEMBERITAHUAN'));
      setMessage(options.message);
      setType(options.type || 'warning');
      setConfirmLabel(options.confirmLabel || 'OK');
    }
    setIsConfirmMode(false);
    setConfirmCallback(null);
    setCancelCallback(null);
    setIsOpen(true);
  };

  const showConfirm = (options: ConfirmOptions) => {
    setTitle(options.title || 'KONFIRMASI');
    setMessage(options.message);
    setType(options.type || 'warning');
    setConfirmLabel(options.confirmLabel || 'LANJUTKAN');
    setCancelLabel(options.cancelLabel || 'BATAL');
    setConfirmCallback(() => options.onConfirm);
    setCancelCallback(() => options.onCancel || null);
    setIsConfirmMode(true);
    setIsOpen(true);
  };

  const handleConfirm = async () => {
    setIsOpen(false);
    if (confirmCallback) {
      await confirmCallback();
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
    if (cancelCallback) {
      cancelCallback();
    }
  };

  const renderIcon = () => {
    switch (type) {
      case 'error':
        return <AlertTriangle className="h-6 w-6 text-red-500 stroke-[2.5]" />;
      case 'success':
        return <CheckCircle2 className="h-6 w-6 text-green-500 stroke-[2.5]" />;
      case 'info':
        return <Info className="h-6 w-6 text-blue-400 stroke-[2.5]" />;
      default:
        return isConfirmMode ? (
          <HelpCircle className="h-6 w-6 text-amber-500 stroke-[2.5]" />
        ) : (
          <AlertTriangle className="h-6 w-6 text-amber-500 stroke-[2.5]" />
        );
    }
  };

  return (
    <AlertContext.Provider value={{ showAlert, showConfirm }}>
      {children}

      {/* Retro 8-Bit Modal Dialog Pop-up */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150 overflow-y-auto">
          <div className="retro-box max-w-sm w-full p-4 sm:p-5 shadow-[var(--glow-shadow)] border-[3px] border-[var(--border-color)] bg-[var(--bg-card)] max-h-[92vh] overflow-y-auto my-auto">
            <div className="flex items-start gap-3">
              <div className="p-2 border-2 border-[var(--border-color)] bg-[var(--bg-card-subtle)] shrink-0">
                {renderIcon()}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between pb-1.5 border-b-2 border-[var(--border-color)] mb-2">
                  <h3 className="font-pixel text-[10px] sm:text-xs text-[var(--text-primary)] uppercase">
                    {title}
                  </h3>
                  <button
                    onClick={handleCancel}
                    className="p-0.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <p className="font-mono text-xs text-[var(--text-primary)] leading-relaxed">
                  {message}
                </p>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t-2 border-[var(--border-color)] flex items-center justify-end gap-2">
              {isConfirmMode && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="retro-btn text-[8px] sm:text-[9px] py-1.5 px-3"
                >
                  {cancelLabel}
                </button>
              )}
              <button
                type="button"
                onClick={handleConfirm}
                className="retro-btn-accent text-[8px] sm:text-[9px] py-1.5 px-3.5"
                autoFocus
              >
                {confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </AlertContext.Provider>
  );
};

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};
