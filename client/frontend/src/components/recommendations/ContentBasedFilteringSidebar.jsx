import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { HiOutlineBookOpen, HiOutlineSparkles } from "react-icons/hi2";

function SidebarItem({ book, onClick, variant = "compact" }) {
  const isLarge = variant === "large";
  const matchPct = Math.max(
    0,
    Math.min(100, Math.round((Number(book?.recommendation?.score) || 0) * 100))
  );

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 rounded-2xl transition-colors text-left group ${
        isLarge ? "p-3" : "p-2"
      } hover:bg-indigo-50 dark:hover:bg-indigo-900/40`}
    >
      <div
        className={`rounded-xl overflow-hidden shrink-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 transition-transform duration-300 group-hover:scale-105 ${
          isLarge ? "w-16 h-20" : "w-12 h-14"
        }`}
      >
        {book?.coverImage ? (
          <img
            src={book.coverImage}
            alt={book.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <HiOutlineBookOpen
            className={`text-indigo-400 dark:text-indigo-600 ${
              isLarge ? "text-3xl" : "text-2xl"
            }`}
          />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p
            className={`${
              isLarge ? "text-base" : "text-[15px]"
            } font-semibold text-gray-900 dark:text-white truncate`}
          >
            {book?.title}
          </p>
          {matchPct > 0 && (
            <span
              className={`shrink-0 font-semibold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/60 ${
                isLarge ? "text-[11px]" : "text-[10px]"
              }`}
            >
              {matchPct}% match
            </span>
          )}
        </div>

        <p
          className={`${
            isLarge ? "text-sm" : "text-xs"
          } text-gray-500 dark:text-gray-400 truncate`}
        >
          {book?.author}
        </p>

        {isLarge && (
          <p className="text-[11px] text-gray-400 mt-1.5 italic">
            Tap to view details
          </p>
        )}
      </div>
    </button>
  );
}

function SidebarSkeleton({ variant = "compact", count = 5 }) {
  const isLarge = variant === "large";
  return (
    <div className="space-y-2">
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className={`flex items-center gap-3 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/40 animate-pulse ${
            isLarge ? "p-3" : "p-2"
          }`}
        >
          <div
            className={`${
              isLarge ? "w-16 h-20" : "w-12 h-14"
            } rounded-xl bg-gray-200 dark:bg-gray-700`}
          />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
            <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ContentBasedFilteringSidebar({
  books = [],
  loading = false,
  title = "Content-Based Filtering",
  embedded = false,
  variant = "compact",
  maxItems = 6,
  className = "",
  scrollBody = false,
}) {
  const navigate = useNavigate();
  const safeMax =
    Number.isFinite(Number(maxItems)) && Number(maxItems) > 0
      ? Math.min(Number(maxItems), 20)
      : 6;
  const items = useMemo(
    () => (Array.isArray(books) ? books.slice(0, safeMax) : []),
    [books, safeMax]
  );

  return (
    <div
      className={`${embedded
        ? "w-full"
        : "bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5"
      } ${scrollBody ? "flex flex-col" : ""} ${className}`.trim()}
    >
      <div className="flex items-center gap-2 pb-3 border-b border-gray-200 dark:border-gray-800 mb-3">
        <div className="min-w-0">
          <h1 className="font-bold text-lg text-gray-900 dark:text-white tracking-tight">
              {title}
            </h1>
        </div>
      </div>

      <div className={scrollBody ? "flex-1 overflow-y-auto pr-1 -mr-1" : ""}>
        {loading ? (
          <SidebarSkeleton variant={variant} count={Math.min(5, safeMax)} />
        ) : items.length > 0 ? (
          <div className="space-y-2">
            {items.map((book) => (
              <SidebarItem
                key={book._id}
                book={book}
                variant={variant}
                onClick={() => navigate(`/book/${book._id}`)}
              />
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400 italic text-center mt-4">
            No recommendations yet.
          </p>
        )}
      </div>
    </div>
  );
}