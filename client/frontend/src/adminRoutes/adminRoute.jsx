import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '../admin/useAdminAuth';

const AdminRoutes = ({ children }) => {
  const { admin } = useAdminAuth();
  return admin ? children : <Navigate to="/admin/login" replace />;
};

export default AdminRoutes;
