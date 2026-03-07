import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  HiArrowLeft,
  HiOutlineEnvelope,
  HiOutlineLockClosed,
  HiOutlineUser,
  HiArrowRightOnRectangle,
  HiChevronDown,
  HiChevronUp,
} from "react-icons/hi2";
import { getAvatarGradient } from "../utils/avatarColor";
import API from "../services/api";
import BackroundGrid from "../components/layout/BackroundGrid";
import { useNotification } from "../context/Notification";


export default function ProfilePage() {
  const notify = useNotification(); 

  const [user, setUser]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);
  const [showPwd, setShowPwd]     = useState(false);

  const [form, setForm]       = useState({ name: "", email: "" });
  const [pwdForm, setPwdForm] = useState({ current: "", password: "", confirmPassword: "" });

  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem("token")) { navigate("/auth/login"); return; }

    const cached = localStorage.getItem("user");
    if (cached) {
      try {
        const u = JSON.parse(cached);
        setUser(u);
        setForm({ name: u.name ?? "", email: u.email ?? "" });
      } catch { /* ignore bad cache */ }
    }

    (async () => {
      try {
        const { data } = await API.get("/auth/profile");
        const u = data.user ?? data;
        setUser(u);
        setForm({ name: u.name ?? "", email: u.email ?? "" });

        const existing = JSON.parse(localStorage.getItem("user") ?? "{}");
        localStorage.setItem("user", JSON.stringify({ ...existing, ...u }));
      } catch { navigate("/auth/login"); }
      finally { setLoading(false); }
    })();
  }, [navigate]);

  // ── Save profile info ────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    try {
      const res     = await API.put("/auth/profile", { name: form.name, email: form.email });
      const updated = res.data.user ?? res.data;

      setUser((u) => ({ ...u, ...updated }));

      const existing = JSON.parse(localStorage.getItem("user") ?? "{}");
      localStorage.setItem("user", JSON.stringify({ ...existing, ...updated }));

      notify.success("Profile updated", "Your name and email have been saved.");
    } catch (err) {
      notify.error("Update failed", err.response?.data?.message ?? "Failed to save. Try again.");
    } finally { setSaving(false); }
  };

  // ── Save password ────────────────────────────────────────────────────────
  const handlePasswordSave = async () => {
    if (!pwdForm.current)                              { notify.error("Validation", "Current password is required.");  return; }
    if (!pwdForm.password)                             { notify.error("Validation", "New password is required.");       return; }
    if (pwdForm.password !== pwdForm.confirmPassword)  { notify.error("Validation", "Passwords do not match.");         return; }

    setSavingPwd(true);
    try {
      await API.put("/auth/profile/password", {
        currentPassword: pwdForm.current,
        newPassword:     pwdForm.password,
      });
      setPwdForm({ current: "", password: "", confirmPassword: "" });
      setShowPwd(false);
      notify.success("Password changed", "Your password has been updated successfully.");
    } catch (err) {
      notify.error("Password update failed", err.response?.data?.message ?? "Failed to update password.");
    } finally { setSavingPwd(false); }
  };

  // ── Logout ───────────────────────────────────────────────────────────────
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/auth/login");
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
    </div>
  );

  if (!user) return null;

  const initials  = `${user.name?.[0] ?? ""}${user.name?.split(" ")[1]?.[0] ?? ""}`.toUpperCase() || "?";
  const color     = getAvatarGradient(user.name ?? "");
  const roleLabel = user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "Member";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <div>
        <BackroundGrid />
      </div>

      {/* Back */}
      <div className="px-6 pt-5">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors"
        >
          <HiArrowLeft className="text-base" /> Back
        </button>
      </div>

      <div className="flex-1 flex items-start justify-center px-4 py-6 relative z-10">
        <div className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">

          {/* ── Avatar + Name + Role ── */}
          <div className="flex flex-row items-center gap-4 px-6 pt-6 pb-5 border-b border-gray-100 dark:border-gray-800">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center text-white text-xl font-bold shadow-md flex-shrink-0`}>
              {initials}
            </div>
            <div className="flex flex-col gap-1.5 min-w-0">
              <h1 className="text-base font-bold text-gray-900 dark:text-white tracking-tight leading-tight truncate">
                {user.name ?? user.email ?? "User"}
              </h1>
              <div className="inline-flex items-center gap-1.5 pl-2 pr-3 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/60 w-fit">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400 flex-shrink-0" />
                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">{roleLabel}</span>
              </div>
            </div>
          </div>

          {/* ── Profile Info Form ── */}
          <div className="px-6 pt-6 pb-2 flex flex-col gap-5">

            {/* Full Name */}
            <div className="flex flex-col gap-1.5">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <HiOutlineUser className="text-sm" /> Full Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Your full name"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 dark:focus:border-indigo-500 transition-all"
              />
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <HiOutlineEnvelope className="text-sm" /> Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="your@email.com"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 dark:focus:border-indigo-500 transition-all"
              />
            </div>

            {/* Save profile */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {saving && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>

          {/* ── Change Password Toggle ── */}
          <div className="px-6 py-4">
            <button
              onClick={() => setShowPwd((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
            >
              <span className="flex items-center gap-2">
                <HiOutlineLockClosed className="text-base" />
                Change Password
              </span>
              {showPwd ? <HiChevronUp className="text-base" /> : <HiChevronDown className="text-base" />}
            </button>

            {/* Collapsible password fields */}
            {showPwd && (
              <div className="mt-4 flex flex-col gap-4">

                {/* Current Password */}
                <div className="flex flex-col gap-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <HiOutlineLockClosed className="text-sm" /> Current Password
                  </label>
                  <input
                    type="password"
                    value={pwdForm.current}
                    onChange={(e) => setPwdForm((f) => ({ ...f, current: e.target.value }))}
                    placeholder="Enter current password"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 dark:focus:border-indigo-500 transition-all"
                  />
                </div>

                {/* New Password */}
                <div className="flex flex-col gap-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <HiOutlineLockClosed className="text-sm" /> New Password
                  </label>
                  <input
                    type="password"
                    value={pwdForm.password}
                    onChange={(e) => setPwdForm((f) => ({ ...f, password: e.target.value }))}
                    placeholder="Enter new password"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 dark:focus:border-indigo-500 transition-all"
                  />
                </div>

                {/* Confirm Password */}
                <div className="flex flex-col gap-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <HiOutlineLockClosed className="text-sm" /> Confirm Password
                  </label>
                  <input
                    type="password"
                    value={pwdForm.confirmPassword}
                    onChange={(e) => setPwdForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                    placeholder="Repeat new password"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 dark:focus:border-indigo-500 transition-all"
                  />
                </div>

                {/* Update password btn */}
                <button
                  onClick={handlePasswordSave}
                  disabled={savingPwd}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {savingPwd && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  {savingPwd ? "Updating..." : "Update Password"}
                </button>
              </div>
            )}
          </div>

          {/* ── Logout ── */}
          <div className="px-6 pb-6">
            <div className="border-t border-gray-100 dark:border-gray-800 mb-4" />
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-red-500 dark:text-red-400 border border-red-100 dark:border-red-900/40 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
            >
              <HiArrowRightOnRectangle className="text-base" /> Logout
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
