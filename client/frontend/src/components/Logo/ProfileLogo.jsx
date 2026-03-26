import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../../services/api";
import { getAvatarGradient } from "../../utils/avatarColor";
import { useNotification } from "../../context/Notification";
import { isJwtExpired } from "../../utils/jwt";

function ProfileLogo({ mobile = false }) {
  const notify                = useNotification();
  const [user, setUser]       = useState(null);
  const [open, setOpen]       = useState(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef           = useRef(null);
  const navigate              = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token || isJwtExpired(token)) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setLoading(false);
        return;
      }

      try {
        const res = await API.get("/auth/profile");
        setUser(res.data.user ?? res.data);
      } catch (err) {
        console.error("Failed to fetch user:", err);
        notify.error("Session error", "Could not load your profile. Please log in again.");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/auth/login", { replace: true });
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [navigate, notify]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setOpen(false);
    notify.info("Logged out", "You have been signed out successfully.");
    navigate("/auth/login");
  };

  const handleAvatarClick = () => {
    if (window.innerWidth < 768) {
      navigate("/profile");
    } else {
      setOpen((prev) => !prev);
    }
  };

  const fullName = user?.name ?? "User";
  const initials = user
    ? `${user.name?.[0] ?? ""}${user.name?.split(" ")[1]?.[0] ?? ""}`.toUpperCase() || "?"
    : "?";

  if (loading) {
    if (mobile) {
      return (
        <div className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-900/40 animate-pulse">
          <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-28 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-2.5 w-40 rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>
      );
    }

    return <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />;
  }

  if (mobile) {
    return (
      <Link
        to="/profile"
        className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors duration-150 hover:bg-gray-100 dark:hover:bg-gray-900"
      >
        <div
          className={`w-9 h-9 rounded-full bg-gradient-to-br ${getAvatarGradient(user?.name ?? "")} flex items-center justify-center
                     text-white text-sm font-bold select-none shrink-0`}
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
            {fullName}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {user?.email ?? "View profile"}
          </p>
        </div>
      </Link>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>

      {/* Avatar */}
      <div
        onClick={handleAvatarClick}
        className={`w-9 h-9 rounded-full bg-gradient-to-br ${getAvatarGradient(user?.name ?? "")} flex items-center justify-center
                   text-white text-sm font-bold cursor-pointer select-none
                   ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-950
                   ring-transparent hover:ring-indigo-400 transition-all`}
      >
        {initials}
      </div>

      {/* Dropdown — desktop only */}
      {open && (
        <div className="absolute right-0 mt-3 w-52 z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl overflow-hidden">

          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {fullName}
            </p>
            <p className="text-[11px] text-gray-400 truncate">{user?.email ?? "N/A"}</p>
          </div>

          {/* Links */}
          <div className="p-1.5">
            <Link
              to="/profile"
              onClick={() => setOpen(false)}
              className="block px-3 py-2.5 rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
            >
              Profile
            </Link>
          </div>

          {/* Logout */}
          <div className="p-1.5 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full text-left px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all cursor-pointer"
            >
              Logout
            </button>
          </div>

        </div>
      )}
    </div>
  );
}

export default ProfileLogo;
