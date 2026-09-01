import React from 'react';
import { ToastMessage } from '../types';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      <AnimatePresence>
        {toasts.map((toast) => {
          const isError = toast.type === 'error';
          const isSuccess = toast.type === 'success';

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
              className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl border shadow-lg backdrop-blur-md transition-all ${
                isError
                  ? 'bg-white border-rose-200 text-rose-900 shadow-rose-500/10'
                  : isSuccess
                  ? 'bg-white border-emerald-200 text-emerald-950 shadow-emerald-500/10'
                  : 'bg-white border-slate-200 text-slate-900 shadow-slate-500/10'
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {isError && <AlertCircle className="w-4 h-4 text-rose-600" />}
                {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                {!isError && !isSuccess && <Info className="w-4 h-4 text-indigo-600" />}
              </div>

              <div className="flex-1 text-xs leading-relaxed font-semibold">
                {toast.message}
              </div>

              <button
                onClick={() => onDismiss(toast.id)}
                className="shrink-0 text-slate-400 hover:text-slate-700 p-0.5 rounded transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
