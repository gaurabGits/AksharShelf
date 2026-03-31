import { useEffect, useMemo, useState } from "react";
import AdminNavbar from "../Components/adminNavbar";
import { fetchAllUsers, fetchSentNotifications, sendAdminNotification } from "../adminAPI";
import { useNotification } from "../../context/Notification";

const formatRelativeTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";
  const diffMs = Date.now() - date.getTime();
  if (diffMs <= 0) return "Just now";
  const s = Math.floor(diffMs / 1000);
  if (s < 60) return "Just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  const w = Math.floor(d / 7);
  if (w < 4) return `${w}w ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(d / 365)}y ago`;
};

const formatDateTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return date.toLocaleString();
  }
};

const levelBadge = (level) => {
  if (level === "critical") return "bg-red-50 border-red-100 text-red-600";
  if (level === "warning") return "bg-amber-50 border-amber-100 text-amber-700";
  return "bg-blue-50 border-blue-100 text-blue-600";
};

const AdminNotifications = () => {
  const notify = useNotification();

  const [users, setUsers] = useState([]);
  const [sent, setSent] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingSent, setLoadingSent] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    audience: "all",
    userId: "",
    category: "notice",
    level: "info",
    title: "",
    message: "",
    link: "",
  });
  const [sending, setSending] = useState(false);

  const sortedUsers = useMemo(() => {
    const list = Array.isArray(users) ? users : [];
    return [...list].sort((a, b) => String(a?.name || "").localeCompare(String(b?.name || "")));
  }, [users]);

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data } = await fetchAllUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      const message = err.response?.data?.message || "Failed to load users";
      setError(message);
      notify.error("Load Error", message);
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadSent = async () => {
    setLoadingSent(true);
    try {
      const { data } = await fetchSentNotifications({ limit: 25 });
      setSent(Array.isArray(data?.sent) ? data.sent : []);
    } catch (err) {
      const message = err.response?.data?.message || "Failed to load sent notifications";
      setError(message);
      notify.error("Load Error", message);
    } finally {
      setLoadingSent(false);
    }
  };

  useEffect(() => {
    loadUsers();
    loadSent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    setError("");

    const title = String(form.title || "").trim();
    const message = String(form.message || "").trim();

    if (!title) {
      notify.error("Validation", "Title is required.");
      return;
    }
    if (form.audience === "users" && !form.userId) {
      notify.error("Validation", "Select a user.");
      return;
    }

    setSending(true);
    try {
      const payload = {
        audience: form.audience,
        userIds: form.audience === "users" ? [form.userId] : [],
        category: form.category,
        level: form.level,
        title,
        message,
        link: String(form.link || "").trim(),
      };

      const { data } = await sendAdminNotification(payload);
      notify.success("Sent", data?.message || "Notification sent.");

      setForm((prev) => ({
        ...prev,
        title: "",
        message: "",
        link: "",
        userId: prev.audience === "users" ? prev.userId : "",
      }));
      await loadSent();
    } catch (err) {
      const messageText = err.response?.data?.message || "Failed to send notification";
      setError(messageText);
      notify.error("Send Error", messageText);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="h-screen bg-[#f5f6fa] flex overflow-hidden">
      <AdminNavbar />

      <main className="flex-1 min-w-0 overflow-y-auto bg-[#f5f6fa] pt-20 md:pt-10">
        <div className="admin-page-container space-y-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#1a1a2e]">Notifications</h1>
              <p className="text-sm text-slate-400 mt-1">
                Send important notices to all users or a specific user.
              </p>
            </div>
            <button
              type="button"
              onClick={loadSent}
              className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Refresh
            </button>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h2 className="text-base font-semibold text-[#1a1a2e]">Send a notification</h2>
              <p className="text-xs text-slate-400 mt-1">
                Users will see this in their profile â†’ Notifications tab.
              </p>

              <form onSubmit={handleSend} className="mt-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="text-sm">
                    <span className="block text-xs font-medium text-slate-500 mb-1">Audience</span>
                    <select
                      value={form.audience}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          audience: e.target.value,
                          userId: e.target.value === "users" ? prev.userId : "",
                        }))
                      }
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1a1a2e] transition-colors"
                    >
                      <option value="all">All users</option>
                      <option value="users">Specific user</option>
                    </select>
                  </label>

                  <label className="text-sm">
                    <span className="block text-xs font-medium text-slate-500 mb-1">Category</span>
                    <select
                      value={form.category}
                      onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1a1a2e] transition-colors"
                    >
                      <option value="notice">Notice</option>
                      <option value="security">Security</option>
                      <option value="system">System</option>
                    </select>
                  </label>

                  <label className="text-sm">
                    <span className="block text-xs font-medium text-slate-500 mb-1">Level</span>
                    <select
                      value={form.level}
                      onChange={(e) => setForm((prev) => ({ ...prev, level: e.target.value }))}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1a1a2e] transition-colors"
                    >
                      <option value="info">Info</option>
                      <option value="warning">Warning</option>
                      <option value="critical">Critical</option>
                    </select>
                  </label>

                  <label className="text-sm">
                    <span className="block text-xs font-medium text-slate-500 mb-1">
                      User {form.audience === "users" ? "" : "(optional)"}
                    </span>
                    <select
                      value={form.userId}
                      onChange={(e) => setForm((prev) => ({ ...prev, userId: e.target.value }))}
                      disabled={form.audience !== "users" || loadingUsers}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1a1a2e] transition-colors disabled:bg-slate-50 disabled:text-slate-400"
                    >
                      <option value="">
                        {loadingUsers ? "Loading usersâ€¦" : form.audience === "users" ? "Select a user" : "All users"}
                      </option>
                      {sortedUsers.map((u) => (
                        <option key={u._id} value={u._id}>
                          {u.name || "User"} â€” {u.email || ""}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className="text-sm block">
                  <span className="block text-xs font-medium text-slate-500 mb-1">Title</span>
                  <input
                    value={form.title}
                    onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1a1a2e] transition-colors"
                    placeholder="e.g. Maintenance notice"
                    maxLength={140}
                  />
                </label>

                <label className="text-sm block">
                  <span className="block text-xs font-medium text-slate-500 mb-1">Message (optional)</span>
                  <textarea
                    value={form.message}
                    onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
                    rows={4}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1a1a2e] transition-colors resize-none"
                    placeholder="Add details for usersâ€¦"
                    maxLength={2000}
                  />
                </label>

                <label className="text-sm block">
                  <span className="block text-xs font-medium text-slate-500 mb-1">Link (optional)</span>
                  <input
                    value={form.link}
                    onChange={(e) => setForm((prev) => ({ ...prev, link: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1a1a2e] transition-colors"
                    placeholder="/books or https://example.com"
                    maxLength={500}
                  />
                </label>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={sending}
                    className="px-4 py-2 rounded-lg bg-[#1a1a2e] text-white text-sm font-medium hover:bg-[#2a2a4e] transition-colors disabled:opacity-50"
                  >
                    {sending ? "Sendingâ€¦" : "Send notification"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setForm({
                        audience: "all",
                        userId: "",
                        category: "notice",
                        level: "info",
                        title: "",
                        message: "",
                        link: "",
                      });
                      setError("");
                    }}
                    disabled={sending}
                    className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
                  >
                    Reset
                  </button>
                </div>
              </form>
            </section>

            <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-[#1a1a2e]">Sent history</h2>
                  <p className="text-xs text-slate-400 mt-1">Grouped by each send action.</p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {loadingSent ? (
                  [...Array(5)].map((_, i) => (
                    <div key={i} className="h-20 rounded-xl bg-slate-100 animate-pulse" />
                  ))
                ) : sent.length === 0 ? (
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-6 text-center text-slate-400">
                    No sent notifications yet.
                  </div>
                ) : (
                  sent.map((n) => (
                    <div
                      key={n.batchId}
                      className="rounded-xl border border-slate-100 p-4 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#1a1a2e] truncate">{n.title}</p>
                          <p className="text-xs text-slate-400 mt-1">
                            {formatRelativeTime(n.createdAt)}{" "}
                            <span className="text-slate-300">|</span>{" "}
                            {formatDateTime(n.createdAt)}{" "}
                            <span className="text-slate-300">|</span>{" "}
                            {n.recipients} recipients{" "}
                            <span className="text-slate-300">|</span>{" "}
                            {n.readCount} read
                          </p>
                        </div>
                        <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full border ${levelBadge(n.level)}`}>
                          {String(n.level || "info").toUpperCase()}
                        </span>
                      </div>

                      {n.message ? (
                        <p className="text-sm text-slate-600 mt-3 leading-relaxed whitespace-pre-line">
                          {n.message}
                        </p>
                      ) : null}

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="text-[11px] px-2 py-1 rounded-full bg-slate-50 border border-slate-100 text-slate-500">
                          {String(n.category || "notice").toUpperCase()}
                        </span>
                        {n.link ? (
                          <span className="text-[11px] px-2 py-1 rounded-full bg-slate-50 border border-slate-100 text-slate-500 truncate max-w-[280px]">
                            {n.link}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminNotifications;
