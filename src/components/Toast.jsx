import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    if (duration > 0) {
      setTimeout(() => removeToast(id), duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const icons = {
    success: <CheckCircle size={20} style={{ color: 'var(--success)', flexShrink: 0 }} />,
    error:   <AlertCircle size={20} style={{ color: 'var(--danger)', flexShrink: 0 }} />,
    warning: <AlertTriangle size={20} style={{ color: 'var(--warning)', flexShrink: 0 }} />,
    info:    <Info size={20} style={{ color: 'var(--primary)', flexShrink: 0 }} />,
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="toast-container no-print">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast-card ${toast.type}`}>
            {icons[toast.type] || icons.info}
            <p style={{ flex: 1, margin: 0, fontWeight: 600, fontSize: '0.9rem' }}>
              {toast.message}
            </p>
            <button
              onClick={() => removeToast(toast.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', display: 'flex', padding: '2px' }}
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
