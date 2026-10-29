import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthChange, getUserData, logout } from '../firebase/authService';
import { getFirestore, doc, updateDoc, serverTimestamp, onSnapshot, collection, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';

const AuthContext = createContext();

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [onlineStaff, setOnlineStaff] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const data = await getUserData(firebaseUser.uid);
        setUserData(data);

        // Set online status if admin/manager
        if (data?.isAdmin || data?.role === 'admin' || data?.role === 'manager') {
          try {
            await updateDoc(doc(db, 'users', firebaseUser.uid), {
              onlineStatus: true,
              lastSeen: serverTimestamp(),
            });
          } catch {}

          // Set offline on tab close
          window.addEventListener('beforeunload', async () => {
            try {
              await updateDoc(doc(db, 'users', firebaseUser.uid), {
                onlineStatus: false,
                lastSeen: serverTimestamp(),
              });
            } catch {}
          });
        }
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Listen for online admin/manager users
  useEffect(() => {
    const q = query(collection(db, 'users'), where('isAdmin', '==', true));
    const unsub = onSnapshot(q, (snap) => {
      setOnlineStaff(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(u => u.onlineStatus));
    });
    return () => unsub();
  }, []);

  const handleLogout = async () => {
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          onlineStatus: false,
          lastSeen: serverTimestamp(),
        });
      } catch {}
    }
    await logout();
  };

  const refreshUserData = async () => {
    if (user) {
      const data = await getUserData(user.uid);
      setUserData(data);
    }
  };

  const isAdmin = userData?.isAdmin === true || userData?.role === 'admin' || userData?.role === 'manager';
  const isCustomer = userData?.role === 'customer';

  return (
    <AuthContext.Provider value={{
      user,
      userData,
      loading,
      isAdmin,
      isCustomer,
      logout: handleLogout,
      refreshUserData,
      onlineStaff,
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
