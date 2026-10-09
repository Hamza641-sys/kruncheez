import {
  collection, addDoc, updateDoc, doc, getDocs,
  query, where, orderBy, onSnapshot, serverTimestamp, getDoc, increment,
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
  const q = query(
    collection(db, 'orders'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

// ── Listen to Order (realtime) ───────────────────────────────────
export const listenToOrder = (orderId, callback) => {
  return onSnapshot(doc(db, 'orders', orderId), (snap) => {
    if (snap.exists()) callback({ id: snap.id, ...snap.data() });
  });
};

// ── Get All Orders (Admin) ───────────────────────────────────────
export const getAllOrders = (callback) => {
  const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
};

// ── Update Order Status (Admin) ──────────────────────────────────
export const updateOrderStatus = async (orderId, status) => {
  await updateDoc(doc(db, 'orders', orderId), {
    status,
    updatedAt: serverTimestamp(),
    [`timestamps.${status}`]: serverTimestamp(),
  });
};

// ── Get Order By ID ──────────────────────────────────────────────
export const getOrderById = async (orderId) => {
  const snap = await getDoc(doc(db, 'orders', orderId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};
