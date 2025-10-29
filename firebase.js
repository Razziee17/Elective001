// firebase.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import {
  browserLocalPersistence,
  getAuth,
  getReactNativePersistence,
  initializeAuth,
  setPersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAb8icpH4IFxVL-WoEAsjdeGH04m6iA2s4",
  authDomain: "elective-c8d20.firebaseapp.com",
  projectId: "elective-c8d20",
  storageBucket: "elective-c8d20.firebasestorage.app",
  messagingSenderId: "185216518681",
  appId: "1:185216518681:web:b7ca12f37073436a9bf888",
  measurementId: "G-ZD35TCTDK0",
};

// ✅ Use single Firebase app
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// --- AUTH ---
let auth;
if (typeof window === "undefined") {
  // 📱 React Native
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} else {
  // 🖥️ Web
  auth = getAuth(app);
  setPersistence(auth, browserLocalPersistence).catch(console.error);
}

// --- FIRESTORE & STORAGE ---
export const db = getFirestore(app);
export const storage = getStorage(app);
export { auth };

