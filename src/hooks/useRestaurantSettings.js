import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';

const DEFAULT = {
  restaurantName: 'The KrunchEez',
  address: 'New Officers Housing Society, Northern Bypass, Dalazak Road, Peshawar',
  phone1: '0317-7787648',
  phone2: '0308-4509090',
  phone3: '0335-6609178',
  openTime: '11:00',
  closeTime: '02:00',
  deliveryFee: '100',
  minOrder: '200',
  acceptingOrders: true,
};

// Returns live restaurant settings from Firestore (appSettings/restaurant)
export const useRestaurantSettings = () => {
  const [settings, setSettings] = useState(DEFAULT);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'appSettings', 'restaurant'), (snap) => {
      if (snap.exists()) {
        setSettings({ ...DEFAULT, ...snap.data() });
      }
    });
    return () => unsub();
  }, []);

  return settings;
};

export { DEFAULT as DEFAULT_SETTINGS };
