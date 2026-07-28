"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Check, X, AlertCircle, Info } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  exiting?: boolean;
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
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const addToast = useCallback((toast: Toast) => {
    const newToast = { ...toast, exiting: false };
    setToasts((prev) => [...prev, newToast]);

    const timer = setTimeout(() => {
      removeToast(toast.id);
    }, 4000);
    timersRef.current.set(toast.id, timer);
  }, []);

  useEffect(() => {
    toastListeners.push(addToast);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== addToast);
    };
  }, [addToast]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)),
    );

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 250);

    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 sm:bottom-6 sm:right-6">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-md
            ${toast.exiting ? "toast-exit" : "toast-enter"}
            ${toast.type === "success"
              ? "border-green-200/80 bg-green-50/95 text-green-800"
              : toast.type === "error"
                ? "border-red-200/80 bg-red-50/95 text-red-800"
                : "border-zinc-200/80 bg-white/95 text-zinc-800"
            }
          `}
        >
          <div className={`flex h-6 w-6 items-center justify-center rounded-full ${
            toast.type === "success"
              ? "bg-green-100"
              : toast.type === "error"
                ? "bg-red-100"
                : "bg-zinc-100"
          }`}>
            {toast.type === "success" && <Check className="h-3.5 w-3.5 text-green-600" />}
            {toast.type === "error" && <AlertCircle className="h-3.5 w-3.5 text-red-600" />}
            {toast.type === "info" && <Info className="h-3.5 w-3.5 text-zinc-600" />}
          </div>
          <span className="text-sm font-medium">{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="ml-auto flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg opacity-50 transition-all duration-150 hover:bg-zinc-200/50 hover:opacity-100"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
