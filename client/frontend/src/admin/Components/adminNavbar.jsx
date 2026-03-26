import { Link, useLocation, useNavigate } from "react-router-dom";
import { BsBookshelf } from "react-icons/bs";
import { CiLogout } from "react-icons/ci";
import { useState } from "react";
import {
  HiBars3,
  HiOutlineBookOpen,
  HiOutlineCreditCard,
  HiOutlineHome,
  HiOutlineSparkles,
  HiOutlineStar,
  HiOutlineUsers,
  HiOutlineBell,
  HiXMark,
} from "react-icons/hi2";
import { useAdminAuth } from "../useAdminAuth";

const navLinks = [
  { to: "/admin/dashboard", icon: HiOutlineHome, label: "Dashboard" },
  { to: "/admin/books", icon: HiOutlineBookOpen, label: "Books" },
  { to: "/admin/users", icon: HiOutlineUsers, label: "Users" },
  { to: "/admin/reviews", icon: HiOutlineStar, label: "Reviews" },
  { to: "/admin/payments", icon: HiOutlineCreditCard, label: "Payments" },
  { to: "/admin/notifications", icon: HiOutlineBell, label: "Notifications" },
  { to: "/admin/algorithm", icon: HiOutlineSparkles, label: "Algorithm" },
];

const AdminNavbar = () => {
  const { admin, logoutAdmin } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logoutAdmin();
    navigate("/admin/login");
  };

  return (
    <>
      {/* Mobile top bar */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[#1a1a2e] text-white border-b border-white/10">
        <div className="h-16 px-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-lg shrink-0">
              <BsBookshelf />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-bold tracking-wide">Akshar Shelf</p>
              <p className="text-[11px] text-white/50">Admin</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/15 flex items-center justify-center"
            aria-label="Open menu"
          >
            <HiBars3 className="text-xl" />
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen ? (
        <div className="md:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute top-0 left-0 h-full w-72 max-w-[85vw] bg-[#1a1a2e] text-white flex flex-col shadow-2xl">
            <div className="px-4 h-16 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-lg shrink-0">
                  <BsBookshelf />
                </div>
                <div>
                  <p className="text-sm font-bold tracking-wide leading-none">Akshar Shelf</p>
                  <p className="text-xs text-white/40 mt-0.5">Admin Panel</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/15 flex items-center justify-center"
                aria-label="Close menu"
              >
                <HiXMark className="text-xl" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
              {navLinks.map(({ to, icon: Icon, label }) => {
                const isActive = location.pathname === to;
                return (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                      ${isActive ? "bg-white/15 text-white" : "text-white/60 hover:bg-white/10 hover:text-white"}`}
                  >
                    <Icon className="text-base shrink-0" />
                    {label}
                    {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />}
                  </Link>
                );
              })}
            </nav>

            <div className="px-3 py-4 border-t border-white/10 space-y-1">
              <div className="flex items-center gap-3 px-3 py-2">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold shrink-0">
                  {(admin?.username?.[0] || "A").toUpperCase()}
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-medium text-white truncate">{admin?.username || "Admin"}</p>
                  <p className="text-xs text-white/40">Administrator</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:bg-red-500/20 hover:text-red-300 transition-colors cursor-pointer"
              >
                <CiLogout className="text-xl text-white" />
                Logout
              </button>
            </div>
          </aside>
        </div>
      ) : null}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 h-screen sticky top-0 bg-[#1a1a2e] text-white flex-col shrink-0">
        <div className="px-5 py-6 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-lg shrink-0">
              <BsBookshelf />
            </div>
            <div>
              <p className="text-sm font-bold tracking-wide leading-none">Akshar Shelf</p>
              <p className="text-xs text-white/40 mt-0.5">Admin Panel</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navLinks.map(({ to, icon: Icon, label }) => {
            const isActive = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${isActive ? "bg-white/15 text-white" : "text-white/50 hover:bg-white/10 hover:text-white"}`}
              >
                <Icon className="text-base shrink-0" />
                {label}
                {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-white/10 space-y-1 shrink-0">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold shrink-0">
              {(admin?.username?.[0] || "A").toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{admin?.username || "Admin"}</p>
              <p className="text-xs text-white/40">Administrator</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/50 hover:bg-red-500/20 hover:text-red-400 transition-colors cursor-pointer"
          >
            <CiLogout className="text-xl text-white" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default AdminNavbar;
