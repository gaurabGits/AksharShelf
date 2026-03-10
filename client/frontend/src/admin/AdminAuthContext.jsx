import { useState, useMemo } from 'react';
import { AdminAuthContext } from './adminAuthContextStore';

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(() => {
    const storedAdmin = localStorage.getItem('adminInfo');
    if (!storedAdmin) return null;
    try {
      return JSON.parse(storedAdmin);
    } catch {
      localStorage.removeItem('adminInfo');
      localStorage.removeItem('adminToken');
      return null;
    }
  });

  const loginAdmin = (adminData) => {
    if (!adminData?.token) {
      throw new Error("Admin data must include a token");
    }
    localStorage.setItem('adminToken', adminData.token);
    localStorage.setItem('adminInfo', JSON.stringify(adminData));
    setAdmin(adminData);
  };

  const logoutAdmin = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminInfo');
    setAdmin(null);
  };

  const value = useMemo(() => ({ admin, loginAdmin, logoutAdmin }), [admin]);

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};
