"use client";

import { Toaster, toast as sonnerToast, type ExternalToast } from "sonner";

function ToastProvider() {
  return (
    <Toaster
      position="bottom-right"
      richColors
      closeButton
      duration={4000}
      visibleToasts={3}
      toastOptions={{
        classNames: {
          toast: "font-[var(--font-inter)]",
          title: "text-sm font-medium",
          description: "text-xs",
          closeButton: "text-gray-400 hover:text-gray-600",
        },
      }}
    />
  );
}

type ToastMessage = string | React.ReactNode;
type ToastOptions = ExternalToast;

const toast = {
  success(message: ToastMessage, options?: ToastOptions) {
    return sonnerToast.success(message, options);
  },

  error(message: ToastMessage, options?: ToastOptions) {
    return sonnerToast.error(message, { duration: 6000, ...options });
  },

  warning(message: ToastMessage, options?: ToastOptions) {
    return sonnerToast.warning(message, options);
  },

  info(message: ToastMessage, options?: ToastOptions) {
    return sonnerToast.info(message, options);
  },

  loading(message: ToastMessage, options?: ToastOptions) {
    return sonnerToast.loading(message, options);
  },

  dismiss(toastId?: string | number) {
    sonnerToast.dismiss(toastId);
  },

  promise<T>(
    promise: Promise<T> | (() => Promise<T>),
    opts: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: unknown) => string);
    }
  ) {
    return sonnerToast.promise(promise, opts);
  },
};

function useToast() {
  return toast;
}

export { ToastProvider, toast, useToast };
