import React from "react";
import type { Metadata } from "next";
import "./globals.css";
import { SWRProvider } from "@/components/SWRProvider";
import { GlobalErrorHandlers } from "@/components/GlobalErrorHandlers";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { AuthProvider } from "@/hooks/use-auth";
import { SocketProvider } from "@/contexts/socket-context";
import { Toaster } from "sonner";
import { APP_TITLE, APP_DESCRIPTION, BASE_URL } from "@/environments";

/**
 * O título vem do nome da organização criada em /setup, não do `.env`: num
 * template whitelabel o `.env` é preenchido antes de existir cliente, então
 * `NEXT_PUBLIC_APP_NAME` fica com o nome do projeto e a aba nunca acompanha o
 * que o usuário digitou no setup. `/auth/branding` é público (mesmo endpoint
 * que já alimenta cor e logo pré-login) e cai no fallback do `.env` se o
 * backend estiver fora do ar ou ainda não houver organização.
 */
export async function generateMetadata(): Promise<Metadata> {
  let organizationName: string | undefined;
  try {
    const response = await fetch(`${BASE_URL}/auth/branding`, {
      // Revalidação por tempo em vez de no-store: sem isto o layout raiz vira
      // dinâmico e TODA página do app perde renderização estática.
      next: { revalidate: 300 },
    });
    if (response.ok) {
      organizationName = (await response.json())?.organizationName;
    }
  } catch {
    // backend fora do ar (dev, build) — fallback do .env abaixo
  }

  return {
    title: organizationName ?? APP_TITLE,
    description: APP_DESCRIPTION,
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* Executa durante o parsing do documento, antes da primeira pintura. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof window === 'undefined') return;
                try {
                  // Initialize theme
                  const isLogin = window.location.pathname === '/login';
                  const loginTheme = localStorage.getItem('app_login_theme');
                  const storedUser = isLogin ? null : localStorage.getItem('app_user');
                  const userTheme = storedUser ? JSON.parse(storedUser).theme : null;
                  const preferredTheme = isLogin
                    ? (loginTheme === 'light' || loginTheme === 'dark' ? loginTheme : null)
                    : userTheme;
                  if (preferredTheme === 'light' || preferredTheme === 'dark') {
                    const root = document.documentElement;
                    root.classList.remove('dark');
                    if (preferredTheme === 'dark') {
                      root.classList.add('dark');
                    }
                  } else {
                    // Fallback to system preference
                    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                      document.documentElement.classList.add('dark');
                    }
                  }
                  
                  // Initialize tenant colors (whitelabel) — evita flash da cor padrão
                  // antes do React montar (AuthProvider aplica de novo via @/lib/branding).
                  const stored = localStorage.getItem('app_tenant');
                  if (stored) {
                    const tenant = JSON.parse(stored);
                    if (tenant.primaryColor && /^#[0-9a-fA-F]{6}$/.test(tenant.primaryColor)) {
                      document.documentElement.style.setProperty('--color-primary', tenant.primaryColor);
                      document.documentElement.style.setProperty('--color-primary-dark', tenant.primaryColor);
                      var hex = tenant.primaryColor;
                      var r = parseInt(hex.slice(1, 3), 16) / 255;
                      var g = parseInt(hex.slice(3, 5), 16) / 255;
                      var b = parseInt(hex.slice(5, 7), 16) / 255;
                      var max = Math.max(r, g, b), min = Math.min(r, g, b);
                      var l = (max + min) / 2, h = 0, s = 0;
                      if (max !== min) {
                        var d = max - min;
                        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                        if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
                        else if (max === g) h = (b - r) / d + 2;
                        else h = (r - g) / d + 4;
                        h /= 6;
                      }
                      document.documentElement.style.setProperty(
                        '--primary',
                        Math.round(h * 360) + ' ' + Math.round(s * 100) + '% ' + Math.round(l * 100) + '%'
                      );
                    }
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="font-sans">
        <GlobalErrorHandlers />
        <ThemeProvider>
          <AuthProvider>
            <SocketProvider>
              <SWRProvider>{children}</SWRProvider>
            </SocketProvider>
          </AuthProvider>
        </ThemeProvider>
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
