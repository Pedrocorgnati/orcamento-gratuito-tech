"use client"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { adminLogin, type AdminLoginResult } from "@/actions/auth"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { cn } from "@/lib/utils"
import { MagicLinkSent } from "./MagicLinkSent"

type FormStatus = "idle" | "pending" | "sent" | "error"

export function MagicLinkForm({ className }: { className?: string }) {
  const t = useTranslations("admin")
  const tErrors = useTranslations("errors")
  const [status, setStatus] = useState<FormStatus>("idle")
  const [submittedEmail, setSubmittedEmail] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [isPending, startTransition] = useTransition()

  const handleSubmit = async (formData: FormData) => {
    const email = formData.get("email") as string
    setSubmittedEmail(email)
    setFieldErrors({})
    setErrorMessage("")

    startTransition(async () => {
      const result: AdminLoginResult = await adminLogin(formData)

      if (!result.success) {
        if (result.error === "rate_limit_exceeded") {
          setErrorMessage(tErrors("rateLimitExceeded", { seconds: "60" }))
          setStatus("error")
        } else if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors)
          setStatus("idle")
        } else if (result.error === "email_send_failed") {
          setErrorMessage(tErrors("generic"))
          setStatus("error")
        } else {
          setErrorMessage(tErrors("generic"))
          setStatus("error")
        }
        return
      }

      setStatus("sent")
    })
  }

  // Se o link foi enviado, mostrar tela de confirmacao
  if (status === "sent") {
    return (
      <MagicLinkSent
        email={submittedEmail}
        onResend={async () => {
          const formData = new FormData()
          formData.set("email", submittedEmail)
          setStatus("pending")
          const result = await adminLogin(formData)
          if (result.success) {
            setStatus("sent")
          } else {
            setErrorMessage(tErrors("generic"))
            setStatus("error")
          }
        }}
      />
    )
  }

  return (
    <div
      data-testid="magic-link-form-container"
      className={cn("w-full max-w-sm p-6 sm:p-8", className)}
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t("loginTitle")}
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          {t("loginSubtitle")}
        </p>
      </div>

      <form data-testid="magic-link-form" action={handleSubmit} noValidate>
        <div className="space-y-4">
          {/* General error alert */}
          {status === "error" && errorMessage && (
            <div
              data-testid="magic-link-form-error"
              role="alert"
              aria-live="polite"
              className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400"
            >
              {errorMessage}
            </div>
          )}

          <Input
            label={t("emailLabel")}
            type="email"
            id="admin-email"
            name="email"
            data-testid="form-admin-email-input"
            autoFocus
            autoComplete="email"
            placeholder={t("emailPlaceholder")}
            error={fieldErrors.email?.[0]}
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
            aria-busy={isPending}
            className="h-11 w-full sm:h-10"
          >
            {isPending ? t("sending") : t("sendMagicLink")}
          </Button>
        </div>
      </form>
    </div>
  )
}
