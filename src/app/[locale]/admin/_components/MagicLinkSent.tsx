"use client";

import { Button } from "@/components/ui/Button";
import { adminLogin } from "@/actions/auth";
import { useState, useTransition, useEffect } from "react";

interface MagicLinkSentProps {
  email: string;
  onResend: () => void;
}

const RESEND_COOLDOWN = 60;

export function MagicLinkSent({ email, onResend }: MagicLinkSentProps) {
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((c) => c - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleResend = () => {
    startTransition(async () => {
      await adminLogin(email);
      setCountdown(RESEND_COOLDOWN);
      onResend();
    });
  };

  return (
    <div
      data-testid="magic-link-sent"
      className="w-full max-w-sm p-6 sm:p-8 text-center"
      aria-labelledby="magic-link-sent-title"
    >
      <div className="text-5xl mb-4" aria-hidden="true">
        ✉️
      </div>

      <h1
        id="magic-link-sent-title"
        className="text-xl font-bold text-gray-900 dark:text-white"
      >
        Link enviado!
      </h1>

      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        Enviamos um link para{" "}
        <strong className="text-gray-900 dark:text-white">{email}</strong>.
      </p>

      <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-300">
        💡 Verifique sua caixa de entrada e spam. O link expira em 10 minutos.
      </div>

      <div className="mt-6">
        {countdown > 0 ? (
          <p
            data-testid="magic-link-sent-countdown"
            aria-live="polite"
            className="text-sm text-gray-500 dark:text-gray-400"
          >
            Próximo reenvio em {countdown}s
          </p>
        ) : (
          <Button
            variant="outline"
            size="md"
            onClick={handleResend}
            loading={isPending}
            data-testid="magic-link-resend-button"
            className="w-full"
          >
            Reenviar link
          </Button>
        )}
      </div>
    </div>
  );
}
