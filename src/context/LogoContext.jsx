import { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';

const LogoContext = createContext({ logoUrl: '' });

export const useLogo = () => useContext(LogoContext);

export const LogoProvider = ({ children }) => {
  const [logoUrl, setLogoUrl] = useState('');

  useEffect(() => {
    // Real-time listener — logo changes instantly everywhere
    const unsub = onSnapshot(doc(db, 'appSettings', 'restaurant'), (snap) => {
      if (snap.exists()) {
        setLogoUrl(snap.data()?.logoUrl || '');
      }
    }, () => {});
    return () => unsub();
  }, []);

  return (
    <LogoContext.Provider value={{ logoUrl }}>
      {children}
    </LogoContext.Provider>
  );
};
