import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  HiOutlineBookOpen,
  HiOutlineCheckCircle,
  HiStar,
} from "react-icons/hi2";

function getPriceLabel(book) {
  if (!book?.isPaid) return "Free";
  return Number.isFinite(Number(book?.price)) ? `Rs. ${book.price}` : "Paid";
}

function getReasonLabel(book) {
  const reasons = Array.isArray(book?.recommendation?.reasons)
    ? book.recommendation.reasons.filter(
        (reason) =>
          Boolean(reason) &&
          !["same category", "similar description"].includes(String(reason).trim().toLowerCase())
      )
    : [];

  if (reasons.length > 0) return reasons[0];
  return "";
}

function getMatchPercent(book) {
  const provided = Number(book?.recommendation?.matchPercent);
  if (Number.isFinite(provided)) {
    return Math.max(0, Math.min(100, Math.round(provided)));
  }

  const score = Number(book?.recommendation?.score);
  if (!Number.isFinite(score)) return 0;

  return Math.max(0, Math.min(100, Math.round(score * 100)));
}

function SimilarBookCard({ book, onClick, compact = false }) {
  const avgRating = Number(book?.averageRating) || 0;
  const totalRatings = Number(book?.totalRatings) || 0;
  const hasRating = avgRating > 0;
  const isCompleted = book?.shelfStatus === "completed";
  const matchPercent = getMatchPercent(book);
  const reasonLabel = getReasonLabel(book);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex h-full w-full flex-col border border-stone-200 bg-gradient-to-br from-white via-[#fcfaf6] to-stone-50 text-left dark:border-stone-700 dark:bg-gradient-to-br dark:from-stone-900 dark:via-stone-900 dark:to-stone-800/70 ${
        compact
          ? "rounded-xl p-3 shadow-[0_14px_28px_rgba(28,25,23,0.05)]"
          : "rounded-2xl p-4 shadow-[0_18px_38px_rgba(28,25,23,0.06)]"
      }`}
    >
      <div className="flex h-full gap-4">
        <div className={`relative shrink-0 ${compact ? "w-24" : "w-28 sm:w-32"}`}>
          <div className={`aspect-[177/266] overflow-hidden bg-stone-100 dark:bg-stone-800 ${compact ? "rounded-lg" : "rounded-xl"}`}>
            {book?.coverImage ? (
              <img
                src={book.coverImage}
                alt={book?.title || "Book cover"}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-stone-100 via-[#f3efe4] to-stone-200 dark:from-stone-800 dark:via-stone-800 dark:to-stone-700">
                <HiOutlineBookOpen className="text-4xl text-stone-400 dark:text-stone-500" />
              </div>
            )}
          </div>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-[6px] rounded-l-[3px] bg-gradient-to-r from-black/10 to-transparent" />
        </div>

        <div className={`flex min-w-0 flex-1 flex-col ${compact ? "gap-2.5" : "gap-3"}`}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="min-h-[0.95rem]">
                {reasonLabel ? (
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-700 dark:text-indigo-400">
                    {reasonLabel}
                  </p>
                ) : null}
              </div>
              <h3 className={`mt-1 truncate font-sans font-semibold leading-tight text-stone-900 dark:text-stone-100 ${compact ? "min-h-[1.4rem] text-lg" : "min-h-[1.6rem] text-xl"}`}>
                {book?.title || "Untitled Book"}
              </h3>
              <p className={`mt-1 line-clamp-1 min-h-[1.15rem] font-sans font-medium italic text-stone-500 dark:text-stone-400 ${compact ? "text-[12px]" : "text-[13px]"}`}>
                by <span className="text-stone-800 dark:text-stone-200">{book?.author || "Unknown Author"}</span>
              </p>
            </div>

            {isCompleted && (
              <span className={`inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/60 dark:text-emerald-300 ${compact ? "px-2 py-0.5" : "px-2.5 py-1"}`}>
                <HiOutlineCheckCircle className="text-xs" />
                Completed
              </span>
            )}
          </div>

          <div className={`flex flex-wrap items-center gap-2 font-semibold uppercase tracking-[0.14em] text-stone-500 dark:text-stone-400 ${compact ? "text-[10px]" : "text-[11px]"}`}>
            {matchPercent > 0 && (
              <span className={`rounded-full border border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900/60 dark:bg-indigo-950/60 dark:text-indigo-300 ${compact ? "px-2 py-0.5" : "px-2.5 py-1"}`}>
                {matchPercent}% match
              </span>
            )}
            <span
              className={`rounded-full ${
                book?.isPaid
                  ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300"
                  : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
              } ${compact ? "px-2 py-0.5" : "px-2.5 py-1"}`}
            >
              {getPriceLabel(book)}
            </span>
            {hasRating && (
              <span className={`inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/50 dark:text-amber-300 ${compact ? "px-2 py-0.5" : "px-2.5 py-1"}`}>
                <HiStar className="text-xs" />
                {avgRating.toFixed(1)}
                {totalRatings > 0 ? ` (${totalRatings})` : ""}
              </span>
            )}
          </div>

          <div className={`mt-auto pt-1 font-sans font-bold uppercase tracking-[0.18em] text-stone-400 transition-[opacity,color] duration-150 md:opacity-0 md:group-hover:opacity-100 md:group-hover:text-indigo-400 ${compact ? "text-[10px]" : "text-[11px]"}`}>
            View details
          </div>
        </div>
      </div>
    </button>
  );
}

function SidebarSkeleton({
  count = 4,
  className = "grid gap-4 md:grid-cols-2",
  compact = false,
}) {
  return (
    <div className={className}>
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className={`flex gap-4 border border-stone-200 bg-white animate-pulse dark:border-stone-700 dark:bg-stone-900/50 ${
            compact ? "rounded-xl p-3" : "rounded-2xl p-4"
          }`}
        >
          <div className={`aspect-[177/266] shrink-0 bg-stone-200 dark:bg-stone-700 ${compact ? "w-24 rounded-lg" : "w-28 rounded-xl sm:w-32"}`} />
          <div className="flex-1 space-y-3 pt-1">
            <div className="h-2.5 w-24 rounded bg-stone-200 dark:bg-stone-700" />
            <div className="h-5 w-4/5 rounded bg-stone-200 dark:bg-stone-700" />
            <div className="h-4 w-2/3 rounded bg-stone-200 dark:bg-stone-700" />
            <div className="flex gap-2">
              <div className="h-7 w-20 rounded-full bg-stone-200 dark:bg-stone-700" />
              <div className="h-7 w-16 rounded-full bg-stone-200 dark:bg-stone-700" />
            </div>
            <div className="space-y-2">
              <div className="h-3.5 w-full rounded bg-stone-200 dark:bg-stone-700" />
              <div className="h-3.5 w-11/12 rounded bg-stone-200 dark:bg-stone-700" />
              <div className="h-3.5 w-3/4 rounded bg-stone-200 dark:bg-stone-700" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ContentBasedFilteringSidebar({
  books = [],
  loading = false,
  title = "Recommended for you",
  embedded = false,
  variant = "compact",
  maxItems = 6,
  className = "",
  scrollBody = false,
  navigationState = null,
}) {
  const navigate = useNavigate();
  const isSidebarVariant = variant === "sidebar";

  const safeMax =
    Number.isFinite(Number(maxItems)) && Number(maxItems) > 0
      ? Math.min(Number(maxItems), 20)
      : 6;

  const items = useMemo(
    () => (Array.isArray(books) ? books.slice(0, safeMax) : []),
    [books, safeMax]
  );

  const skeletonCount = isSidebarVariant ? Math.min(3, safeMax) : variant === "large" ? Math.min(4, safeMax) : Math.min(2, safeMax);
  const gridClass = isSidebarVariant ? "grid gap-4" : "grid gap-4 md:grid-cols-2";

  return (
    <section
      className={`${
        embedded
          ? "w-full"
          : `border border-stone-200 bg-white/85 p-5 shadow-[0_16px_40px_rgba(28,25,23,0.06)] backdrop-blur-sm dark:border-stone-700 dark:bg-stone-900/50 ${
              isSidebarVariant ? "rounded-xl" : "rounded-2xl"
            }`
      } ${scrollBody ? "flex flex-col" : ""} ${className}`.trim()}
    >
      {title && (
        <div className="mb-5 border-b border-dashed border-stone-200 pb-4 dark:border-stone-700">
          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-end sm:justify-between">
              <h2 className="font-sans text-[1.4rem] font-semibold tracking-tight text-stone-900 dark:text-stone-100">
                {title}
              </h2>
          </div>
        </div>
      )}

      <div className={scrollBody ? "flex-1 overflow-y-auto pr-1 -mr-1" : ""}>
        {loading ? (
          <SidebarSkeleton
            count={skeletonCount}
            className={gridClass}
            compact={isSidebarVariant}
          />
        ) : items.length > 0 ? (
          <div className={gridClass}>
            {items.map((book) => (
              <SimilarBookCard
                key={book._id}
                book={book}
                compact={isSidebarVariant}
                onClick={() => navigate(`/books/${book._id}`, navigationState ? { state: navigationState } : undefined)}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-[3px] border border-dashed border-stone-300 bg-stone-50/70 px-6 py-12 text-center dark:border-stone-700 dark:bg-stone-900/30">
            <p className="font-sans text-lg text-stone-700 dark:text-stone-200">
              No similar books available right now.
            </p>
            <p className="mt-2 font-sans text-sm text-stone-500 dark:text-stone-400">
              Recommendations will appear here as more matching titles are found.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
