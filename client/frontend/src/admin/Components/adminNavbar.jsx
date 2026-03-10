import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BsBookshelf } from "react-icons/bs";
import { useAdminAuth } from '../useAdminAuth';

const navLinks = [
  { to: '/admin/dashboard', icon: '🏠', label: 'Dashboard' },
  { to: '/admin/books',     icon: '📚', label: 'Books'     },
  { to: '/admin/users',     icon: '👥', label: 'Users'     },
];

const AdminNavbar = () => {
  const { admin, logoutAdmin } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logoutAdmin();
    navigate('/admin/login');
  };

  return (
    // h-screen + sticky keeps sidebar locked to viewport height always
    <aside className="w-56 h-screen sticky top-0 bg-[#1a1a2e] text-white flex flex-col shrink-0">

      {/* ── Logo — fixed at top ─────────────────── */}
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

      {/* ── Nav Links — scrollable if links grow ── */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navLinks.map(({ to, icon, label }) => {
          const isActive = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${isActive
                  ? 'bg-white/15 text-white'
                  : 'text-white/50 hover:bg-white/10 hover:text-white'
                }`}
            >
              <span className="text-base">{icon}</span>
              {label}
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Admin Info + Logout — fixed at bottom ─ */}
      <div className="px-3 py-4 border-t border-white/10 space-y-1 shrink-0">

        {/* Admin info — no background */}
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold shrink-0">
            {(admin?.username?.[0] || 'A').toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-white truncate">
              {admin?.username || 'Admin'}
            </p>
            <p className="text-xs text-white/40">Administrator</p>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/50 hover:bg-red-500/20 hover:text-red-400 transition-colors cursor-pointer"
        >
          <span>🚪</span>
          Logout
        </button>

      </div>
    </aside>
  );
};

export default AdminNavbar;
