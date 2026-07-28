"use client";

import { useEffect, useState, useCallback } from "react";
import { Check, X, AlertCircle, Info } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

let toastListeners: Array<(toast: Toast) => void> = [];
let toastIdCounter = 0;

export function showToast(message: string, type: ToastType = "success") {
  const toast: Toast = {
    id: `toast-${++toastIdCounter}`,
    message,
    type,
  };
  toastListeners.forEach((listener) => listener(toast));
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Toast) => {
    setToasts((prev) => [...prev, toast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toast.id));
    }, 4000);
  }, []);

  useEffect(() => {
    toastListeners.push(addToast);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== addToast);
    };
  }, [addToast]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm transition-all duration-300 animate-in slide-in-from-right ${
            toast.type === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : toast.type === "error"
                ? "border-red-200 bg-red-50 text-red-800"
                : "border-zinc-200 bg-white text-zinc-800"
          }`}
        >
          {toast.type === "success" && <Check className="h-4 w-4 flex-shrink-0 text-green-500" />}
          {toast.type === "error" && <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-500" />}
          {toast.type === "info" && <Info className="h-4 w-4 flex-shrink-0 text-zinc-500" />}
          <span className="text-sm font-medium">{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="ml-2 flex-shrink-0 rounded-md p-1 opacity-60 hover:opacity-100 transition-opacity"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
