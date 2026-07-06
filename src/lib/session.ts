import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

// Chave secreta lida do .env — NUNCA hardcoded
const SECRET_KEY = process.env.SESSION_SECRET;
if (!SECRET_KEY) {
  throw new Error("SESSION_SECRET não definida nas variáveis de ambiente.");
}

const encodedKey = new TextEncoder().encode(SECRET_KEY);

const COOKIE_NAME = "senra_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 dias

export type SessionPayload = {
  userId: string;
  role: string;
};

// ─── Criar e assinar o JWT ───────────────────────────────────────────────────
export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(encodedKey);
}

// ─── Verificar e ler o JWT ───────────────────────────────────────────────────
export async function verifySession(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, encodedKey, {
      algorithms: ["HS256"],
    });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

// ─── Escrever cookie no servidor ─────────────────────────────────────────────
export async function setSessionCookie(payload: SessionPayload): Promise<void> {
  const token = await signSession(payload);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: false, // Temporariamente false enquanto o SSL não é ativado
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

// ─── Ler sessão do cookie atual ───────────────────────────────────────────────
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

// ─── Destruir sessão (logout) ─────────────────────────────────────────────────
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
