
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAX6jsr09DvnrbI4t5VzSVAaiNcD9Y_UfA",
  authDomain: "priogf-62f90.firebaseapp.com",
  projectId: "priogf-62f90",
  storageBucket: "priogf-62f90.firebasestorage.app",
  messagingSenderId: "1008093452181",
  appId: "1:1008093452181:web:abf05251b5053678b9c89c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Enable services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
