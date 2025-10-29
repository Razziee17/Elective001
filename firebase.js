// firebase.js
import { getApps, initializeApp } from "firebase/app";
import {
  browserLocalPersistence,
  getAuth,
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

// Prevent multiple inits
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

// 🔥 Platform-aware persistence setup
if (typeof window !== "undefined") {
  // 🖥️ Web
  setPersistence(auth, browserLocalPersistence).catch(console.error);
} else {
  // 📱 React Native – import dynamically to avoid breaking web build
  (async () => {
    const { getReactNativePersistence } = await import("firebase/auth");
    const AsyncStorage = (await import("@react-native-async-storage/async-storage")).default;
    setPersistence(auth, getReactNativePersistence(AsyncStorage)).catch(console.error);
  })();
}