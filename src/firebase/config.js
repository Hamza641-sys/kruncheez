import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyC0dgHGMjbWeurlKAGNBakp3R-Eg8EIx7Y",
  authDomain: "kruncheez-pos.firebaseapp.com",
  projectId: "kruncheez-pos",
  storageBucket: "kruncheez-pos.firebasestorage.app",
  messagingSenderId: "328549789635",
  appId: "1:328549789635:web:5e3470128cecbcc7a5d776",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export default app;
