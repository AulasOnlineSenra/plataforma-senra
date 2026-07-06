import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/session";

// Rotas que NÃO precisam de autenticação
const PUBLIC_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/home",
  "/blog",
  "/contato",
  "/politica-de-privacidade",
  "/termos-de-uso",
  "/",
];

// Prefixos de API que são públicos
const PUBLIC_API_PREFIXES = [
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/session",
  "/api/send-lead",
  "/api/analytics",
  "/api/cron",           // cronjobs externos
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Arquivos estáticos e Next.js internals: sempre passam
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/public") ||
    pathname.match(/\.(png|jpg|jpeg|svg|ico|webp|css|js|woff|woff2|ttf)$/)
  ) {
    return NextResponse.next();
  }

  // Rotas públicas: passam sem verificação
  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );
  const isPublicApi = PUBLIC_API_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (isPublicRoute || isPublicApi) {
    return NextResponse.next();
  }

  // Rotas protegidas: verificar o cookie
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/manager") || pathname.startsWith("/api/")) {
    const token = request.cookies.get("senra_session")?.value;

    if (!token) {
      // Sem cookie → redireciona para login
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const session = await verifySession(token);
    if (!session) {
      // Cookie inválido ou expirado → redireciona para login
      const loginUrl = new URL("/login", request.url);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete("senra_session");
      return response;
    }

    // Sessão válida: permite passar e injeta header para Server Actions lerem
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-session-user-id", session.userId);
    requestHeaders.set("x-session-role", session.role);

    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  return NextResponse.next();
}

export const config = {
  // Aplica o middleware a todas as rotas (exceto _next e estáticos)
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
