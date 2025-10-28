// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getReactNativePersistence, setPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyAb8icpH4IFxVL-WoEAsjdeGH04m6iA2s4",
  authDomain: "elective-c8d20.firebaseapp.com",
  projectId: "elective-c8d20",
  storageBucket: "elective-c8d20.firebasestorage.app",
  messagingSenderId: "185216518681",
  appId: "1:185216518681:web:b7ca12f37073436a9bf888",
  measurementId: "G-ZD35TCTDK0"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

setPersistence(auth, getReactNativePersistence(AsyncStorage)).catch(() => {});