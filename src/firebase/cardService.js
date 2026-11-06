import {
  collection, addDoc, getDocs, doc,
  updateDoc, deleteDoc, query, where, serverTimestamp, writeBatch,
} from 'firebase/firestore';
import { db } from './config';

// ── Format ID ─────────────────────────────────────────────────────
export const formatCardId = (num) => `KC-${String(num).padStart(5, '0')}`;

// ── Validate format KC-XXXXX ──────────────────────────────────────
export const isValidCardId = (id) => /^KC-\d{4,6}$/i.test(id?.trim());

// ── Get card by ID — check if it exists in generated list ─────────
export const getCardByCardId = async (cardId) => {
  const upper = cardId?.trim().toUpperCase();
  if (!isValidCardId(upper)) return null;
  const q = query(collection(db, 'loyaltyCards'), where('cardId', '==', upper));
  const snap = await getDocs(q);
  if (snap.empty) return null; // not generated = not valid
  const data = snap.docs[0].data();
  if (data.active === false) return { ...data, id: snap.docs[0].id, active: false };
  return { id: snap.docs[0].id, ...data };
};

// ── Generate IDs (batch) — save to Firestore ──────────────────────
export const generateCardIds = async (startNum, count, onProgress) => {
  const BATCH_SIZE = 100; // Firestore batch limit is 500, use 100 for safety
  for (let b = 0; b < count; b += BATCH_SIZE) {
    const batch = writeBatch(db);
    const end = Math.min(b + BATCH_SIZE, count);
    for (let i = b; i < end; i++) {
      const cardId = formatCardId(startNum + i);
      const ref = doc(collection(db, 'loyaltyCards'));
      batch.set(ref, {
        cardId,
        userName: '',
        phone: '',
        active: true,
        createdAt: serverTimestamp(),
      });
    }
    await batch.commit();
    if (onProgress) onProgress(Math.min(b + BATCH_SIZE, count));
  }
};

// ── Get next card number ──────────────────────────────────────────
export const getNextCardNumber = async () => {
  const snap = await getDocs(collection(db, 'loyaltyCards'));
  let max = 0;
  snap.docs.forEach(d => {
    const m = (d.data().cardId || '').match(/^KC-(\d+)$/i);
    if (m) { const n = parseInt(m[1], 10); if (n > max) max = n; }
  });
  return max + 1;
};

// ── Update card customer info ─────────────────────────────────────
export const updateCardCustomer = async (cardDocId, userName, phone) => {
  await updateDoc(doc(db, 'loyaltyCards', cardDocId), { userName, phone });
};

// ── Toggle active ─────────────────────────────────────────────────
export const toggleCard = async (cardDocId, active) => {
  await updateDoc(doc(db, 'loyaltyCards', cardDocId), { active });
};

// ── Delete single card ────────────────────────────────────────────
export const deleteCard = async (cardDocId) => {
  await deleteDoc(doc(db, 'loyaltyCards', cardDocId));
};

// ── Delete ALL cards ──────────────────────────────────────────────
export const deleteAllCards = async () => {
  const snap = await getDocs(collection(db, 'loyaltyCards'));
  for (let i = 0; i < snap.docs.length; i += 100) {
    const batch = writeBatch(db);
    snap.docs.slice(i, i + 100).forEach(d => batch.delete(d.ref));
    await batch.commit();
  }
};

// ── Get all cards ─────────────────────────────────────────────────
export const getAllCards = async () => {
  const snap = await getDocs(collection(db, 'loyaltyCards'));
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => {
      const na = parseInt((a.cardId || '').replace('KC-', ''), 10) || 0;
      const nb = parseInt((b.cardId || '').replace('KC-', ''), 10) || 0;
      return na - nb;
    });
};

// ── Legacy: issue card to user ────────────────────────────────────
export const issueCard = async (userId, userName, phone = '') => {
  const q = query(collection(db, 'loyaltyCards'), where('userId', '==', userId));
  const snap = await getDocs(q);
  if (!snap.empty) return { id: snap.docs[0].id, ...snap.docs[0].data() };
  const ref = await addDoc(collection(db, 'loyaltyCards'), {
    userId, userName, phone, active: true, createdAt: serverTimestamp(),
  });
  return { id: ref.id, userId, userName, phone };
};

export const getCardByUserId = async (userId) => {
  const q = query(collection(db, 'loyaltyCards'), where('userId', '==', userId));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
};

export const addVisitAndPoints = async () => null;
