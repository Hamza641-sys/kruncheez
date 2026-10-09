import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db } from './config';

// ── Register with Email ──────────────────────────────────────────
export const registerWithEmail = async (name, email, password, phone = '') => {
  const userCred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(userCred.user, { displayName: name });
  await createUserDocument(userCred.user, { name, phone });
  return userCred.user;
};

// ── Login with Email ─────────────────────────────────────────────
export const loginWithEmail = async (email, password) => {
  const userCred = await signInWithEmailAndPassword(auth, email, password);
  return userCred.user;
};

// ── Login with Google ────────────────────────────────────────────
export const loginWithGoogle = async () => {
  const userCred = await signInWithPopup(auth, googleProvider);
  await createUserDocument(userCred.user, {});
  return userCred.user;
};

// ── Logout ───────────────────────────────────────────────────────
export const logout = () => signOut(auth);

// ── Forgot Password ──────────────────────────────────────────────
export const resetPassword = (email) => sendPasswordResetEmail(auth, email);

// ── Create User Document in Firestore ───────────────────────────
export const createUserDocument = async (user, extraData) => {
  if (!user) return;
  const userRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      name: user.displayName || extraData.name || '',
      email: user.email,
      phone: extraData.phone || user.phoneNumber || '',
      photoURL: user.photoURL || '',
      role: 'customer',
      loyaltyPoints: 0,
      addresses: [],
      totalOrders: 0,
      totalSpent: 0,
      createdAt: serverTimestamp(),
    });
  }
  return userRef;
};

// ── Get User Data ────────────────────────────────────────────────
export const getUserData = async (uid) => {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
};

// ── Auth State Observer ──────────────────────────────────────────
export const onAuthChange = (callback) => onAuthStateChanged(auth, callback);
