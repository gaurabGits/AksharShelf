import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { routes } from "./routes/AppRoutes";
import Layout from "./components/layout/Layout";
import AdminRoutes from "./adminRoutes/adminRoute";
import AdminLogin from "./admin/pages/adimLogin";
import AdminDashboard from "./admin/pages/adminDashboard";
import AdminUser from "./admin/pages/adminUser";
import AdminBook from "./admin/pages/adminBook";
import AdminReview from "./admin/pages/adminReview";
import AdminAlgorithm from "./admin/pages/adminAlgorithm";
import AdminPayments from "./admin/pages/adminPayments";

function App() {
  const location = useLocation();
  const isAdminPath = String(location.pathname || "").startsWith("/admin");

  return (
    <div className={isAdminPath ? "w-full" : "max-w-7xl mx-auto"}>
      <Routes>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

        <Route
          path="/admin/dashboard"
          element={
            <AdminRoutes>
              <AdminDashboard />
            </AdminRoutes>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminRoutes>
              <AdminUser />
            </AdminRoutes>
          }
        />
        <Route
          path="/admin/books"
          element={
            <AdminRoutes>
              <AdminBook />
            </AdminRoutes>
          }
        />
        <Route
          path="/admin/reviews"
          element={
            <AdminRoutes>
              <AdminReview />
            </AdminRoutes>
          }
        />
        <Route
          path="/admin/payments"
          element={
            <AdminRoutes>
              <AdminPayments />
            </AdminRoutes>
          }
        />
        <Route
          path="/admin/algorithm"
          element={
            <AdminRoutes>
              <AdminAlgorithm />
            </AdminRoutes>
          }
        />

        <Route path="/" element={<Layout />}>
          {routes.map((route, index) => (
            <Route key={index} path={route.path} element={route.element} />
          ))}
        </Route>
      </Routes>
    </div>
  );
}

export default App;
