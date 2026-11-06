import {
  collection, addDoc, getDoc, getDocs, doc,
  updateDoc, deleteDoc, query, where, serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';

// ── Validate card ID format (KC-XXXXX) ───────────────────────────
export const isValidCardId = (cardId) => {
  return /^KC-\d{4,6}$/i.test(cardId?.trim());
};

// ── Get card by cardId — only checks ASSIGNED cards ──────────────
// If not found in assigned cards but format is valid → still gets discount
export const getCardByCardId = async (cardId) => {
  const upper = cardId?.trim().toUpperCase();
  if (!isValidCardId(upper)) return null;
  // Check if it's an assigned card (has customer info)
  const q = query(collection(db, 'loyaltyCards'), where('cardId', '==', upper));
  const snap = await getDocs(q);
  if (!snap.empty) {
    return { id: snap.docs[0].id, ...snap.docs[0].data() };
  }
  // Not assigned yet but valid format — return a virtual card object
  return {
    id: null,
    cardId: upper,
    active: true,
    isVirtual: true, // not yet assigned to a customer
  };
};

// ── Assign card to customer (admin assigns a card ID to a person) ─
export const assignCard = async (cardId, userName, phone) => {
  const upper = cardId.trim().toUpperCase();
  // Check if already assigned
  const q = query(collection(db, 'loyaltyCards'), where('cardId', '==', upper));
  const snap = await getDocs(q);
  if (!snap.empty) {
    // Update existing
    await updateDoc(doc(db, 'loyaltyCards', snap.docs[0].id), {
      userName, phone, updatedAt: serverTimestamp(),
    });
    return { id: snap.docs[0].id, cardId: upper, userName, phone };
  }
  // Create new assigned card
  const ref = await addDoc(collection(db, 'loyaltyCards'), {
    cardId: upper,
    userName,
    phone,
    active: true,
    visits: 0,
    totalSpent: 0,
    createdAt: serverTimestamp(),
  });
  return { id: ref.id, cardId: upper, userName, phone };
};

// ── Get all ASSIGNED cards (admin view) ──────────────────────────
export const getAllCards = async () => {
  const snap = await getDocs(collection(db, 'loyaltyCards'));
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => {
      const numA = parseInt((a.cardId || '').replace('KC-', ''), 10) || 0;
      const numB = parseInt((b.cardId || '').replace('KC-', ''), 10) || 0;
      return numA - numB;
    });
};

// ── Toggle card active status ─────────────────────────────────────
export const toggleCard = async (cardDocId, active) => {
  await updateDoc(doc(db, 'loyaltyCards', cardDocId), { active });
};

// ── Delete a card assignment ──────────────────────────────────────
export const deleteCard = async (cardDocId) => {
  await deleteDoc(doc(db, 'loyaltyCards', cardDocId));
};

// ── Delete ALL cards (cleanup) ────────────────────────────────────
export const deleteAllCards = async () => {
  const snap = await getDocs(collection(db, 'loyaltyCards'));
  const batches = [];
  for (let i = 0; i < snap.docs.length; i += 50) {
    batches.push(Promise.all(snap.docs.slice(i, i + 50).map(d => deleteDoc(doc(db, 'loyaltyCards', d.id)))));
  }
  for (const b of batches) await b;
};

// ── Issue card to logged-in customer (self-service) ───────────────
export const issueCard = async (userId, userName, phone = '') => {
  const q = query(collection(db, 'loyaltyCards'), where('userId', '==', userId));
  const snap = await getDocs(q);
  if (!snap.empty) return { id: snap.docs[0].id, ...snap.docs[0].data() };
  const ref = await addDoc(collection(db, 'loyaltyCards'), {
    userId, userName, phone, active: true,
    visits: 0, totalSpent: 0,
    createdAt: serverTimestamp(),
  });
  return { id: ref.id, userId, userName, phone, visits: 0 };
};

// ── Get card by userId ────────────────────────────────────────────
export const getCardByUserId = async (userId) => {
  const q = query(collection(db, 'loyaltyCards'), where('userId', '==', userId));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
};

// ── Add visit after order ─────────────────────────────────────────
export const addVisitAndPoints = async (cardDocId, orderTotal) => {
  if (!cardDocId) return null;
  await updateDoc(doc(db, 'loyaltyCards', cardDocId), {
    visits: (await getDoc(doc(db, 'loyaltyCards', cardDocId))).data()?.visits + 1 || 1,
    totalSpent: (await getDoc(doc(db, 'loyaltyCards', cardDocId))).data()?.totalSpent + orderTotal || orderTotal,
    lastVisit: serverTimestamp(),
  });
};
