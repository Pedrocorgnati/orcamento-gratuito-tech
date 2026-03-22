"use client";

import { useEffect } from "react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html>
      <body
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          textAlign: "center",
          backgroundColor: "#f9fafb",
          color: "#111827",
          fontFamily: "system-ui, sans-serif",
          padding: "1rem",
        }}
      >
        <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>⚡</div>

        <h1
          style={{
            fontSize: "1.5rem",
            fontWeight: 700,
            marginBottom: "0.5rem",
          }}
        >
          Budget Free Engine — Erro Crítico
        </h1>

        <p
          style={{
            fontSize: "1rem",
            color: "#6b7280",
            maxWidth: "400px",
            marginBottom: "1.5rem",
          }}
        >
          Ocorreu um erro inesperado no sistema. Por favor, tente novamente.
        </p>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
          <button
            onClick={reset}
            style={{
              background: "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: "0.5rem",
              padding: "0.75rem 1.5rem",
              fontSize: "0.875rem",
              cursor: "pointer",
            }}
          >
            Tentar novamente
          </button>
          <a
            href="/"
            style={{
              background: "#fff",
              color: "#374151",
              border: "1px solid #d1d5db",
              borderRadius: "0.5rem",
              padding: "0.75rem 1.5rem",
              fontSize: "0.875rem",
              textDecoration: "none",
            }}
          >
            Voltar ao início
          </a>
        </div>

        {process.env.NODE_ENV === "development" && error.digest && (
          <p
            style={{
              marginTop: "1rem",
              fontSize: "0.75rem",
              fontFamily: "monospace",
              color: "#9ca3af",
            }}
          >
            Error ID: {error.digest}
          </p>
        )}
      </body>
    </html>
  );
}
