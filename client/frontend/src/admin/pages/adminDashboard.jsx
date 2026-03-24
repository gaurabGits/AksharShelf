import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  HiOutlineBookOpen,
  HiOutlineNoSymbol,
  HiOutlineSparkles,
  HiOutlineStar,
  HiOutlineUsers,
} from "react-icons/hi2";
import AdminNavbar from "../Components/adminNavbar";
import { getDashboardStats } from "../adminAPI";
import { useAdminAuth } from "../useAdminAuth";
import { useNotification } from "../../context/Notification";

const AdminDashboard = () => {
  const { admin } = useAdminAuth();
  const notify = useNotification();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBooks: 0,
    blockedUsers: 0,
    totalReviews: 0,
    avgRating: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadStats = async () => {
      try {
        const { data } = await getDashboardStats();
        setStats({
          totalUsers: data?.totalUsers || 0,
          totalBooks: data?.totalBooks || 0,
          blockedUsers: data?.blockedUsers || 0,
          totalReviews: data?.totalReviews || 0,
          avgRating: Number(data?.avgRating) || 0,
        });
      } catch (err) {
        const message = err.response?.data?.message || "Failed to load stats";
        setError(message);
        notify.error("Dashboard Error", message);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, [notify]);

  const activeUsers = useMemo(
    () => Math.max(0, Number(stats.totalUsers) - Number(stats.blockedUsers)),
    [stats.blockedUsers, stats.totalUsers]
  );

  const cards = [
    {
      label: "Total Users",
      value: stats.totalUsers,
      icon: HiOutlineUsers,
      bg: "bg-blue-50",
      border: "border-blue-100",
      text: "text-blue-600",
      link: "/admin/users",
      linkText: "View Users →",
    },
    {
      label: "Total Books",
      value: stats.totalBooks,
      icon: HiOutlineBookOpen,
      bg: "bg-indigo-50",
      border: "border-indigo-100",
      text: "text-indigo-600",
      link: "/admin/books",
      linkText: "View Books →",
    },
    {
      label: "Total Reviews",
      value: stats.totalReviews,
      icon: HiOutlineStar,
      bg: "bg-amber-50",
      border: "border-amber-100",
      text: "text-amber-600",
      link: "/admin/reviews",
      linkText: "Moderate →",
    },
    {
      label: "Blocked Users",
      value: stats.blockedUsers,
      icon: HiOutlineNoSymbol,
      bg: "bg-red-50",
      border: "border-red-100",
      text: "text-red-500",
      link: "/admin/users",
      linkText: "Manage →",
    },
  ];

  return (
    <div className="h-screen bg-[#f5f6fa] flex overflow-hidden">
      <AdminNavbar />

      <main className="flex-1 p-4 sm:p-6 md:p-10 overflow-y-scroll pt-20 md:pt-10">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Top Header */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-slate-400 mb-1">Welcome back,</p>
              <h1 className="text-2xl font-bold text-[#1a1a2e]">
                {admin?.username || "Admin"}
              </h1>
            </div>

            <div className="flex gap-3">
              <Link
                to="/admin/users"
                className="px-4 py-2 rounded-lg bg-[#1a1a2e] text-white text-sm font-medium hover:bg-[#2a2a4e] transition-colors"
              >
                Manage Users
              </Link>
              <Link
                to="/admin/books"
                className="px-4 py-2 rounded-lg border border-[#1a1a2e] text-[#1a1a2e] text-sm font-medium hover:bg-[#1a1a2e] hover:text-white transition-colors"
              >
                Manage Books
              </Link>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Stat Cards */}
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.label}
                  className={`rounded-xl border ${card.border} ${card.bg} p-5 flex flex-col gap-4 shadow-sm`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-500">{card.label}</p>
                    <Icon className={`text-xl ${card.text}`} />
                  </div>

                  <p className={`text-4xl font-bold ${card.text}`}>
                    {loading ? (
                      <span className="inline-block w-12 h-8 bg-slate-200 animate-pulse rounded" />
                    ) : (
                      card.value
                    )}
                  </p>

                  <Link to={card.link} className={`text-xs font-medium ${card.text} hover:underline`}>
                    {card.linkText}
                  </Link>
                </div>
              );
            })}
          </section>

          {/* Summary Bar */}
          <section className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
              Platform Overview
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-6 text-center">
              <div>
                <p className="text-2xl font-bold text-[#1a1a2e]">{loading ? "--" : stats.totalUsers}</p>
                <p className="text-xs text-slate-400 mt-1">Registered Users</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{loading ? "--" : activeUsers}</p>
                <p className="text-xs text-slate-400 mt-1">Active Users</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-indigo-600">{loading ? "--" : stats.totalBooks}</p>
                <p className="text-xs text-slate-400 mt-1">Books in Library</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600">{loading ? "--" : stats.totalReviews}</p>
                <p className="text-xs text-slate-400 mt-1">Reviews</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600">
                  {loading ? "--" : (Number(stats.avgRating) || 0).toFixed(1)}
                </p>
                <p className="text-xs text-slate-400 mt-1">Avg Rating</p>
              </div>
            </div>

            {!loading && stats.totalUsers > 0 && (
              <div className="mt-6">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Active Users</span>
                  <span>{Math.round((activeUsers / stats.totalUsers) * 100)}% active</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all duration-700"
                    style={{ width: `${(activeUsers / stats.totalUsers) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </section>

          {/* Quick Actions */}
          <section className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { label: "Users", icon: HiOutlineUsers, to: "/admin/users" },
                { label: "Books", icon: HiOutlineBookOpen, to: "/admin/books" },
                { label: "Reviews", icon: HiOutlineStar, to: "/admin/reviews" },
                { label: "Algorithm", icon: HiOutlineSparkles, to: "/admin/algorithm" },
                { label: "Blocked", icon: HiOutlineNoSymbol, to: "/admin/users" },
              ].map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.label}
                    to={action.to}
                    className="flex flex-col items-center gap-2 p-4 rounded-lg border border-slate-100 hover:border-[#1a1a2e] hover:bg-slate-50 transition-colors text-center"
                  >
                    <Icon className="text-2xl text-slate-700" />
                    <span className="text-xs font-medium text-slate-600">{action.label}</span>
                  </Link>
                );
              })}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
