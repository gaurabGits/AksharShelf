import { useCallback, useEffect, useMemo, useState } from "react";
import {
  HiExclamationTriangle,
  HiOutlineMagnifyingGlass,
  HiOutlineTrash,
  HiOutlineUserCircle,
  HiOutlineBookOpen,
  HiOutlineStar,
  HiStar,
} from "react-icons/hi2";
import AdminNavbar from "../Components/adminNavbar";
import { deleteReviewById, fetchAllReviews } from "../adminAPI";
import { useNotification } from "../../context/Notification";

function formatRelativeTime(value) {
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
}

function Stars({ value = 0 }) {
  const rating = Math.max(0, Math.min(5, Number(value) || 0));
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) =>
        s <= rating ? (
          <HiStar key={s} className="text-amber-400 text-sm" />
        ) : (
          <HiOutlineStar key={s} className="text-slate-300 text-sm" />
        )
      )}
    </div>
  );
}

const AdminReview = () => {
  const notify = useNotification();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");

  const loadReviews = useCallback(async () => {
    try {
      const { data } = await fetchAllReviews();
      setReviews(Array.isArray(data) ? data : []);
    } catch (err) {
      const message = err.response?.data?.message || "Failed to load reviews";
      setError(message);
      notify.error("Load Error", message);
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const ratingValue = ratingFilter === "all" ? null : Number(ratingFilter);

    return reviews.filter((r) => {
      if (ratingValue && Number(r.rating) !== ratingValue) return false;
      if (!q) return true;

      const bookTitle = String(r.book?.title || "").toLowerCase();
      const bookAuthor = String(r.book?.author || "").toLowerCase();
      const userName = String(r.user?.name || "").toLowerCase();
      const userEmail = String(r.user?.email || "").toLowerCase();
      const comment = String(r.comment || "").toLowerCase();

      return (
        bookTitle.includes(q) ||
        bookAuthor.includes(q) ||
        userName.includes(q) ||
        userEmail.includes(q) ||
        comment.includes(q)
      );
    });
  }, [ratingFilter, reviews, search]);

  const stats = useMemo(() => {
    const total = reviews.length;
    const rated = reviews.filter((r) => Number.isFinite(Number(r.rating)) && Number(r.rating) > 0);
    const avg =
      rated.length === 0
        ? 0
        : rated.reduce((sum, r) => sum + Number(r.rating || 0), 0) / rated.length;
    const flagged = reviews.filter((r) => String(r.comment || "").trim().length < 6).length;
    return { total, avg, rated: rated.length, flagged };
  }, [reviews]);

  const handleDelete = async (reviewId) => {
    if (!window.confirm("Delete this review permanently?")) return;
    setBusyId(reviewId);
    setError("");
    try {
      await deleteReviewById(reviewId);
      setReviews((prev) => prev.filter((r) => r._id !== reviewId));
      notify.success("Review Deleted", "Review was removed successfully.");
    } catch (err) {
      const message = err.response?.data?.message || "Failed to delete review";
      setError(message);
      notify.error("Delete Error", message);
    } finally {
      setBusyId("");
    }
  };

  return (
    <div className="h-screen bg-[#f5f6fa] flex overflow-hidden">
      <AdminNavbar />

      <main className="flex-1 p-6 md:p-10 overflow-y-scroll">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Page Header */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#1a1a2e] flex items-center gap-2">
                <HiOutlineStar className="text-xl" /> Review Management
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Moderate ratings and comments across the platform.
              </p>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-lg">
                <HiOutlineStar className="text-indigo-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1a1a2e]">{loading ? "--" : stats.total}</p>
                <p className="text-xs text-slate-400">Total Reviews</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-lg">
                <HiStar className="text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600">
                  {loading ? "--" : stats.avg ? stats.avg.toFixed(1) : "0.0"}
                </p>
                <p className="text-xs text-slate-400">Avg Rating</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-lg">
                <HiOutlineBookOpen className="text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600">{loading ? "--" : stats.rated}</p>
                <p className="text-xs text-slate-400">Rated</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-lg">
                <HiExclamationTriangle className="text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-500">{loading ? "--" : stats.flagged}</p>
                <p className="text-xs text-slate-400">Very Short</p>
              </div>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              <span className="inline-flex items-center gap-2">
                <HiExclamationTriangle /> {error}
              </span>
            </div>
          )}

          {/* Controls */}
          <section className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
              <div className="relative w-full md:max-w-md">
                <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by book, user, email or comment…"
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-500">Rating</label>
                <select
                  value={ratingFilter}
                  onChange={(e) => setRatingFilter(e.target.value)}
                  className="py-2.5 px-3 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
                >
                  <option value="all">All</option>
                  {[5, 4, 3, 2, 1].map((r) => (
                    <option key={r} value={String(r)}>
                      {r} star{r === 1 ? "" : "s"}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Table */}
          <section className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] tracking-wide">
                  <tr>
                    <th className="px-5 py-3 text-left">Book</th>
                    <th className="px-5 py-3 text-left">User</th>
                    <th className="px-5 py-3 text-left">Rating</th>
                    <th className="px-5 py-3 text-left">Comment</th>
                    <th className="px-5 py-3 text-left">Updated</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    [...Array(6)].map((_, i) => (
                      <tr key={i} className="border-t border-slate-50">
                        <td className="px-5 py-4" colSpan={6}>
                          <div className="h-4 bg-slate-100 rounded animate-pulse w-3/4" />
                        </td>
                      </tr>
                    ))
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                        <p className="text-3xl mb-2">🔎</p>
                        {search ? `No reviews matching "${search}"` : "No reviews found."}
                      </td>
                    </tr>
                  ) : (
                    filtered.map((review) => (
                      <tr
                        key={review._id}
                        className="border-t border-slate-50 hover:bg-slate-50 transition-colors"
                      >
                        {/* Book */}
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3 min-w-[220px]">
                            {review.book?.coverImage ? (
                              <img
                                src={review.book.coverImage}
                                alt={review.book.title || "Book cover"}
                                className="w-10 h-12 rounded-md object-cover border border-slate-100"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-10 h-12 rounded-md bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-100">
                                <HiOutlineBookOpen />
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-[#1a1a2e] leading-snug line-clamp-1">
                                {review.book?.title || "—"}
                              </p>
                              <p className="text-xs text-slate-400 line-clamp-1">
                                {review.book?.author || "Unknown Author"}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* User */}
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2 min-w-[180px]">
                            <HiOutlineUserCircle className="text-slate-400 text-xl" />
                            <div>
                              <p className="font-medium text-slate-700 leading-snug line-clamp-1">
                                {review.user?.name || "—"}
                              </p>
                              <p className="text-xs text-slate-400 line-clamp-1">
                                {review.user?.email || "—"}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Rating */}
                        <td className="px-5 py-3">
                          {review.rating ? (
                            <div className="flex items-center gap-2">
                              <Stars value={review.rating} />
                              <span className="text-xs text-slate-500">{review.rating}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">No rating</span>
                          )}
                        </td>

                        {/* Comment */}
                        <td className="px-5 py-3 max-w-[420px]">
                          <p className="text-slate-600 line-clamp-2">{review.comment}</p>
                        </td>

                        {/* Updated */}
                        <td className="px-5 py-3 text-slate-400 text-xs whitespace-nowrap">
                          {formatRelativeTime(review.updatedAt || review.createdAt)}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleDelete(review._id)}
                            disabled={busyId === review._id}
                            className="inline-flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                            title="Delete review"
                          >
                            <HiOutlineTrash className="text-sm" />
                            {busyId === review._id ? "..." : "Delete"}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {!loading && filtered.length > 0 && (
              <div className="px-6 py-3 border-t border-slate-100 text-xs text-slate-400">
                Showing {filtered.length} of {reviews.length} review{reviews.length !== 1 ? "s" : ""}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default AdminReview;
