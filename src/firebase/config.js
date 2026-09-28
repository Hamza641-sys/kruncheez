import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Replace these values with your actual Firebase project config
// Get them from: Firebase Console → Project Settings → Your Apps → Web App
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export default app;
