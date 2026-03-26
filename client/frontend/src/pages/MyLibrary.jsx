import { useEffect, useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { HiOutlineBookOpen, HiOutlineClock, HiOutlineCheckCircle, HiOutlineBookmarkSquare } from "react-icons/hi2";
import { getAvatarGradient } from "../utils/avatarColor";
import API from "../services/api";

const getColor = (n = "") => getAvatarGradient(n) ?? getAvatarGradient("");

const TABS = [
  { key: "reading",   label: "Reading",      icon: <HiOutlineClock /> },
  { key: "completed", label: "Completed",    icon: <HiOutlineCheckCircle /> },
  { key: "planned",   label: "Plan to Read", icon: <HiOutlineBookmarkSquare /> },
];

const TAB_STYLE = {
  reading:   { active: "text-indigo-600 border-indigo-600",   badge: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400" },
  completed: { active: "text-emerald-600 border-emerald-500", badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" },
  planned:   { active: "text-amber-600 border-amber-500",     badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400" },
};
const VALID_TABS = new Set(["reading", "completed", "planned"]);

function BookCard({ book, tab, onMove, onRemove, busy }) {
  const moveOptions = ["reading", "completed", "planned"].filter((s) => s !== tab);
  const showMoves = tab !== "completed";
  return (
    <div className="flex flex-col gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition-all group sm:flex-row sm:items-center sm:gap-4">
      <Link to={`/books/${book._id}`} className="flex items-center gap-4 min-w-0 w-full sm:flex-1">
        <div className={`w-12 h-16 sm:w-14 sm:h-20 rounded-lg flex-shrink-0 bg-gradient-to-br ${getColor(book.title)} flex items-center justify-center shadow-sm overflow-hidden`}>
          {book.coverImage ? (
            <img src={book.coverImage} alt={book.title} className="w-full h-full object-cover" />
          ) : (
            <HiOutlineBookOpen className="text-white text-2xl" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{book.title}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{book.author ?? "Unknown Author"}</p>
          <span className={`mt-2 inline-flex sm:hidden text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${TAB_STYLE[tab].badge}`}>
            {tab === "reading" ? "Reading" : tab === "completed" ? "Completed" : "Planned"}
          </span>
        </div>
      </Link>

      <div className="flex w-full sm:w-auto items-center justify-end gap-2 sm:flex-shrink-0">
        <span className={`hidden sm:inline-flex text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${TAB_STYLE[tab].badge}`}>
          {tab === "reading" ? "Reading" : tab === "completed" ? "Completed" : "Planned"}
        </span>
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          {showMoves && moveOptions.map((status) => (
            <button
              key={status}
              onClick={() => onMove(book._id, status)}
              disabled={busy}
              className="px-2.5 py-1 text-[10px] font-semibold rounded-full border border-gray-200 dark:border-gray-700 text-gray-600 hover:text-indigo-600 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-white dark:hover:bg-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              title={`Move to ${status}`}
            >
              {status === "reading" ? (
                <>
                  <span className="sm:hidden">Reading</span>
                  <span className="hidden sm:inline">To Reading</span>
                </>
              ) : status === "completed" ? (
                <>
                  <span className="sm:hidden">Completed</span>
                  <span className="hidden sm:inline">To Completed</span>
                </>
              ) : (
                <>
                  <span className="sm:hidden">Planned</span>
                  <span className="hidden sm:inline">To Planned</span>
                </>
              )}
            </button>
          ))}
          <button
            onClick={() => onRemove(book._id)}
            disabled={busy}
            className="px-2.5 py-1 text-[10px] font-semibold rounded-full border border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title="Remove from shelf"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

function Empty({ tab }) {
  const MAP = {
    reading:   { emoji: "📖", text: "No books in progress yet.", hint: "Start reading a new book to see it here" },
    completed: { emoji: "🏆", text: "No completed books yet.", hint: "Mark books as completed when you finish reading" },
    planned:   { emoji: "🔖", text: "No books planned yet.", hint: "Add books to your reading list" },
  };
  const { emoji, text, hint } = MAP[tab];
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <span className="text-5xl">{emoji}</span>
      <div className="text-center">
        <p className="text-base font-medium text-gray-700 dark:text-gray-300">{text}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{hint}</p>
      </div>
      <Link to="/books" className="mt-3 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-all">
        Browse Books
      </Link>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="flex flex-col gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 animate-pulse sm:flex-row sm:items-center sm:gap-4">
      <div className="flex items-center gap-4 min-w-0 w-full sm:flex-1">
        <div className="w-12 h-16 sm:w-14 sm:h-20 rounded-lg bg-gray-300 dark:bg-gray-700 flex-shrink-0" />
        <div className="flex-1 flex flex-col gap-2 min-w-0">
          <div className="h-4 w-3/4 bg-gray-300 dark:bg-gray-700 rounded-full" />
          <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-600 rounded-full" />
          <div className="h-5 w-20 bg-gray-200 dark:bg-gray-600 rounded-full sm:hidden mt-1" />
        </div>
      </div>
      <div className="flex w-full sm:w-auto items-center justify-end gap-2 sm:flex-shrink-0">
        <div className="hidden sm:block h-6 w-16 bg-gray-300 dark:bg-gray-700 rounded-full" />
        <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded-full" />
      </div>
    </div>
  );
}


export default function MyLibraryPage() {
  const [shelf, setShelf]     = useState({ reading: [], completed: [], planned: [] });
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId]   = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = VALID_TABS.has(searchParams.get("tab")) ? searchParams.get("tab") : "reading";
  const [tab, setTab]         = useState(initialTab);
  const navigate              = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem("token")) { navigate("/auth/login"); return; }
    (async () => {
      try {
        const [r, c, p] = await Promise.allSettled([
          API.get("/bookshelf?status=reading"),
          API.get("/bookshelf?status=completed"),
          API.get("/bookshelf?status=planned"),
        ]);
        setShelf({
          reading:   r.status === "fulfilled" ? r.value.data ?? [] : [],
          completed: c.status === "fulfilled" ? c.value.data ?? [] : [],
          planned:   p.status === "fulfilled" ? p.value.data ?? [] : [],
        });
      } catch { navigate("/auth/login"); }
      finally  { setLoading(false); }
    })();
  }, [navigate]);

  useEffect(() => {
    const urlTab = searchParams.get("tab");
    if (urlTab && VALID_TABS.has(urlTab) && urlTab !== tab) {
      setTab(urlTab);
    }
    if (!urlTab || !VALID_TABS.has(urlTab)) {
      setSearchParams({ tab });
    }
  }, [searchParams, setSearchParams, tab]);

  const counts = {
    reading:   shelf.reading.length,
    completed: shelf.completed.length,
    planned:   shelf.planned.length,
  };
  const total = counts.reading + counts.completed + counts.planned;

  const removeLocal = (bookId) => {
    setShelf((prev) => ({
      reading: prev.reading.filter((b) => b._id !== bookId),
      completed: prev.completed.filter((b) => b._id !== bookId),
      planned: prev.planned.filter((b) => b._id !== bookId),
    }));
  };

  const moveLocal = (bookId, nextStatus) => {
    setShelf((prev) => {
      let moved = null;
      const next = {
        reading: prev.reading.filter((b) => {
          if (b._id === bookId) moved = b;
          return b._id !== bookId;
        }),
        completed: prev.completed.filter((b) => {
          if (b._id === bookId) moved = b;
          return b._id !== bookId;
        }),
        planned: prev.planned.filter((b) => {
          if (b._id === bookId) moved = b;
          return b._id !== bookId;
        }),
      };

      if (moved) {
        next[nextStatus] = [{ ...moved, shelfStatus: nextStatus }, ...next[nextStatus]];
      }

      return next;
    });
  };

  const handleMove = async (bookId, status) => {
    setBusyId(bookId);
    try {
      await API.post("/bookshelf", { bookId, status });
      moveLocal(bookId, status);
    } catch (error) {
      console.error(error);
    } finally {
      setBusyId(null);
    }
  };

  const handleRemove = async (bookId) => {
    setBusyId(bookId);
    try {
      await API.delete(`/bookshelf/${bookId}`);
      removeLocal(bookId);
    } catch (error) {
      console.error(error);
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="page-container py-8 sm:py-10">
        <div className="flex flex-col gap-7">
          {/* Title */}
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">My Library</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {total} {total === 1 ? "book" : "books"} on your shelf
            </p>
          </div>
 
          {/* Card */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col flex-1 overflow-hidden relative z-10">
            <div className="flex border-b border-gray-200 dark:border-gray-800">
              {TABS.map((t) => {
                const active = tab === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => {
                      setTab(t.key);
                      setSearchParams({ tab: t.key });
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 px-2.5 py-3.5 sm:px-4 sm:py-4 text-xs sm:text-sm font-medium border-b-2 -mb-px transition-all ${
                      active
                        ? TAB_STYLE[t.key].active
                        : "border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    }`}
                  >
                    <span className="text-base">{t.icon}</span>
                    <span className="hidden sm:inline">{t.label}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1 ${
                      active
                        ? TAB_STYLE[t.key].badge
                        : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                    }`}>
                      {counts[t.key]}
                    </span>
                  </button>
                );
              })}
            </div>

          {/* Book list */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-3">
            {loading
              ? Array(4).fill(0).map((_, i) => <SkeletonRow key={i} />)
              : shelf[tab].length === 0
                ? <Empty tab={tab} />
                : shelf[tab].map((book, i) => (
                    <BookCard
                      key={book._id ?? i}
                      book={book}
                      tab={tab}
                      onMove={handleMove}
                      onRemove={handleRemove}
                      busy={busyId === book._id}
                    />
                  ))
            }
          </div>

          </div>
        </div>
      </div>
    </div>
  );
}
