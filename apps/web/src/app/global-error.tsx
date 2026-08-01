/**
 * Global Error (falha catastrófica do root layout)
 *
 * Renderizado pelo Next quando o próprio root layout/providers falham.
 * Por isso é AUTOSSUFICIENTE: renderiza <html>/<body> próprios, estilos inline
 * e o símbolo da marca em SVG inline com cores fixas — NÃO depende de
 * Tailwind, do barrel `@/components`, do tema (CSS vars) nem de context.
 *
 * CUSTOMIZAR POR CLIENTE: a paleta hex abaixo é fixa de propósito (não pode
 * depender do tema) — ao trocar a cor primária da marca por projeto-filho,
 * atualize também aqui (e em `views/Setup.tsx`), não só no Tailwind.
 */

"use client";

import React, { useEffect } from "react";
import { APP_NAME } from "@/environments";


export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "20px",
          padding: "24px",
          background:
            "linear-gradient(135deg, #f4f5fb 0%, #ffffff 50%, #f4f5fb 100%)",
          color: "#293056",
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          textAlign: "center",
        }}
      >
        {/* Mark da marca inline (mesmo visual do AppBrandMark, cores fixas) */}
        <div
          role="img"
          aria-label={APP_NAME}
          style={{
            width: "72px",
            height: "72px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "14px",
            background: "#4f46e5",
            boxShadow: "0 8px 24px rgba(79,70,229,0.25)",
          }}
        >
          {/* Símbolo ⌘ (lucide "command") */}
          <svg
            viewBox="0 0 24 24"
            width="40"
            height="40"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
          </svg>
        </div>

        <h1 style={{ fontSize: "22px", fontWeight: 600, margin: 0 }}>
          Erro inesperado
        </h1>
        <p
          style={{
            margin: 0,
            maxWidth: "420px",
            lineHeight: 1.6,
            color: "#5b6178",
          }}
        >
          Encontramos um problema ao carregar a aplicação. Tente recarregar.
        </p>

        <button
          type="button"
          onClick={() => reset()}
          style={{
            cursor: "pointer",
            border: "none",
            borderRadius: "10px",
            padding: "12px 24px",
            fontSize: "14px",
            fontWeight: 700,
            color: "#ffffff",
            background: "#4f46e5",
            boxShadow: "0 2px 8px rgba(79,70,229,0.25)",
          }}
        >
          Recarregar
        </button>
      </body>
    </html>
  );
}
