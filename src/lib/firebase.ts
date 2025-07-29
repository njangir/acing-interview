// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";


// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  projectId: "armed-forces-interview-ace",
  appId: "1:742450909840:web:bc667d403885a3c75c7e15",
  storageBucket: "armed-forces-interview-ace.firebasestorage.app",
  apiKey: "AIzaSyCJy25IhMVNfNvAcIfr05ccgohGjp9zV0w",
  authDomain: "armed-forces-interview-ace.firebaseapp.com",
  messagingSenderId: "742450909840",
};


// Initialize Firebase
// To avoid re-initializing on hot reloads, we check if an app is already initialized.
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app);
const googleProvider = new GoogleAuthProvider();


export { app, auth, db, storage, functions, googleProvider, RecaptchaVerifier, signInWithPhoneNumber };
