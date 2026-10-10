import {
  collection, addDoc, getDoc, getDocs, doc,
  updateDoc, query, where, serverTimestamp, increment
} from 'firebase/firestore';
import { db } from './config';

// Generate unique card ID
const generateCardId = () => {
  const num = Math.floor(10000 + Math.random() * 90000);
  return `KC-${num}`;
};

// Issue new loyalty card to customer
export const issueCard = async (userId, userName, phone = '') => {
  // Check if user already has a card
  const q = query(collection(db, 'loyaltyCards'), where('userId', '==', userId));
  const snap = await getDocs(q);
  if (!snap.empty) return { id: snap.docs[0].id, ...snap.docs[0].data() };

  const cardId = generateCardId();
  const ref = await addDoc(collection(db, 'loyaltyCards'), {
    cardId,
    userId,
    userName,
    phone,
    visits: 0,
    points: 0,
    totalVisits: 0,
    totalSaved: 0,
    discountPercent: 10,
    visitsForDiscount: 10,
    active: true,
    tier: 'Bronze',
    createdAt: serverTimestamp(),
    lastVisit: serverTimestamp(),
  });
  return { id: ref.id, cardId, visits: 0, points: 0 };
};

// Get card by userId
export const getCardByUserId = async (userId) => {
  const q = query(collection(db, 'loyaltyCards'), where('userId', '==', userId));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
};

// Get card by cardId (KC-XXXXX)
export const getCardByCardId = async (cardId) => {
  const q = query(collection(db, 'loyaltyCards'), where('cardId', '==', cardId.toUpperCase()));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
};

// Add visit + points after order
export const addVisitAndPoints = async (cardDocId, orderTotal) => {
  const cardRef = doc(db, 'loyaltyCards', cardDocId);
  const cardSnap = await getDoc(cardRef);
  if (!cardSnap.exists()) return null;

  const card = cardSnap.data();
  const pointsEarned = Math.floor(orderTotal / 10); // Rs.10 = 1 point
  const newVisits = (card.visits || 0) + 1;
  const newTotalVisits = (card.totalVisits || 0) + 1;

  // Check tier upgrade
  let tier = 'Bronze';
  if (newTotalVisits >= 50) tier = 'Gold';
  else if (newTotalVisits >= 20) tier = 'Silver';

  await updateDoc(cardRef, {
    visits: newVisits,
    totalVisits: newTotalVisits,
    points: increment(pointsEarned),
    tier,
    lastVisit: serverTimestamp(),
  });

  return { newVisits, pointsEarned, tier };
};

// Apply 10% discount (after 10 visits) — reset visit counter
export const applyCardDiscount = async (cardDocId, orderTotal) => {
  const cardRef = doc(db, 'loyaltyCards', cardDocId);
  const cardSnap = await getDoc(cardRef);
  if (!cardSnap.exists()) return null;

  const card = cardSnap.data();
  if (card.visits < card.visitsForDiscount) {
    return { eligible: false, remaining: card.visitsForDiscount - card.visits };
  }

  const discountAmount = Math.floor((orderTotal * card.discountPercent) / 100);

  // Reset visits counter
  await updateDoc(cardRef, {
    visits: 0,
    totalSaved: increment(discountAmount),
    lastVisit: serverTimestamp(),
  });

  return { eligible: true, discountAmount, discountPercent: card.discountPercent };
};

// Get all cards (Admin)
export const getAllCards = async () => {
  const snap = await getDocs(collection(db, 'loyaltyCards'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.totalVisits || 0) - (a.totalVisits || 0));
};

// Toggle card active status
export const toggleCard = async (cardDocId, active) => {
  await updateDoc(doc(db, 'loyaltyCards', cardDocId), { active });
};

// Manually add visit (Admin)
export const manualAddVisit = async (cardDocId) => {
  await updateDoc(doc(db, 'loyaltyCards', cardDocId), {
    visits: increment(1),
    totalVisits: increment(1),
    lastVisit: serverTimestamp(),
  });
};
