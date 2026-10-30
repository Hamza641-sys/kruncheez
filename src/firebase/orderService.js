import {
  collection, addDoc, updateDoc, doc, getDocs,
  query, where, onSnapshot, serverTimestamp, getDoc, increment,
} from 'firebase/firestore';
import { db } from './config';

// ── Place Order ──────────────────────────────────────────────────
export const placeOrder = async (orderData) => {
  const ref = await addDoc(collection(db, 'orders'), {
    ...orderData,
    status: 'pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Add loyalty points to user (1 point per Rs.10)
  if (orderData.userId) {
    const points = Math.floor(orderData.summary.total / 10);
    await updateDoc(doc(db, 'users', orderData.userId), {
      loyaltyPoints: increment(points),
      totalOrders: increment(1),
      totalSpent: increment(orderData.summary.total),
    });
  }
  return ref.id;
};

// ── Get Customer Orders ──────────────────────────────────────────
export const getCustomerOrders = async (userId) => {
  const q = query(collection(db, 'orders'), where('userId', '==', userId));
  const snap = await getDocs(q);
  const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return data.sort((a, b) => (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0));
};

// ── Listen to Order (realtime) ───────────────────────────────────
export const listenToOrder = (orderId, callback) => {
  return onSnapshot(doc(db, 'orders', orderId), (snap) => {
    if (snap.exists()) callback({ id: snap.id, ...snap.data() });
  });
};

// ── Get All Orders (Admin) ───────────────────────────────────────
export const getAllOrders = (callback) => {
  const q = query(collection(db, 'orders'));
  return onSnapshot(q, (snap) => {
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    data.sort((a, b) => (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0));
    callback(data);
  });
};

// ── Update Order Status (Admin) ──────────────────────────────────
export const updateOrderStatus = async (orderId, status, extraData = {}) => {
  await updateDoc(doc(db, 'orders', orderId), {
    status,
    ...extraData,
    updatedAt: serverTimestamp(),
    [`timestamps.${status}`]: serverTimestamp(),
  });
};

// ── Get Order By ID ──────────────────────────────────────────────
export const getOrderById = async (orderId) => {
  const snap = await getDoc(doc(db, 'orders', orderId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};
