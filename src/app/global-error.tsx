"use client";

import { useEffect } from "react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Fallback de logging sem dependências externas
    console.error("[GlobalError]", error.message, error.digest);
    // TODO (F11): window.Sentry?.captureException(error);
  }, [error]);

  return (
    // html e body são OBRIGATÓRIOS no global-error (substitui o RootLayout)
    <html lang="pt-BR">
      <body
        style={{
          fontFamily: "system-ui, -apple-system, sans-serif",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          margin: 0,
          padding: "1rem",
          textAlign: "center",
          backgroundColor: "#f9fafb",
          color: "#111827",
        }}
      >
        <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>⚡</div>

        <h1
          style={{
            fontSize: "1.5rem",
            fontWeight: 700,
            marginBottom: "0.75rem",
          }}
        >
          Budget Free Engine — Erro Crítico
        </h1>

        <p
          style={{
            fontSize: "1rem",
            color: "#6b7280",
            maxWidth: "400px",
            marginBottom: "2rem",
          }}
        >
          Ocorreu um erro inesperado no sistema. Por favor, tente novamente.
        </p>

        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <button
            onClick={reset}
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: "#2563eb",
              color: "#ffffff",
              border: "none",
              borderRadius: "0.5rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
            aria-label="Tentar novamente"
          >
            Tentar novamente
          </button>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/"
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: "#ffffff",
              color: "#374151",
              border: "1px solid #d1d5db",
              borderRadius: "0.5rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
            }}
          >
            Voltar ao início
          </a>
        </div>

        {error.digest && (
          <p
            style={{
              marginTop: "2rem",
              fontSize: "0.75rem",
              color: "#9ca3af",
              fontFamily: "monospace",
            }}
          >
            Error ID: {error.digest}
          </p>
        )}
      </body>
    </html>
  );
}
