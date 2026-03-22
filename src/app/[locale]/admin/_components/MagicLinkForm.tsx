"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { useState, useTransition } from "react";
import { adminLogin } from "@/actions/auth";
import { MagicLinkSent } from "./MagicLinkSent";

export function MagicLinkForm() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [generalError, setGeneralError] = useState("");
  const [sentEmail, setSentEmail] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const validateEmail = (value: string) => {
    if (!value) return "Email é obrigatório.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Email inválido.";
    return "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateEmail(email);
    if (err) {
      setEmailError(err);
      return;
    }
    setEmailError("");
    setGeneralError("");

    startTransition(async () => {
      const result = await adminLogin(email);
      if (result?.success) {
        setSentEmail(email);
      } else {
        setGeneralError(result?.error ?? "Erro ao enviar. Tente novamente.");
      }
    });
  };

  const handleResend = () => {
    setSentEmail(null);
    setGeneralError("");
  };

  if (sentEmail) {
    return <MagicLinkSent email={sentEmail} onResend={handleResend} />;
  }

  return (
    <div data-testid="magic-link-form-container" className="w-full max-w-sm p-6 sm:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Acesso ao Painel
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Insira seu email para receber um link de acesso.
        </p>
      </div>

      <form data-testid="magic-link-form" onSubmit={handleSubmit} noValidate>
        <div className="space-y-4">
          {/* General error alert */}
          {generalError && (
            <div
              data-testid="magic-link-form-error"
              role="alert"
              aria-live="polite"
              className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400"
            >
              ⚠ {generalError}
            </div>
          )}

          <Input
            label="Email"
            type="email"
            id="admin-email"
            data-testid="form-admin-email-input"
            autoFocus
            autoComplete="email"
            placeholder="admin@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailError) setEmailError(validateEmail(e.target.value));
            }}
            error={emailError}
            disabled={isPending}
            required
            className={cn("h-11 sm:h-10", isPending && "opacity-50")}
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={isPending}
            disabled={isPending}
            data-testid="form-admin-submit-button"
            className="w-full h-11 sm:h-10"
          >
            {isPending ? "Enviando..." : "Enviar link de acesso"}
          </Button>
        </div>
      </form>
    </div>
  );
}
