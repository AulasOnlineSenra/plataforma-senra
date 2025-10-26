'use client';
import {
  Auth, // Importa o tipo Auth para dicas de tipo
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  // Assume que getAuth e app são inicializados em outro lugar
} from 'firebase/auth';

/** Inicia o login anônimo (não bloqueante). */
export function initiateAnonymousSignIn(authInstance: Auth): void {
  // CRÍTICO: Chame signInAnonymously diretamente. NÃO use 'await signInAnonymously(...)'.
  signInAnonymously(authInstance);
  // O código continua imediatamente. A mudança de estado de autenticação é tratada pelo listener onAuthStateChanged.
}

/** Inicia o cadastro com email/senha (não bloqueante). */
export function initiateEmailSignUp(authInstance: Auth, email: string, password: string): void {
  // CRÍTICO: Chame createUserWithEmailAndPassword diretamente. NÃO use 'await createUserWithEmailAndPassword(...)'.
  createUserWithEmailAndPassword(authInstance, email, password);
  // O código continua imediatamente. A mudança de estado de autenticação é tratada pelo listener onAuthStateChanged.
}

/** Inicia o login com email/senha (não bloqueante). */
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string): void {
  // CRÍTICO: Chame signInWithEmailAndPassword diretamente. NÃO use 'await signInWithEmailAndPassword(...)'.
  signInWithEmailAndPassword(authInstance, email, password);
  // O código continua imediatamente. A mudança de estado de autenticação é tratada pelo listener onAuthStateChanged.
}
