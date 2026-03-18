import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  HiArrowLeft,
  HiOutlineEnvelope,
  HiOutlineLockClosed,
  HiOutlineUser,
  HiArrowRightOnRectangle,
  HiChevronDown,
  HiChevronUp,
  HiOutlineStar,
  HiStar,
  HiOutlineBookmark,
  HiOutlineChatBubbleLeftRight,
  HiOutlineShieldCheck,
  HiOutlineBookOpen,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineBookmarkSquare,
  HiOutlineTrash,
  HiOutlineCreditCard,
  HiExclamationTriangle,
  HiXMark,
} from "react-icons/hi2";
import { getAvatarGradient } from "../utils/avatarColor";
import API from "../services/api";
import { useNotification } from "../context/Notification";



function formatRelativeTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";
  const diffMs = Date.now() - date.getTime();
  if (diffMs <= 0) return "Just now";
  const s = Math.floor(diffMs / 1000);
  if (s < 60)  return "Just now";
  const m = Math.floor(s / 60);
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7)   return `${d}d ago`;
  const w = Math.floor(d / 7);
  if (w < 4)   return `${w}w ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(d / 365)}y ago`;
}

function StarDisplay({ value = 0 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) =>
        s <= value
          ? <HiStar key={s} className="text-amber-400 text-sm" />
          : <HiOutlineStar key={s} className="text-gray-300 dark:text-gray-600 text-sm" />
      )}
    </div>
  );
}

// Confirm Delete Modal
function ConfirmModal({ title, message, onConfirm, onCancel, loading }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
      onClick={onCancel}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xl max-w-sm w-full p-6 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 flex items-center justify-center shrink-0">
            <HiExclamationTriangle className="text-red-500 text-lg" />
          </div>
          <button
            onClick={onCancel}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors"
          >
            <HiXMark />
          </button>
        </div>

        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">{title}</h3>
          <p className="text-xs text-gray-400 mt-1 leading-relaxed">{message}</p>
        </div>

        <div className="h-px bg-gray-100 dark:bg-gray-800" />

        <div className="flex items-center gap-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-all disabled:opacity-50"
          >
            {loading
              ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <HiOutlineTrash className="text-base" />}
            {loading ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Nav items
const NAV_ITEMS = [
  { key: "profile",   label: "Profile",     icon: HiOutlineUser               },
  { key: "security",  label: "Security",    icon: HiOutlineShieldCheck        },
  { key: "activity",  label: "My Activity", icon: HiOutlineChatBubbleLeftRight },
  { key: "payments",  label: "Payments",    icon: HiOutlineCreditCard         },
  { key: "bookshelf", label: "Bookshelf",   icon: HiOutlineBookOpen           },
];

const normalizeTabKey = (value) => {
  const raw = String(value || "").trim();
  const valid = NAV_ITEMS.some((i) => i.key === raw);
  return valid ? raw : "profile";
};

// Shelf stat 
const SHELF_STATS = [
  {
    key:    "reading",
    label:  "Reading",
    icon:   HiOutlineClock,           
    color:  "text-indigo-600",
    bg:     "bg-indigo-50 dark:bg-indigo-950/40",
    border: "border-indigo-100 dark:border-indigo-900/60",
    bar:    "bg-indigo-500",
  },
  {
    key:    "completed",
    label:  "Completed",
    icon:   HiOutlineCheckCircle,
    color:  "text-emerald-600",
    bg:     "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-emerald-100 dark:border-emerald-900/60",
    bar:    "bg-emerald-500",
  },
  {
    key:    "planned",
    label:  "Plan to Read",
    icon:   HiOutlineBookmarkSquare,
    color:  "text-amber-600",
    bg:     "bg-amber-50 dark:bg-amber-950/40",
    border: "border-amber-100 dark:border-amber-900/60",
    bar:    "bg-amber-400",
  },
];

// Sidebar
function Sidebar({ user, color, initials, roleLabel, activeTab, setActiveTab, onLogout, shelfCounts }) {
  const total = shelfCounts.reading + shelfCounts.completed + shelfCounts.planned;

  return (
    <aside className="w-full md:w-64 shrink-0 flex flex-col gap-3">

      {/* Avatar card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5 flex flex-col items-center gap-3 text-center">
        <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center text-white text-2xl font-bold shadow-lg`}>
          {initials}
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900 dark:text-white leading-snug">{user.name ?? "User"}</p>
          <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[160px]">{user.email}</p>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/60">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400" />
          <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">{roleLabel}</span>
        </div>

        {/* Live stats from shelf counts */}
        <div className="w-full grid grid-cols-2 gap-2 pt-1">
          <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-2.5 text-center">
            <p className="text-base font-bold text-gray-900 dark:text-white">{shelfCounts.completed}</p>
            <p className="text-[10px] text-gray-400">Books Read</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-2.5 text-center">
            <p className="text-base font-bold text-gray-900 dark:text-white">{shelfCounts.reading + shelfCounts.planned}</p>
            <p className="text-[10px] text-gray-400">On Shelf</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-4 pt-4 pb-2">
          Settings
        </p>

        {NAV_ITEMS.map((item) => {
          const Icon   = item.icon;
          const active = activeTab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all border-l-2 ${
                active
                  ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400"
                  : "border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              <Icon className="text-base shrink-0" />
              {item.label}

              {/* Bookshelf tab: show count badge */}
              {item.key === "bookshelf" && total > 0 ? (
                <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  active
                    ? "bg-indigo-600/20 text-indigo-600 dark:text-indigo-400"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-500"
                }`}>
                  {total}
                </span>
              ) : active ? (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
              ) : null}
            </button>
          );
        })}

        <div className="h-px bg-gray-100 dark:bg-gray-800 mx-4 my-1" />
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 border-l-2 border-transparent hover:border-red-400 transition-all mb-1"
        >
          <HiArrowRightOnRectangle className="text-base shrink-0" />
          Logout
        </button>
      </nav>
    </aside>
  );
}

// Tab: Profile
function ProfileTab({ form, setForm, saving, onSave }) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-base font-bold text-gray-900 dark:text-white">Profile Information</h2>
        <p className="text-xs text-gray-400 mt-0.5">Update your name and email address.</p>
      </div>
      <div className="h-px bg-gray-100 dark:bg-gray-800" />

      <div className="flex flex-col gap-4">
        {[
          { key: "name",  label: "Full Name",     type: "text",  icon: HiOutlineUser,     placeholder: "Your full name" },
          { key: "email", label: "Email Address", type: "email", icon: HiOutlineEnvelope, placeholder: "your@email.com" },
        ].map(({ key, label, type, icon: Icon, placeholder }) => (
          <div key={key} className="flex flex-col gap-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <Icon className="text-sm" /> {label}
            </label>
            <input
              type={type}
              value={form[key]}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              placeholder={placeholder}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
            />
          </div>
        ))}
      </div>

      <div className="flex justify-end pt-1">
        <button
          onClick={onSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {saving && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

// Tab: Security
function SecurityTab({ pwdForm, setPwdForm, savingPwd, onSave }) {
  const [show, setShow] = useState(false);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-base font-bold text-gray-900 dark:text-white">Security</h2>
        <p className="text-xs text-gray-400 mt-0.5">Manage your password and account security.</p>
      </div>
      <div className="h-px bg-gray-100 dark:bg-gray-800" />

      <div className="bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        <button
          onClick={() => setShow((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          <span className="flex items-center gap-2">
            <HiOutlineLockClosed className="text-base" /> Change Password
          </span>
          {show ? <HiChevronUp className="text-base" /> : <HiChevronDown className="text-base" />}
        </button>

        {show && (
          <div className="px-4 pb-4 pt-4 flex flex-col gap-4 border-t border-gray-100 dark:border-gray-800">
            {[
              { field: "current",         label: "Current Password", placeholder: "Enter current password" },
              { field: "password",        label: "New Password",     placeholder: "At least 6 characters"  },
              { field: "confirmPassword", label: "Confirm Password", placeholder: "Repeat new password"    },
            ].map(({ field, label, placeholder }) => (
              <div key={field} className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {label}
                </label>
                <input
                  type="password"
                  value={pwdForm[field]}
                  onChange={(e) => setPwdForm((f) => ({ ...f, [field]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                />
              </div>
            ))}
            <div className="flex justify-end pt-1">
              <button
                onClick={onSave}
                disabled={savingPwd}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {savingPwd && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {savingPwd ? "Updating…" : "Update Password"}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-950/20 p-4 flex items-start gap-3">
        <HiOutlineShieldCheck className="text-emerald-500 text-xl shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Account is Secure</p>
          <p className="text-xs text-emerald-600/70 dark:text-emerald-500/70 mt-0.5">
            Your account is protected. Use a strong password and never share it.
          </p>
        </div>
      </div>
    </div>
  );
}

// Tab: Payments
function PaymentsTab() {
  const notify = useNotification();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [orders, setOrders] = useState([]);
  const [purchases, setPurchases] = useState([]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setError("");

        const [ordersRes, purchasesRes] = await Promise.all([
          API.get("/payments/me/orders?limit=15"),
          API.get("/payments/me/purchases?limit=15"),
        ]);

        if (!mounted) return;
        setOrders(Array.isArray(ordersRes.data?.orders) ? ordersRes.data.orders : []);
        setPurchases(Array.isArray(purchasesRes.data?.purchases) ? purchasesRes.data.purchases : []);
      } catch (err) {
        if (!mounted) return;
        const message = err.response?.data?.message || "Failed to load payments.";
        setError(message);
        notify.error("Payments", message);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [notify]);

  const statusBadge = (status) => {
    const s = String(status || "").toLowerCase();
    if (s === "paid") return "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800/40";
    if (s === "pending") return "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800/40";
    if (s === "failed") return "bg-red-50 text-red-700 border-red-100 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800/40";
    if (s === "expired") return "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800/50 dark:text-gray-300 dark:border-gray-700";
    return "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800/50 dark:text-gray-300 dark:border-gray-700";
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-base font-bold text-gray-900 dark:text-white">Payments</h2>
        <p className="text-xs text-gray-400 mt-0.5">Your purchases and recent payment orders.</p>
      </div>
      <div className="h-px bg-gray-100 dark:bg-gray-800" />

      {error ? (
        <div className="rounded-xl border border-red-100 dark:border-red-800/40 bg-red-50 dark:bg-red-950/20 p-4 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="py-10 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="px-4 py-3.5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <p className="text-sm font-bold text-gray-900 dark:text-white">Purchased books</p>
              <p className="text-[11px] text-gray-400">{purchases.length} shown</p>
            </div>

            <div className="p-3 space-y-2">
              {purchases.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <HiOutlineCreditCard className="text-4xl mx-auto mb-2 opacity-30" />
                  <p className="text-sm font-medium">No purchases yet.</p>
                  <p className="text-xs mt-1">Buy a paid book to unlock access.</p>
                </div>
              ) : (
                purchases.map((p) => (
                  <div
                    key={p.id}
                    className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-3 flex items-center gap-3"
                  >
                    <div className="w-10 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 overflow-hidden shrink-0">
                      {p.book?.coverImage ? (
                        <img
                          src={`http://localhost:3000${p.book.coverImage}`}
                          alt={p.book.title || "Book cover"}
                          className="w-full h-full object-cover"
                        />
                      ) : null}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {p.book?.title || "Book"}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Purchased {formatRelativeTime(p.purchasedAt)}
                      </p>
                    </div>

                    {p.book?.id ? (
                      <button
                        onClick={() => navigate(`/read/${p.book.id}`)}
                        className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors"
                      >
                        Read
                      </button>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="px-4 py-3.5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <p className="text-sm font-bold text-gray-900 dark:text-white">Recent orders</p>
              <p className="text-[11px] text-gray-400">{orders.length} shown</p>
            </div>

            <div className="p-3 space-y-2">
              {orders.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <HiOutlineCreditCard className="text-4xl mx-auto mb-2 opacity-30" />
                  <p className="text-sm font-medium">No orders yet.</p>
                  <p className="text-xs mt-1">Starting a checkout will create an order.</p>
                </div>
              ) : (
                orders.map((o) => (
                  <div
                    key={o.id}
                    className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {o.book?.title || "Order"}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Rs. {o.amount} - {formatRelativeTime(o.createdAt)}
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[10px] font-bold ${statusBadge(o.status)}`}>
                        {String(o.status || "").toUpperCase()}
                      </span>
                    </div>

                    {o.status === "pending" && o.book?.id ? (
                      <div className="pt-3 flex justify-end">
                        <button
                          onClick={() => navigate(`/purchase/${o.book.id}`)}
                          className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                          Continue checkout
                        </button>
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Tab: Activity
function ActivityTab({ activity, setActivity, loading, error }) {
  const notify = useNotification();

  const [confirm, setConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const openConfirm = (type, id, bookId, label) =>
    setConfirm({ type, id, bookId, label });

  const closeConfirm = () => { if (!deleting) setConfirm(null); };

  const handleDelete = async () => {
    if (!confirm) return;
    setDeleting(true);
    try {
      if (confirm.type === "review") {
        if (!confirm.bookId) {
          notify.error("Delete failed", "Missing book id for this review.");
          return;
        }
        await API.delete(`/books/${confirm.bookId}/reviews`);
        setActivity((prev) => ({
          ...prev,
          reviews: prev.reviews.filter((r) => r._id !== confirm.id),
        }));
        notify.success("Deleted", "Your review has been removed.");
      } else {
        if (!confirm.bookId) {
          notify.error("Remove failed", "Missing book id for this shelf item.");
          return;
        }
        await API.delete(`/bookshelf/${confirm.bookId}`);
        setActivity((prev) => ({
          ...prev,
          pins: prev.pins.filter((p) => p._id !== confirm.id),
        }));
        notify.success("Removed", "Book removed from your shelf.");
      }
      setConfirm(null);
    } catch (err) {
      notify.error("Delete failed", err.response?.data?.message || "Could not delete. Try again.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return (
    <div className="flex items-center gap-2 py-10 justify-center text-xs text-gray-400">
      <span className="w-4 h-4 border-2 border-gray-300 border-t-indigo-500 rounded-full animate-spin" />
      Loading activity…
    </div>
  );

  if (error) return <div className="py-10 text-center text-xs text-red-400">{error}</div>;

  return (
    <>
      {confirm && (
        <ConfirmModal
          title={confirm.type === "review" ? "Delete Review?" : "Remove from Shelf?"}
          message={
            confirm.type === "review"
              ? `This will permanently delete your review for "${confirm.label}". This cannot be undone.`
              : `This will remove "${confirm.label}" from your shelf. You can always re-add it later.`
          }
          onConfirm={handleDelete}
          onCancel={closeConfirm}
          loading={deleting}
        />
      )}

      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white">My Activity</h2>
          <p className="text-xs text-gray-400 mt-0.5">Your reviews, ratings and pinned books.</p>
        </div>

        <div className="h-px bg-gray-100 dark:bg-gray-800" />

        {/* Reviews */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <HiOutlineStar className="text-amber-400 text-base" />
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Ratings & Comments
            </p>
            <span className="ml-auto text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
              {activity.reviews.length}
            </span>
          </div>

          {activity.reviews.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <HiOutlineStar className="text-3xl mx-auto mb-2 opacity-30" />
              <p className="text-sm">No reviews yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activity.reviews.map((review) => (
                <div
                  key={review._id}
                  className="group flex gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 relative"
                >
                  <div className="w-12 h-16 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 shrink-0">
                    {review.book?.coverImage
                      ? <img src={review.book.coverImage} alt={review.book.title} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400">No Cover</div>}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1 pr-8">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {review.book?.title ?? "Unknown Book"}
                        </p>
                        <p className="text-[11px] text-gray-400">{review.book?.author ?? "Unknown Author"}</p>
                      </div>
                      {review.rating
                        ? <StarDisplay value={review.rating} />
                        : <span className="text-[11px] text-gray-400">No rating</span>}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{review.comment}</p>
                    <p className="text-[10px] text-gray-400">{formatRelativeTime(review.updatedAt ?? review.createdAt)}</p>
                  </div>

                  {/* Delete — reveals on hover */}
                  <button
                    onClick={() => openConfirm("review", review._id, review.book?._id, review.book?.title ?? "this book")}
                    title="Delete review"
                    className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 dark:text-gray-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <HiOutlineTrash className="text-sm" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="h-px bg-gray-100 dark:bg-gray-800" />

        {/* Pinned Books */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <HiOutlineBookmark className="text-indigo-500 text-base" />
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Pinned Books
            </p>
            <span className="ml-auto text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
              {activity.pins.length}
            </span>
          </div>

          {activity.pins.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <HiOutlineBookmark className="text-3xl mx-auto mb-2 opacity-30" />
              <p className="text-sm">No pinned books yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activity.pins.map((pin) => (
                <div
                  key={pin._id}
                  className="group flex gap-3 items-center p-3 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 relative"
                >
                  <div className="w-12 h-16 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 shrink-0">
                    {pin.book?.coverImage
                      ? <img src={pin.book.coverImage} alt={pin.book.title} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400">No Cover</div>}
                  </div>

                  <div className="flex-1 min-w-0 pr-8">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {pin.book?.title ?? "Unknown"}
                        </p>
                        <p className="text-[11px] text-gray-400">{pin.book?.author ?? "Unknown Author"}</p>
                      </div>
                      {pin.status && (
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize shrink-0 ${
                          pin.status === "completed" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400" :
                          pin.status === "reading"   ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400" :
                                                       "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"
                        }`}>
                          {pin.status}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {formatRelativeTime(pin.updatedAt ?? pin.createdAt)}
                    </p>
                  </div>

                  {/* Delete — reveals on hover */}
                  <button
                    onClick={() => openConfirm("pin", pin._id, pin.book?._id, pin.book?.title ?? "this book")}
                    title="Remove from shelf"
                    className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 dark:text-gray-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <HiOutlineTrash className="text-sm" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// Tab: Bookshelf
function BookshelfTab({ counts, loading }) {
  const navigate = useNavigate();
  const total    = counts.reading + counts.completed + counts.planned;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white">Bookshelf</h2>
          <p className="text-xs text-gray-400 mt-0.5">Your reading lists and progress.</p>
        </div>
        <span className="text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-3 py-1 rounded-full">
          {loading ? "…" : `${total} total`}
        </span>
      </div>

      <div className="h-px bg-gray-100 dark:bg-gray-800" />

      {/* Stat cards */}
      {loading ? (
        <div className="grid grid-cols-3 gap-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-gray-100 dark:bg-gray-800" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {SHELF_STATS.map(({ key, label, icon: Icon, color, bg, border, bar }) => {
            // ↑ FIX: destructure `icon` and alias as `Icon` — this was the crash
            const count = counts[key];
            const pct   = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <div key={key} className={`${bg} border ${border} rounded-xl p-4 flex flex-col gap-2`}>
                <div className="flex items-center justify-between">
                  <Icon className={`text-lg ${color}`} />
                  <span className={`text-2xl font-bold ${color}`}>{count}</span>
                </div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">{label}</p>
                <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${bar} rounded-full transition-all duration-700`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-[10px] text-gray-400">{pct}% of shelf</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Overall stacked bar */}
      {!loading && total > 0 && (
        <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">Overall Progress</p>
            <p className="text-xs text-gray-400">{counts.completed} of {total} completed</p>
          </div>
          <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex">
            <div className="h-full bg-emerald-500 transition-all duration-700" style={{ width: `${(counts.completed / total) * 100}%` }} />
            <div className="h-full bg-indigo-500 transition-all duration-700" style={{ width: `${(counts.reading   / total) * 100}%` }} />
            <div className="h-full bg-amber-400  transition-all duration-700" style={{ width: `${(counts.planned   / total) * 100}%` }} />
          </div>
          <div className="flex items-center gap-4">
            {SHELF_STATS.map(({ key, label, bar }) => (
              <div key={key} className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${bar}`} />
                <span className="text-[10px] text-gray-400">{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <button
        onClick={() => navigate("/my-library")}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-indigo-100 dark:border-indigo-900/60 bg-indigo-50 dark:bg-indigo-950/30 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-950/50 transition-all"
      >
        <HiOutlineBookOpen className="text-base" />
        Manage in My Library →
      </button>

      {!loading && total === 0 && (
        <div className="text-center py-6 text-gray-400">
          <HiOutlineBookOpen className="text-4xl mx-auto mb-2 opacity-30" />
          <p className="text-sm font-medium">No books on your shelf yet.</p>
          <p className="text-xs mt-1">Browse books and start reading!</p>
        </div>
      )}
    </div>
  );
}

// Main Page
export default function ProfilePage() {
  const notify   = useNotification();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [user, setUser]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);
  const urlTab = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(() => normalizeTabKey(urlTab));

  const [activity, setActivity]               = useState({ reviews: [], pins: [] });
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [activityError, setActivityError]     = useState("");

  const [shelfCounts, setShelfCounts]   = useState({ reading: 0, completed: 0, planned: 0 });
  const [loadingShelf, setLoadingShelf] = useState(true);

  const [form, setForm]       = useState({ name: "", email: "" });
  const [pwdForm, setPwdForm] = useState({ current: "", password: "", confirmPassword: "" });

  useEffect(() => {
    const normalized = normalizeTabKey(urlTab);
    if (normalized !== activeTab) setActiveTab(normalized);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlTab]);

  const handleSelectTab = (tabKey) => {
    const normalized = normalizeTabKey(tabKey);
    setActiveTab(normalized);

    const next = new URLSearchParams(searchParams);
    next.set("tab", normalized);
    setSearchParams(next);
  };

  useEffect(() => {
    if (!localStorage.getItem("token")) { navigate("/auth/login"); return; }
    let isActive = true;

    // Restore cache
    try {
      const cached = localStorage.getItem("user");
      if (cached) {
        const u = JSON.parse(cached);
        setUser(u);
        setForm({ name: u.name ?? "", email: u.email ?? "" });
      }
    } catch { /* ignore bad cache */ }

    // Profile
    (async () => {
      try {
        const { data } = await API.get("/auth/profile");
        const u = data.user ?? data;
        if (!isActive) return;
        setUser(u);
        setForm({ name: u.name ?? "", email: u.email ?? "" });
        localStorage.setItem("user", JSON.stringify({
          ...JSON.parse(localStorage.getItem("user") ?? "{}"), ...u,
        }));
      } catch {
        if (isActive) navigate("/auth/login");
      } finally {
        if (isActive) setLoading(false);
      }
    })();

    // Activity
    (async () => {
      try {
        const { data } = await API.get("/auth/profile/activity?limit=6");
        if (!isActive) return;
        setActivity({ reviews: data?.reviews ?? [], pins: data?.pins ?? [] });
      } catch (err) {
        if (isActive) setActivityError(err.response?.data?.message ?? "Could not load activity.");
      } finally {
        if (isActive) setLoadingActivity(false);
      }
    })();

    // Shelf counts
    (async () => {
      try {
        const [r, c, p] = await Promise.allSettled([
          API.get("/bookshelf?status=reading"),
          API.get("/bookshelf?status=completed"),
          API.get("/bookshelf?status=planned"),
        ]);
        if (!isActive) return;
        const count = (res) =>
          res.status === "fulfilled"
            ? (res.value.data?.length ?? res.value.data?.books?.length ?? 0)
            : 0;
        setShelfCounts({ reading: count(r), completed: count(c), planned: count(p) });
      } catch { /* silent */ }
      finally { if (isActive) setLoadingShelf(false); }
    })();

    return () => { isActive = false; };
  }, [navigate]);

  const handleSave = async () => {
    const name  = form.name.trim();
    const email = form.email.trim();
    if (!name)  { notify.error("Validation", "Name cannot be empty."); return; }
    if (!email) { notify.error("Validation", "Email cannot be empty."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { notify.error("Validation", "Invalid email."); return; }

    const nameChanged  = name  !== (user?.name  ?? "").trim();
    const emailChanged = email !== (user?.email ?? "").trim().toLowerCase();
    if (!nameChanged && !emailChanged) { notify.error("No changes", "Update at least one field."); return; }

    setSaving(true);
    try {
      const payload = {};
      if (nameChanged)  payload.name  = name;
      if (emailChanged) payload.email = email.toLowerCase();
      const { data } = await API.put("/auth/profile", payload);
      const updated  = data.user ?? data;
      setUser((u) => ({ ...u, ...updated }));
      setForm((f) => ({ ...f, name: updated.name ?? f.name, email: updated.email ?? f.email }));
      localStorage.setItem("user", JSON.stringify({
        ...JSON.parse(localStorage.getItem("user") ?? "{}"), ...updated,
      }));
      notify.success("Profile updated", "Your changes have been saved.");
    } catch (err) {
      notify.error("Update failed", err.response?.data?.message ?? "Failed to save.");
    } finally { setSaving(false); }
  };

  const handlePasswordSave = async () => {
    const { current, password, confirmPassword } = pwdForm;
    if (!current)                     { notify.error("Validation", "Current password required."); return; }
    if (!password)                    { notify.error("Validation", "New password required."); return; }
    if (password.length < 6)          { notify.error("Validation", "Minimum 6 characters."); return; }
    if (current === password)         { notify.error("Validation", "New password must differ."); return; }
    if (password !== confirmPassword) { notify.error("Validation", "Passwords don't match."); return; }

    setSavingPwd(true);
    try {
      await API.put("/auth/profile/password", { currentPassword: current, newPassword: password });
      setPwdForm({ current: "", password: "", confirmPassword: "" });
      notify.success("Password changed", "Your password has been updated.");
    } catch (err) {
      notify.error("Failed", err.response?.data?.message ?? "Could not update password.");
    } finally { setSavingPwd(false); }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/auth/login");
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
      <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
    </div>
  );

  if (!user) return null;

  const initials  = `${user.name?.[0] ?? ""}${user.name?.split(" ")[1]?.[0] ?? ""}`.toUpperCase() || "?";
  const color     = getAvatarGradient(user.name ?? "");
  const roleLabel = user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "Member";

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">

      {/* Breadcrumb */}
      <div className="border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 py-3 flex items-center gap-2">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          <HiArrowLeft className="text-base" /> Back
        </button>
        <span className="text-gray-300 dark:text-gray-700">/</span>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Account</span>
        <span className="text-gray-300 dark:text-gray-700">/</span>
        <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400 capitalize">{activeTab}</span>
      </div>

      {/* Layout */}
      <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col md:flex-row gap-6 items-start">
        <Sidebar
          user={user}
          color={color}
          initials={initials}
          roleLabel={roleLabel}
          activeTab={activeTab}
          setActiveTab={handleSelectTab}
          onLogout={handleLogout}
          shelfCounts={shelfCounts}
        />

        <div className="flex-1 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 min-h-[400px]">
          {activeTab === "profile"   && <ProfileTab  form={form} setForm={setForm} saving={saving} onSave={handleSave} />}
          {activeTab === "security"  && <SecurityTab pwdForm={pwdForm} setPwdForm={setPwdForm} savingPwd={savingPwd} onSave={handlePasswordSave} />}
          {activeTab === "activity"  && <ActivityTab activity={activity} setActivity={setActivity} loading={loadingActivity} error={activityError} />}
          {activeTab === "payments"  && <PaymentsTab />}
          {activeTab === "bookshelf" && <BookshelfTab counts={shelfCounts} loading={loadingShelf} />}
        </div>
      </div>
    </div>
  );
}
