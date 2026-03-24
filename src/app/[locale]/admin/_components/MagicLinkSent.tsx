"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/Button"

const RESEND_COOLDOWN_SECONDS = 60

interface MagicLinkSentProps {
  email: string
  onResend: () => Promise<void>
  className?: string
}

export function MagicLinkSent({
  email,
  onResend,
  className,
}: MagicLinkSentProps) {
  const t = useTranslations("admin")
  const tErrors = useTranslations("errors")
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN_SECONDS)
  const [isResending, setIsResending] = useState(false)
  const [resendStatus, setResendStatus] = useState<
    "idle" | "success" | "error"
  >("idle")
  const resendButtonRef = useRef<HTMLButtonElement>(null)
  const statusRef = useRef<HTMLDivElement>(null)

  const canResend = countdown === 0 && !isResending

  // Countdown automatico
  useEffect(() => {
    if (countdown <= 0) return

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [countdown])

  const handleResend = useCallback(async () => {
    if (!canResend) return

    setIsResending(true)
    setResendStatus("idle")

    try {
      await onResend()
      setResendStatus("success")
      setCountdown(RESEND_COOLDOWN_SECONDS)
      setTimeout(() => statusRef.current?.focus(), 150)
    } catch {
      setResendStatus("error")
      setTimeout(() => resendButtonRef.current?.focus(), 150)
    } finally {
      setIsResending(false)
    }
  }, [canResend, onResend])

  return (
    <div
      data-testid="magic-link-sent"
      className={`w-full max-w-sm p-6 text-center sm:p-8 ${className ?? ""}`}
      role="region"
      aria-labelledby="magic-link-sent-title"
    >
      {/* Icone de email enviado */}
      <div className="mb-4 text-5xl" aria-hidden="true">
        &#x2709;&#xFE0F;
      </div>

      {/* Titulo */}
      <h1
        id="magic-link-sent-title"
        className="text-xl font-bold text-gray-900 dark:text-white"
      >
        {t("linkSentTitle")}
      </h1>

      {/* Mensagem com email */}
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        {t("linkSentMessage", { email })
          .split(email)
          .map((part, i, arr) =>
            i < arr.length - 1 ? (
              <span key={i}>
                {part}
                <strong className="font-semibold text-gray-900 dark:text-white">
                  {email}
                </strong>
              </span>
            ) : (
              <span key={i}>{part}</span>
            )
          )}
      </p>

      {/* Instrucoes */}
      <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-left text-sm text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-300">
        <span aria-hidden="true">&#x1F4A1; </span>
        {t("checkInboxMessage")}
      </div>

      {/* Status de reenvio — aria-live para leitores de tela */}
      <div
        ref={statusRef}
        aria-live="polite"
        aria-atomic="true"
        tabIndex={-1}
        className="mt-4 min-h-[1.5rem] focus:outline-none"
      >
        {resendStatus === "success" && (
          <p className="text-sm text-green-600 dark:text-green-400">
            {t("resendSuccess")}
          </p>
        )}
        {resendStatus === "error" && (
          <p
            className="text-sm text-red-600 dark:text-red-400"
            role="alert"
          >
            {tErrors("generic")}
          </p>
        )}
        {countdown > 0 && resendStatus === "idle" && (
          <p
            data-testid="magic-link-sent-countdown"
            className="text-xs text-gray-500 dark:text-gray-400"
          >
            {t("resendIn", { seconds: String(countdown) })}
          </p>
        )}
      </div>

      {/* Botao de reenvio */}
      <div className="mt-4">
        <Button
          ref={resendButtonRef}
          variant="outline"
          size="md"
          onClick={handleResend}
          disabled={!canResend}
          loading={isResending}
          aria-disabled={!canResend}
          aria-busy={isResending}
          aria-label={
            canResend
              ? t("resendLink")
              : t("resendIn", { seconds: String(countdown) })
          }
          data-testid="magic-link-resend-button"
          className="w-full"
        >
          {isResending
            ? t("sending")
            : canResend
              ? t("resendLink")
              : t("resendIn", { seconds: String(countdown) })}
        </Button>
      </div>
    </div>
  )
}
