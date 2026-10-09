import { collection, query, where, getDocs, updateDoc, doc, increment } from 'firebase/firestore';
import { db } from './config';

export const validatePromoCode = async (code, orderTotal) => {
  const q = query(collection(db, 'promoCodes'), where('code', '==', code.toUpperCase()), where('active', '==', true));
  const snap = await getDocs(q);
  if (snap.empty) return { valid: false, message: 'Invalid promo code' };

  const promo = { id: snap.docs[0].id, ...snap.docs[0].data() };

  if (promo.expiryDate && new Date(promo.expiryDate) < new Date())
    return { valid: false, message: 'Promo code has expired' };

  if (promo.usedCount >= promo.maxUses)
    return { valid: false, message: 'Promo code usage limit reached' };

  if (promo.minOrder && orderTotal < promo.minOrder)
    return { valid: false, message: `Minimum order of Rs.${promo.minOrder} required` };

  const discount = promo.type === 'percent'
    ? Math.floor((orderTotal * promo.discount) / 100)
    : promo.discount;

  return { valid: true, promo, discount, message: `${promo.type === 'percent' ? promo.discount + '%' : 'Rs.' + promo.discount} discount applied!` };
};

export const usePromoCode = async (promoId) => {
  await updateDoc(doc(db, 'promoCodes', promoId), { usedCount: increment(1) });
};
