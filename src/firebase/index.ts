'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'

// IMPORTANTE: NÃO MODIFIQUE ESTA FUNÇÃO
export function initializeFirebase() {
  if (!getApps().length) {
    // Importante! initializeApp() é chamada sem argumentos porque o Firebase App Hosting
    // se integra com a função initializeApp() para fornecer as variáveis de ambiente necessárias para
    // preencher o FirebaseOptions em produção. É crítico que tentemos chamar initializeApp()
    // sem argumentos.
    let firebaseApp;
    try {
      // Tenta inicializar via variáveis de ambiente do Firebase App Hosting
      firebaseApp = initializeApp();
    } catch (e) {
      // Apenas avisa em produção porque é normal usar o firebaseConfig para inicializar
      // durante o desenvolvimento
      if (process.env.NODE_ENV === "production") {
        console.warn('A inicialização automática falhou. Recorrendo ao objeto de configuração do firebase.', e);
      }
      firebaseApp = initializeApp(firebaseConfig);
    }

    return getSdks(firebaseApp);
  }

  // Se já estiver inicializado, retorna os SDKs com o App já inicializado
  return getSdks(getApp());
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
