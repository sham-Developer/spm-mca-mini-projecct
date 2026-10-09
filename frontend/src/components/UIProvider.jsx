import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const UIContext = createContext(null);

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};

export default function UIProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [confirmConfig, setConfirmConfig] = useState(null);

  // Toast System
  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto-remove after 3.5s
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Custom Confirmation System
  const confirmAction = useCallback((param1, param2, param3) => {
    let title = '';
    let message = '';
    let onConfirm = () => {};

    if (param1 && typeof param1 === 'object') {
      title = param1.title || '';
      message = param1.message || '';
      onConfirm = param1.onConfirm || (() => {});
    } else {
      title = param1 || '';
      message = param2 || '';
      onConfirm = param3 || (() => {});
    }

    setConfirmConfig({
      title,
      message,
      onConfirm: () => {
        if (typeof onConfirm === 'function') {
          onConfirm();
        }
        setConfirmConfig(null);
      }
    });
  }, []);

  return (
    <UIContext.Provider value={{ showToast, confirmAction }}>
      {children}

      {/* GLOBAL TOAST FLOATING PANEL */}
      <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 bg-white border rounded-xl shadow-lg animate-fade-in transition-all duration-300 ${
              toast.type === 'success' 
                ? 'border-emerald-500 bg-emerald-50/50' 
                : toast.type === 'error' 
                ? 'border-red-500 bg-red-50/50' 
                : 'border-slate-400 bg-slate-50'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {toast.type === 'success' && <CheckCircle size={18} className="text-emerald-700" />}
              {toast.type === 'error' && <AlertCircle size={18} className="text-red-700" />}
              {toast.type === 'info' && <Info size={18} className="text-blue-700" />}
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-medium text-slate-950 leading-snug">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 text-slate-900 hover:text-black hover:bg-slate-100 p-0.5 rounded transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* CUSTOM CONFIRMATION MODAL */}
      {confirmConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-slate-400 rounded-xl p-6 space-y-6 shadow-2xl animate-fade-in">
            <div className="flex items-start gap-3">
              <div className="shrink-0 mt-0.5 p-2 bg-slate-100 border border-slate-300 rounded-lg text-slate-900">
                <AlertCircle size={20} className="stroke-[2.5]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-[18px] font-bold text-slate-950 tracking-tight">{confirmConfig.title}</h3>
                <p className="text-[13px] text-slate-900 font-medium leading-relaxed">{confirmConfig.message}</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmConfig(null)}
                className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-900 rounded-xl text-[13px] font-medium border border-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmConfig.onConfirm}
                className="px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-[13px] font-semibold shadow-md cursor-pointer transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </UIContext.Provider>
  );
}
