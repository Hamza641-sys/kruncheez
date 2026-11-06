import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthChange, getUserData, logout } from '../firebase/authService';
import { doc, updateDoc, serverTimestamp, onSnapshot, collection, query, where } from 'firebase/firestore';
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
    let cleanupFn = null;

    const unsubscribe = onAuthChange(async (firebaseUser) => {
      // Remove previous beforeunload listener if any
      if (cleanupFn) { cleanupFn(); cleanupFn = null; }

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

          // Set offline on tab close using Beacon API to Firestore REST
          const uid = firebaseUser.uid;
          const handleUnload = () => {
            try {
              // Use fetch keepalive — works in modern browsers on unload
              fetch(
                `https://firestore.googleapis.com/v1/projects/kruncheez-pos/databases/(default)/documents/users/${uid}?updateMask.fieldPaths=onlineStatus&updateMask.fieldPaths=lastSeen`,
                {
                  method: 'PATCH',
                  keepalive: true,
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    fields: {
                      onlineStatus: { booleanValue: false },
                    }
                  })
                }
              ).catch(() => {});
            } catch {}
          };

          window.addEventListener('beforeunload', handleUnload);
          cleanupFn = () => window.removeEventListener('beforeunload', handleUnload);
        }
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      if (cleanupFn) cleanupFn();
    };
  }, []);

  // Listen for online admin/manager users
  useEffect(() => {
    // Query users where isAdmin is true (both admin + manager have isAdmin: true)
    const q = query(
      collection(db, 'users'),
      where('isAdmin', '==', true),
      where('onlineStatus', '==', true)
    );
    const unsub = onSnapshot(q, (snap) => {
      setOnlineStaff(snap.docs.map(d => ({ id: d.id, ...d.data() })));
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


