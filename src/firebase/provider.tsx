'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener'

interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}

// Estado interno para autenticação do usuário
interface UserAuthState {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// Estado combinado para o contexto do Firebase
export interface FirebaseContextState {
  areServicesAvailable: boolean; // Verdadeiro se os serviços principais (app, firestore, instância de auth) forem fornecidos
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null; // A instância do serviço Auth
  // Estado de autenticação do usuário
  user: User | null;
  isUserLoading: boolean; // Verdadeiro durante a verificação inicial de autenticação
  userError: Error | null; // Erro do listener de autenticação
}

// Tipo de retorno para useFirebase()
export interface FirebaseServicesAndUser {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// Tipo de retorno para useUser() - específico para o estado de autenticação do usuário
export interface UserHookResult { // Renomeado de UserAuthHookResult para consistência, se desejado, ou mantenha como UserAuthHookResult
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// Contexto React
export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

/**
 * FirebaseProvider gerencia e fornece serviços Firebase e estado de autenticação do usuário.
 */
export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
}) => {
  const [userAuthState, setUserAuthState] = useState<UserAuthState>({
    user: null,
    isUserLoading: true, // Começa carregando até o primeiro evento de autenticação
    userError: null,
  });

  // Efeito para se inscrever nas mudanças de estado de autenticação do Firebase
  useEffect(() => {
    if (!auth) { // Se não houver instância do serviço Auth, não é possível determinar o estado do usuário
      setUserAuthState({ user: null, isUserLoading: false, userError: new Error("Serviço de autenticação não fornecido.") });
      return;
    }

    setUserAuthState({ user: null, isUserLoading: true, userError: null }); // Redefinir na mudança da instância de autenticação

    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => { // Estado de autenticação determinado
        setUserAuthState({ user: firebaseUser, isUserLoading: false, userError: null });
      },
      (error) => { // Erro do listener de autenticação
        console.error("FirebaseProvider: erro em onAuthStateChanged:", error);
        setUserAuthState({ user: null, isUserLoading: false, userError: error });
      }
    );
    return () => unsubscribe(); // Limpeza
  }, [auth]); // Depende da instância de autenticação

  // Memoizar o valor do contexto
  const contextValue = useMemo((): FirebaseContextState => {
    const servicesAvailable = !!(firebaseApp && firestore && auth);
    return {
      areServicesAvailable: servicesAvailable,
      firebaseApp: servicesAvailable ? firebaseApp : null,
      firestore: servicesAvailable ? firestore : null,
      auth: servicesAvailable ? auth : null,
      user: userAuthState.user,
      isUserLoading: userAuthState.isUserLoading,
      userError: userAuthState.userError,
    };
  }, [firebaseApp, firestore, auth, userAuthState]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

/**
 * Hook para acessar os serviços principais do Firebase и o estado de autenticação do usuário.
 * Lança um erro se os serviços principais не estiverem disponíveis ou se for usado fora do provedor.
 */
export const useFirebase = (): FirebaseServicesAndUser => {
  const context = useContext(FirebaseContext);

  if (context === undefined) {
    throw new Error('useFirebase deve ser usado dentro de um FirebaseProvider.');
  }

  if (!context.areServicesAvailable || !context.firebaseApp || !context.firestore || !context.auth) {
    throw new Error('Serviços principais do Firebase não disponíveis. Verifique as props do FirebaseProvider.');
  }

  return {
    firebaseApp: context.firebaseApp,
    firestore: context.firestore,
    auth: context.auth,
    user: context.user,
    isUserLoading: context.isUserLoading,
    userError: context.userError,
  };
};

/** Hook para acessar a instância do Firebase Auth. */
export const useAuth = (): Auth => {
  const { auth } = useFirebase();
  return auth;
};

/** Hook para acessar a instância do Firestore. */
export const useFirestore = (): Firestore => {
  const { firestore } = useFirebase();
  return firestore;
};

/** Hook para acessar a instância do Firebase App. */
export const useFirebaseApp = (): FirebaseApp => {
  const { firebaseApp } = useFirebase();
  return firebaseApp;
};

type MemoFirebase <T> = T & {__memo?: boolean};

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T | (MemoFirebase<T>) {
  const memoized = useMemo(factory, deps);
  
  if(typeof memoized !== 'object' || memoized === null) return memoized;
  (memoized as MemoFirebase<T>).__memo = true;
  
  return memoized;
}

/**
 * Hook específico para acessar o estado do usuário autenticado.
 * Isso fornece o objeto User, o status de carregamento e quaisquer erros de autenticação.
 * @returns {UserHookResult} Objeto com user, isUserLoading, userError.
 */
export const useUser = (): UserHookResult => { // Renomeado de useAuthUser
  const { user, isUserLoading, userError } = useFirebase(); // Aproveita o hook principal
  return { user, isUserLoading, userError };
};
