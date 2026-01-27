import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

// Configuração do Firebase
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyC32g6EsU5YFv_LxN3ApWzUImzLQyzK75E",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "willtech-a9bb6.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "willtech-a9bb6",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "willtech-a9bb6.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1026063664376",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1026063664376:web:be75063ef546d92d54a70d"
};

// Inicializar Firebase apenas uma vez
let app: FirebaseApp;
let db: Firestore;
let auth: Auth;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
} else {
  app = getApps()[0];
  db = getFirestore(app);
  auth = getAuth(app);
}

export { app, db, auth };
export default app;
