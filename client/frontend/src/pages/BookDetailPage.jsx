import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  HiArrowLeft,
  HiBookmark,
  HiOutlineBookmark,
  HiOutlineBookmarkSquare,
  HiOutlineBookOpen,
  HiOutlineChatBubbleLeftRight,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineEye,
  HiOutlineLockClosed,
  HiOutlineStar,
  HiStar,
  HiXMark,
} from "react-icons/hi2";
import { fetchBookDetail } from "../services/bookService";
import { useNotification } from "../context/Notification";
import API from "../services/api";

const SHELF_OPTIONS = [
  {
    key: "reading",
    label: "Currently Reading",
    icon: <HiOutlineClock />,
    color: "text-indigo-600",
    bg: "bg-indigo-50 hover:bg-indigo-100 border-indigo-100",
    badge: "bg-indigo-100 text-indigo-600",
  },
  {
    key: "completed",
    label: "Completed",
    icon: <HiOutlineCheckCircle />,
    color: "text-emerald-600",
    bg: "bg-emerald-50 hover:bg-emerald-100 border-emerald-100",
    badge: "bg-emerald-100 text-emerald-700",
  },
  {
    key: "planned",
    label: "Plan to Read",
    icon: <HiOutlineBookmarkSquare />,
    color: "text-amber-600",
    bg: "bg-amber-50 hover:bg-amber-100 border-amber-100",
    badge: "bg-amber-100 text-amber-700",
  },
];

function getCurrentUser() {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return {
      _id: payload.id || payload._id || "me",
      name: payload.name || payload.username || "You",
    };
  } catch {
    return { _id: "me", name: "You" };
  }
}

function formatRelativeTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";
  const diffMs = Date.now() - date.getTime();
  if (diffMs <= 0) return "Just now";
  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

function StarRating({ value = 0, onChange, readonly = false }) {
  const [hover, setHover] = useState(0);
  const display = hover || value;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(s)}
          onMouseEnter={() => !readonly && setHover(s)}
          onMouseLeave={() => !readonly && setHover(0)}
          className={`text-xl transition-colors ${readonly ? "cursor-default" : "cursor-pointer"}`}
        >
          {s <= display ? (
            <HiStar className="text-amber-400" />
          ) : (
            <HiOutlineStar className="text-gray-300 dark:text-gray-600" />
          )}
        </button>
      ))}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 px-4 animate-pulse">
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        <div className="h-3 w-12 bg-gray-200 dark:bg-gray-800 rounded-full" />
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-56 h-80 bg-gray-200 dark:bg-gray-800 rounded-2xl shrink-0" />
          <div className="flex-1 flex flex-col gap-4 py-2">
            <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-800 rounded-full" />
            <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-800 rounded-full" />
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-3 bg-gray-200 dark:bg-gray-800 rounded-full"
                style={{ width: `${95 - i * 8}%` }}
              />
            ))}
            <div className="h-11 w-36 bg-gray-200 dark:bg-gray-800 rounded-xl mt-4" />
          </div>
        </div>
      </div>
    </div>
  );
}

function DescriptionModal({ text, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xl max-w-lg w-full p-6 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">About this Book</h3>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700 transition-colors"
          >
            <HiXMark />
          </button>
        </div>
        <div className="h-px bg-gray-100 dark:bg-gray-800" />
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{text}</p>
      </div>
    </div>
  );
}

function ShelfDropdown({ current, onSelect, onClose }) {
  return (
    <div className="absolute right-0 top-12 z-40 w-52 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-xl overflow-hidden">
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-3 pt-3 pb-1">
        Add to Shelf
      </p>
      {SHELF_OPTIONS.map((opt) => (
        <button
          key={opt.key}
          onClick={() => {
            onSelect(opt.key);
            onClose();
          }}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors border-l-2 ${
            current === opt.key
              ? `${opt.color} border-current bg-gray-50 dark:bg-gray-800 font-semibold`
              : "text-gray-600 dark:text-gray-400 border-transparent hover:bg-gray-50 dark:hover:bg-gray-800"
          }`}
        >
          <span className={`text-base ${current === opt.key ? opt.color : ""}`}>{opt.icon}</span>
          {opt.label}
          {current === opt.key && (
            <span className="ml-auto text-[10px] font-bold bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded-full text-gray-500">
              Selected
            </span>
          )}
        </button>
      ))}
      {current && (
        <button
          onClick={() => {
            onSelect(null);
            onClose();
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 border-t border-gray-100 dark:border-gray-800 transition-colors"
        >
          Remove from shelf
        </button>
      )}
    </div>
  );
}

function ReviewCard({ review }) {
  const userName =
    typeof review.user === "object"
      ? review.user?.name || "Reader"
      : review.userName || "Reader";

  const initial = userName[0].toUpperCase();
  const colors = [
    "bg-indigo-500",
    "bg-violet-500",
    "bg-emerald-500",
    "bg-rose-500",
    "bg-amber-500",
    "bg-sky-500",
  ];
  const colorIndex = userName.charCodeAt(0) % colors.length;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm px-5 py-4 space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-full ${colors[colorIndex]} flex items-center justify-center text-white text-sm font-bold shrink-0`}
          >
            {initial}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white leading-none">
              {userName}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {formatRelativeTime(review.createdAt)}
            </p>
          </div>
        </div>
        {review.rating > 0 && <StarRating value={review.rating} readonly />}
      </div>
      <div className="h-px bg-gray-50 dark:bg-gray-800" />
      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
        {review.comment}
      </p>
    </div>
  );
}

function RatingSummary({ reviews, avgRating, totalReviews }) {
  if (totalReviews === 0) return null;

  const counts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  return (
    <div className="flex items-center gap-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
      <div className="text-center shrink-0">
        <p className="text-4xl font-bold text-gray-900 dark:text-white">{avgRating.toFixed(1)}</p>
        <StarRating value={Math.round(avgRating)} readonly />
        <p className="text-[10px] text-gray-400 mt-1">
          {totalReviews} rating{totalReviews !== 1 ? "s" : ""}
        </p>
      </div>
      <div className="flex-1 flex flex-col gap-1.5">
        {counts.map(({ star, count }) => {
          const pct = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
          return (
            <div key={star} className="flex items-center gap-2">
              <span className="text-[10px] text-gray-400 w-4 text-right">{star}</span>
              <HiStar className="text-amber-400 text-xs shrink-0" />
              <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-[10px] text-gray-400 w-6">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function BookDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const notify = useNotification();

  const [book, setBook] = useState(null);
  const [access, setAccess] = useState(null);
  const [error, setError] = useState(null);
  const [shelfStatus, setShelfStatus] = useState(null);
  const [showShelfMenu, setShowShelfMenu] = useState(false);
  const [showDescModal, setShowDescModal] = useState(false);
  const [myRating, setMyRating] = useState(0);
  const [comment, setComment] = useState("");
  const [reviews, setReviews] = useState([]);
  const [posting, setPosting] = useState(false);
  const isLoggedIn = Boolean(localStorage.getItem("token"));

  const dropdownRef = useRef(null);

  useEffect(() => {
    let isActive = true;
    setError(null);
    setBook(null);
    setAccess(null);
    setReviews([]);
    setShelfStatus(null);

    const load = async () => {
      try {
        const [bookRes, reviewRes] = await Promise.allSettled([
          fetchBookDetail(id),
          API.get(`/books/${id}/reviews`),
        ]);

        if (!isActive) return;

        if (bookRes.status === "fulfilled") {
          const bookData = bookRes.value.data?.book || bookRes.value.data;
          setBook(bookData);
          setAccess(bookRes.value.data?.access || null);
          setShelfStatus(bookData?.shelfStatus || null);
        } else {
          setError("Could not load book details.");
        }

        if (reviewRes.status === "fulfilled") {
          const data = reviewRes.value.data;
          const list = data?.reviews ?? data?.data ?? (Array.isArray(data) ? data : []);
          setReviews(list);

          if (data?.averageRating !== undefined) {
            setBook((prev) =>
              prev
                ? {
                    ...prev,
                    averageRating: data.averageRating,
                    totalRatings: data.totalRatings ?? list.length,
                  }
                : prev
            );
          }
        }
      } catch {
        if (isActive) setError("Could not load book details.");
      }
    };

    load();
    return () => {
      isActive = false;
    };
  }, [id]);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowShelfMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleShelfSelect = async (status) => {
    const token = localStorage.getItem("token");
    if (!token) {
      notify.info("Login Required", "Please login to use your bookshelf.");
      navigate("/auth/login");
      return;
    }

    try {
      if (status) {
        await API.post("/bookshelf", { bookId: id, status });
        setShelfStatus(status);
        notify.success("Shelf Updated", `Added to "${SHELF_OPTIONS.find((o) => o.key === status)?.label}"`);
      } else {
        await API.delete(`/bookshelf/${id}`);
        setShelfStatus(null);
        notify.info("Removed", "Book removed from your shelf.");
      }
    } catch (err) {
      notify.error("Error", err.response?.data?.message || "Failed to update shelf.");
    }
  };

  const handleComment = async () => {
    if (!comment.trim()) return;

    if (!isLoggedIn) {
      notify.info("Login Required", "Please login to post a review.");
      navigate("/auth/login");
      return;
    }

    setPosting(true);
    try {
      const { data } = await API.post(`/books/${id}/reviews`, {
        comment: comment.trim(),
        rating: myRating > 0 ? myRating : undefined,
      });

      const currentUser = getCurrentUser();
      const newReview = data?.review ?? {
        _id: Date.now().toString(),
        user: { _id: currentUser?._id || "me", name: currentUser?.name || "You" },
        userName: currentUser?.name || "You",
        comment: comment.trim(),
        rating: myRating,
        createdAt: new Date().toISOString(),
      };

      setReviews((prev) => {
        const idx = prev.findIndex((r) => r._id === newReview._id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = newReview;
          return next;
        }
        return [newReview, ...prev];
      });

      if (data?.stats) {
        setBook((prev) =>
          prev
            ? {
                ...prev,
                averageRating: data.stats.averageRating ?? prev.averageRating,
                totalRatings: data.stats.totalRatings ?? prev.totalRatings,
              }
            : prev
        );
      } else if (myRating > 0) {
        setBook((prev) => {
          if (!prev) return prev;
          const ratings = [...reviews.map((r) => r.rating).filter(Boolean), myRating];
          const newAvg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
          return { ...prev, averageRating: newAvg, totalRatings: ratings.length };
        });
      }

      setComment("");
      setMyRating(0);
      notify.success("Review Posted", "Thanks for sharing your thoughts!");
    } catch (err) {
      notify.error("Error", err.response?.data?.message || "Failed to post review.");
    } finally {
      setPosting(false);
    }
  };

  const handleRatingChange = (value) => {
    if (!isLoggedIn) {
      notify.info("Login Required", "Please login to rate this book.");
      navigate("/auth/login");
      return;
    }
    setMyRating(value);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center flex flex-col items-center gap-3">
          <span className="text-2xl">:(</span>
          <p className="text-sm text-gray-500 dark:text-gray-400">{error}</p>
          <button onClick={() => navigate(-1)} className="text-xs text-indigo-600 hover:underline">
            Go back
          </button>
        </div>
      </div>
    );
  }

  if (!book) return <Skeleton />;

  const canRead = access?.canRead;
  const avgRating = Number.isFinite(book.averageRating) ? book.averageRating : 0;
  const totalReviews = Number.isFinite(book.totalRatings) ? book.totalRatings : reviews.length;
  const totalViews = Number.isFinite(book.views) ? book.views : 0;
  const totalReads = Number.isFinite(book.reads) ? book.reads : 0;
  const currentShelf = SHELF_OPTIONS.find((o) => o.key === shelfStatus);
  const isLongDesc = (book.description?.length ?? 0) > 200;

  return (
    <>
      {showDescModal && <DescriptionModal text={book.description} onClose={() => setShowDescModal(false)} />}

      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 px-4">
        <div className="max-w-4xl mx-auto flex flex-col gap-5">
          <button
            onClick={() => navigate(-1)}
            className="self-start flex items-center gap-1.5 text-sm text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <HiArrowLeft /> Back to Library
          </button>

          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
            <div className="flex flex-col md:flex-row">
              <div className="md:w-60 shrink-0 bg-gray-100 dark:bg-gray-800">
                {book.coverImage ? (
                  <img src={book.coverImage} alt={book.title} className="w-full h-72 md:h-full object-cover" />
                ) : (
                  <div className="w-full h-72 md:h-full flex items-center justify-center bg-gradient-to-br from-indigo-100 to-violet-200 dark:from-indigo-950/70 dark:to-violet-950/70">
                    <HiOutlineBookOpen className="text-indigo-300 dark:text-indigo-700 text-6xl" />
                  </div>
                )}
              </div>

              <div className="flex-1 p-7 flex flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white leading-snug">
                    {book.title}
                  </h1>

                  <div className="relative shrink-0 mt-1" ref={dropdownRef}>
                    <button
                      type="button"
                      onClick={() => setShowShelfMenu((v) => !v)}
                      title="Add to shelf"
                      className="transition-transform hover:scale-110 active:scale-95"
                    >
                      {shelfStatus ? (
                        <HiBookmark className="text-indigo-600 text-2xl" />
                      ) : (
                        <HiOutlineBookmark className="text-gray-300 dark:text-gray-600 text-2xl hover:text-indigo-500 transition-colors" />
                      )}
                    </button>

                    {showShelfMenu && (
                      <ShelfDropdown
                        current={shelfStatus}
                        onSelect={handleShelfSelect}
                        onClose={() => setShowShelfMenu(false)}
                      />
                    )}
                  </div>
                </div>

                {currentShelf && (
                  <div
                    className={`self-start flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${currentShelf.bg} ${currentShelf.color}`}
                  >
                    <span>{currentShelf.icon}</span>
                    {currentShelf.label}
                  </div>
                )}

                <p className="text-sm text-gray-500 dark:text-gray-400 -mt-2">
                  by <span className="font-medium text-gray-700 dark:text-gray-300">{book.author}</span>
                </p>

                <div className="flex items-center gap-2">
                  <StarRating value={avgRating} readonly />
                  <span className="text-xs text-gray-400">
                    {avgRating.toFixed(1)} - {totalReviews} rating{totalReviews !== 1 ? "s" : ""}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-400 flex-wrap">
                  <span className="inline-flex items-center gap-1">
                    <HiOutlineEye className="text-sm" /> {totalViews} view{totalViews !== 1 ? "s" : ""}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <HiOutlineBookOpen className="text-sm" /> {totalReads} read{totalReads !== 1 ? "s" : ""}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {book.genre && (
                    <span className="text-xs font-medium px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500">
                      {book.genre}
                    </span>
                  )}
                  {book.category && (
                    <span className="text-xs font-medium px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500">
                      {book.category}
                    </span>
                  )}
                  {book.isPaid ? (
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 border border-indigo-100 dark:border-indigo-800/50">
                      Rs. {book.price}
                    </span>
                  ) : (
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 border border-emerald-100 dark:border-emerald-800/50">
                      Free
                    </span>
                  )}
                </div>

                <div className="h-px bg-gray-100 dark:bg-gray-800" />

                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-3">
                    {book.description || "No description available for this book."}
                  </p>
                  {isLongDesc && (
                    <button
                      type="button"
                      onClick={() => setShowDescModal(true)}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline mt-1.5 font-medium"
                    >
                      Read more
                    </button>
                  )}
                </div>

                <div
                  className={`self-start flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border ${
                    canRead
                      ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border-emerald-100 dark:border-emerald-900"
                      : "bg-amber-50 dark:bg-amber-950/40 text-amber-600 border-amber-100 dark:border-amber-900"
                  }`}
                >
                  {canRead ? <HiOutlineCheckCircle /> : <HiOutlineLockClosed />}
                  {canRead ? "You have access" : "Purchase required"}
                </div>

                <div className="flex items-center gap-3 mt-auto pt-1">
                  {canRead ? (
                    <button
                      type="button"
                      onClick={() => navigate(`/read/${book._id}`)}
                      className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all hover:-translate-y-px"
                    >
                      <HiOutlineBookOpen /> Read Now
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => navigate(`/purchase/${book._id}`)}
                      className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all hover:-translate-y-px"
                    >
                      Buy - Rs. {book.price}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="px-5 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-500 hover:border-indigo-300 hover:text-indigo-600 text-sm font-medium rounded-xl transition-all"
                  >
                    Go Back
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-800">
              <HiOutlineChatBubbleLeftRight className="text-indigo-500 text-lg" />
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Ratings and Reviews</h2>
              <span className="ml-auto text-xs text-gray-400">{reviews.length} reviews</span>
            </div>

            <RatingSummary reviews={reviews} avgRating={avgRating} totalReviews={totalReviews} />

            <div className="space-y-1">
              <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Your Rating</p>
              <StarRating value={myRating} onChange={handleRatingChange} />
              {!isLoggedIn && (
                <p className="text-[11px] text-gray-400">Login to rate or review.</p>
              )}
            </div>

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={isLoggedIn ? "Share your thoughts about this book..." : "Login to write a review..."}
              rows={3}
              disabled={!isLoggedIn}
              className="w-full text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
            />

            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">
                {myRating > 0 ? `Rated ${myRating} star${myRating > 1 ? "s" : ""}` : "No rating yet"}
              </p>
              <button
                type="button"
                onClick={handleComment}
                disabled={!isLoggedIn || !comment.trim() || posting}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all"
              >
                {posting ? "Posting..." : "Post Review"}
              </button>
            </div>
          </div>

          {reviews.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs text-gray-400 uppercase tracking-wide font-medium px-1">All Reviews</p>
              {reviews.map((review) => (
                <ReviewCard key={review._id} review={review} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
