
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDDrKgO9gixnRgoNyrpT7Gx4_cUQY0n3Qg",
  authDomain: "prioaigirl.firebaseapp.com",
  projectId: "prioaigirl",
  storageBucket: "prioaigirl.firebasestorage.app",
  messagingSenderId: "768117763391",
  appId: "1:768117763391:web:5f4e87186c66ec537a778a",
  measurementId: "G-91237MC7R3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const analytics = getAnalytics(app);
