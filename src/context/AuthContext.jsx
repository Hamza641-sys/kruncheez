import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthChange, getUserData, logout } from '../firebase/authService';

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

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const data = await getUserData(firebaseUser.uid);
        setUserData(data);
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const refreshUserData = async () => {
    if (user) {
      const data = await getUserData(user.uid);
      setUserData(data);
    }
  };

  const isAdmin = userData?.role === 'admin';
  const isCustomer = userData?.role === 'customer';

  return (
    <AuthContext.Provider value={{
      user,
      userData,
      loading,
      isAdmin,
      isCustomer,
      logout,
      refreshUserData,
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
