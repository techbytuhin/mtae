import React, { createContext, useState, useCallback, useContext, ReactNode } from 'react';
import ReactDOM from 'react-dom';
import { CheckCircleIcon, XCircleIcon, InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/solid';

type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: ToastType) => {
    const id = Date.now();
    setToasts((prevToasts) => [...prevToasts, { id, message, type }]);
    setTimeout(() => {
      setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
    }, 5000);
  }, []);

  const removeToast = (id: number) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  };
  
  const portalRoot = document.getElementById('portal-root');

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {portalRoot && ReactDOM.createPortal(
        <div className="fixed top-5 right-5 z-[100] space-y-3 w-80">
          {toasts.map((toast) => (
            <Toast key={toast.id} {...toast} onDismiss={() => removeToast(toast.id)} />
          ))}
        </div>,
        portalRoot
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const Toast: React.FC<ToastMessage & { onDismiss: () => void }> = ({ message, type, onDismiss }) => {
  const icons = {
    success: <CheckCircleIcon className="h-6 w-6 text-white" />,
    error: <XCircleIcon className="h-6 w-6 text-white" />,
    info: <InformationCircleIcon className="h-6 w-6 text-white" />,
  };

  const bgColors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
  };

  const [exiting, setExiting] = useState(false);

  const handleDismiss = () => {
    setExiting(true);
    setTimeout(onDismiss, 300);
  };
  
  return (
    <div
      style={{ animation: exiting ? 'fade-out-right 0.3s forwards' : 'fade-in-right 0.3s forwards' }}
      className={`flex items-center p-4 rounded-lg shadow-lg text-white ${bgColors[type]}`}
    >
      <div className="flex-shrink-0">{icons[type]}</div>
      <div className="ml-3 flex-1 font-medium">{message}</div>
      <button onClick={handleDismiss} className="ml-4 -mr-2 p-1 rounded-md hover:bg-white/20 focus:outline-none">
        <XMarkIcon className="h-5 w-5 text-white" />
      </button>
    </div>
  );
};