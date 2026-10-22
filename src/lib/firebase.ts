import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

export const firebaseConfig = {
  apiKey: "AIzaSyAT7ZQsAL2a_JoyJx-Aw4CjrlFd2GmOfMc",
  authDomain: "cccuts-eccaa.firebaseapp.com",
  projectId: "cccuts-eccaa",
  storageBucket: "cccuts-eccaa.firebasestorage.app",
  messagingSenderId: "228632809525",
  appId: "1:228632809525:web:0fc20666d87098bc98e17c",
  measurementId: "G-LXKQJY74XM"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app);
export default app;
