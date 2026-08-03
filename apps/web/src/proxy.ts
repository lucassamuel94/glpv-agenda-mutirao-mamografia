import { NextRequest, NextResponse } from "next/server";
import { BASE_URL } from "@/environments";

/**
 * Gate de autenticação no EDGE, antes do servidor devolver qualquer HTML/JS
 * de rota protegida. Sem isso, `RequireAuth` (client-side, em
 * `(protected)/layout.tsx`) era a ÚNICA proteção: o servidor sempre
 * respondia a página inteira antes de qualquer checagem, e um visitante não
 * autenticado baixava o bundle completo (estrutura de rotas, nomes de
 * campos) antes do redirect.
 *
 * Só checa a PRESENÇA do cookie httpOnly `auth-token` — não valida
 * assinatura/hash (isso exigiria o JWT_SECRET aqui ou uma chamada ao
 * backend a cada request, custo que não vale a pena no edge). Autorização
 * de verdade continua sendo o backend em toda chamada de API; isto é só a
 * primeira barreira, pra não servir a UI inteira a quem não tem sessão
 * nenhuma. `RequireAuth` continua sendo a camada rica (loading, troca de
 * organização, força troca de senha).
 *
 * Sem sessão, consulta `GET /auth/setup-status` ANTES de decidir o destino
 * (`/login` vs `/setup`) — é o que evita o flash visível de "/login" seguido
 * de redirect client-side para "/setup" no primeiro acesso (sem organização
 * cadastrada). Falha de rede aqui cai em `/login`, o destino mais seguro.
 */
const PUBLIC_PATHS = ["/login", "/setup"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const hasSession = request.cookies.has("auth-token");
  if (!hasSession) {
    let setupRequired = false;
    try {
      const res = await fetch(`${BASE_URL}/auth/setup-status`, {
        signal: AbortSignal.timeout(2000),
        cache: "no-store",
      });
      if (res.ok) {
        const data = (await res.json()) as { setupRequired?: boolean };
        setupRequired = Boolean(data.setupRequired);
      }
    } catch {
      // Backend inacessível — segue para /login (destino seguro por padrão).
    }
    // `no-store` no redirect em si: sem isso, o browser pode cachear a
    // resposta 307 e parar de bater no proxy nas próximas visitas — o
    // sintoma seria "sempre cai em /login", mesmo depois do backend
    // responder setupRequired corretamente.
    const redirect = NextResponse.redirect(
      new URL(setupRequired ? "/setup" : "/login", request.url),
    );
    redirect.headers.set("Cache-Control", "no-store");
    return redirect;
  }

  return NextResponse.next();
}

export const config = {
  // `icon.svg`: favicon real do projeto (convenção App Router, ver
  // CLAUDE.md §2.3) — sem excluir aqui, todo primeiro load sem sessão batia
  // no gate, ganhava um 307 pra `/login` (HTML) no lugar do SVG, e o
  // browser não conseguia renderizar o favicon.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg).*)"],
};
