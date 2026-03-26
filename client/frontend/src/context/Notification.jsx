import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from "react";

const NotificationContext = createContext();

const styles = {
  success: { color: "bg-green-500", icon: "✓" },
  error: { color: "bg-red-500", icon: "✕" },
  warning: { color: "bg-yellow-500", icon: "!" },
  info: { color: "bg-blue-500", icon: "i" },
};

// eslint-disable-next-line react-refresh/only-export-components
export const useNotification = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotification must be inside NotificationProvider");
  return ctx;
};

export function NotificationProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  // Remove toast
  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 250);
  }, []);

  // Add toast
  const push = useCallback((type, title, message = "", duration = 4000) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, type, title, message, duration, exiting: false }]);

    if (duration > 0) setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);

  // Stable notify object
  const notify = useMemo(() => ({
    success: (t, m, d) => push("success", t, m, d),
    error: (t, m, d) => push("error", t, m, d),
    warning: (t, m, d) => push("warning", t, m, d),
    info: (t, m, d) => push("info", t, m, d),
    dismiss,
  }), [push, dismiss]);

  return (
    <NotificationContext.Provider value={notify}>
      {children}
      <div className="fixed top-4 right-4 left-4 sm:left-auto z-50 flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

function Toast({ toast, onDismiss }) {
  const { id, type, title, message, duration, exiting } = toast;
  const { color, icon } = styles[type];
  const [progress, setProgress] = useState(100);

  // Progress bar animation
  useEffect(() => {
    if (!duration) return;
    const start = Date.now();
    const interval = setInterval(() => {
      const percent = 100 - ((Date.now() - start) / duration) * 100;
      setProgress(Math.max(percent, 0));
      if (percent <= 0) clearInterval(interval);
    }, 16);
    return () => clearInterval(interval);
  }, [duration]);

  return (
    <div
      className={`relative w-full sm:w-80 bg-white text-gray-900 rounded-xl shadow-lg overflow-hidden
      pointer-events-auto transition-all duration-300
      ${exiting ? "opacity-0 translate-x-6" : "opacity-100 translate-x-0"}`}
    >
      <div className="flex items-start gap-3 p-4">
        <div className={`flex items-center justify-center w-10 h-10 rounded-full ${color} text-white shadow-md`}>
          {icon}
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">{title}</p>
          {message && <p className="text-xs text-gray-500 mt-1">{message}</p>}
        </div>
        <button
          onClick={() => onDismiss(id)}
          aria-label="Dismiss notification"
          className="ml-2 w-6 h-6 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition"
        >
          ✕
        </button>
      </div>
      {duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
          <div className={`${color} h-full`} style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  );
}
