
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAZyT49sNTu-1XDzdsA-1eTesAw0T1KlEs",
  authDomain: "prio-dea67.firebaseapp.com",
  projectId: "prio-dea67",
  storageBucket: "prio-dea67.firebasestorage.app",
  messagingSenderId: "694055128131",
  appId: "1:694055128131:web:32558941fdf5cc3f0498f6",
  measurementId: "G-FKFRGFN17G"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);
