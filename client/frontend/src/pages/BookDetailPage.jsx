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
  HiEllipsisVertical,
  HiOutlineLockClosed,
  HiOutlineStar,
  HiStar,
  HiXMark,
} from "react-icons/hi2";
import {
  fetchBookCollaborativeRecommendations,
  fetchBookDetail,
  fetchBookRecommendations,
} from "../services/bookService";
import { useNotification } from "../context/Notification";
import API from "../services/api";
import ContentBasedFilteringSidebar from "../components/recommendations/ContentBasedFilteringSidebar";
import CollaborativeFilteringBottom from "../components/recommendations/CollaborativeFilteringBottom";
import { getJwtPayload, isJwtExpired } from "../utils/jwt";

/* ─── Constants ─────────────────────────────────────────────────── */

const SHELF_OPTIONS = [
  {
    key: "reading",
    label: "Currently Reading",
    icon: <HiOutlineClock />,
    color: "text-sky-700",
    bg: "bg-sky-50 hover:bg-sky-100 border-sky-200",
  },
  {
    key: "completed",
    label: "Completed",
    icon: <HiOutlineCheckCircle />,
    color: "text-emerald-700",
    bg: "bg-emerald-50 hover:bg-emerald-100 border-emerald-200",
  },
  {
    key: "planned",
    label: "Plan to Read",
    icon: <HiOutlineBookmarkSquare />,
    color: "text-amber-700",
    bg: "bg-amber-50 hover:bg-amber-100 border-amber-200",
  },
];

const AVATAR_COLORS = [
  "bg-amber-600", "bg-stone-600", "bg-teal-600",
  "bg-rose-700",  "bg-indigo-600", "bg-lime-700",
];

/* ─── Helpers ───────────────────────────────────────────────────── */

function getCurrentUser() {
  const token = localStorage.getItem("token");
  if (!token) return null;
  if (isJwtExpired(token)) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return null;
  }
  const payload = getJwtPayload(token);
  const userId  = payload?.userId || payload?.id || payload?._id;
  if (!userId) return null;
  return { _id: String(userId), name: "You" };
}

function formatRelativeTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";
  const diff = Date.now() - date.getTime();
  if (diff <= 0) return "Just now";
  const s = Math.floor(diff / 1000);
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

/* ─── Shared UI ─────────────────────────────────────────────────── */

function StarRating({ value = 0, onChange, readonly = false, size = "text-base" }) {
  const [hover, setHover] = useState(0);
  const display = hover || value;
  return (
    <div className="flex items-center gap-px">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(s)}
          onMouseEnter={() => !readonly && setHover(s)}
          onMouseLeave={() => !readonly && setHover(0)}
          className={`${size} transition-colors ${readonly ? "cursor-default" : "cursor-pointer"}`}
        >
          {s <= display
            ? <HiStar className="text-amber-500" />
            : <HiOutlineStar className="text-stone-300 dark:text-stone-600" />}
        </button>
      ))}
    </div>
  );
}

function Avatar({ name, size = "w-8 h-8 text-xs" }) {
  const color = AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
  return (
    <div className={`${size} ${color} rounded-full flex items-center justify-center text-white font-bold shrink-0`}>
      {name[0].toUpperCase()}
    </div>
  );
}

/* ─── Skeleton ──────────────────────────────────────────────────── */

function Skeleton() {
  return (
    <div className="min-h-screen animate-pulse bg-[#faf8f3] dark:bg-[#18160f]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="h-3 w-24 rounded bg-stone-200 dark:bg-stone-800" />
        <div className="mt-8 grid gap-8 md:grid-cols-[225px_minmax(0,1fr)] md:items-start">
          <div className="mx-auto w-full max-w-[225px] md:mx-0">
            <div className="aspect-[177/266] w-full rounded-[3px] bg-stone-200 dark:bg-stone-800" />
            <div className="mt-3 h-9 w-full rounded-[3px] bg-stone-200 dark:bg-stone-800" />
          </div>

          <div className="min-w-0 space-y-2">
            <div className="h-3 w-24 rounded bg-stone-200 dark:bg-stone-800" />
            <div className="h-10 w-5/6 rounded bg-stone-200 dark:bg-stone-800" />
            <div className="h-4 w-2/5 rounded bg-stone-200 dark:bg-stone-800" />

            <div className="flex items-center gap-3">
              <div className="h-4 w-24 rounded bg-stone-200 dark:bg-stone-800" />
              <div className="h-4 w-10 rounded bg-stone-200 dark:bg-stone-800" />
              <div className="h-4 w-20 rounded bg-stone-200 dark:bg-stone-800" />
            </div>

            <div className="h-6 w-24 rounded-sm bg-stone-200 dark:bg-stone-800" />

            <div className="mt-3 h-24 rounded bg-stone-100 dark:bg-stone-800" />

            <div className="mt-3 flex gap-3">
              <div className="h-11 w-36 rounded-sm bg-stone-200 dark:bg-stone-800" />
              <div className="h-11 w-11 rounded-sm bg-stone-200 dark:bg-stone-800" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Modals ────────────────────────────────────────────────────── */

function Overlay({ onClose, children }) {
  useEffect(() => {
    const esc = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", esc);
    
    // Store the current scroll position
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollTop}px`;
    document.body.style.width = "100%";
    
    return () => {
      document.removeEventListener("keydown", esc);
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      window.scrollTo(0, scrollTop);
    };
  }, [onClose]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-4 pb-4 sm:pb-0 pointer-events-auto"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        className="bg-[#faf8f3] dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col rounded-[3px] pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function ModalHeader({ title, onClose }) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200 dark:border-stone-700 shrink-0">
      <p className="font-serif text-[15px] font-semibold text-stone-900 dark:text-stone-50">{title}</p>
      <button
        onClick={onClose}
        className="w-7 h-7 flex items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
      >
        <HiXMark className="text-lg" />
      </button>
    </div>
  );
}

function DescriptionModal({ text, onClose }) {
  return (
    <Overlay onClose={onClose}>
      <ModalHeader title="About this book" onClose={onClose} />
      <div className="px-6 py-5 overflow-y-auto">
        <p className="font-serif text-[15px] leading-7 text-stone-600 dark:text-stone-400">{text}</p>
      </div>
    </Overlay>
  );
}

function ReviewsModal({
  reviews, avgRating, totalReviews, onClose,
  myReviewId, openReviewMenuId, onMenuToggle, onEditMyReview, onDeleteMyReview,
}) {
  const counts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  return (
    <Overlay onClose={onClose}>
      <ModalHeader title={`Reviews · ${reviews.length}`} onClose={onClose} />
      
      {/* Rating Breakdown - Fixed at top */}
      {totalReviews > 0 && (
        <div className="px-6 py-5 border-b border-stone-200 dark:border-stone-700 shrink-0">
          <div className="flex items-center gap-6">
            <div className="text-center shrink-0">
              <p className="font-serif text-3xl font-bold text-stone-900 dark:text-stone-50 leading-none">
                {avgRating.toFixed(1)}
              </p>
              <StarRating value={Math.round(avgRating)} readonly size="text-sm" />
              <p className="text-[10px] text-stone-400 mt-1">
                {totalReviews} rating{totalReviews !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex-1 space-y-1.5">
              {counts.map(({ star, count }) => {
                const pct = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
                return (
                  <div key={star} className="flex items-center gap-2">
                    <span className="text-[10px] text-stone-400 w-2.5 text-right shrink-0">{star}</span>
                    <HiStar className="text-amber-400 text-[9px] shrink-0" />
                    <div className="flex-1 h-1.5 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-stone-400 w-8 shrink-0 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Reviews - Scrollable */}
      <div className="overflow-y-auto divide-y divide-stone-100 dark:divide-stone-800">
        {reviews.length === 0 ? (
          <p className="text-sm text-stone-400 text-center py-12">No reviews yet.</p>
        ) : (
          reviews.map((r) => (
            <ReviewRow
              key={r._id}
              review={r}
              isMine={Boolean(myReviewId && String(r?._id) === String(myReviewId))}
              menuOpen={Boolean(openReviewMenuId && String(openReviewMenuId) === String(r?._id))}
              onMenuToggle={onMenuToggle}
              onEdit={onEditMyReview}
              onDelete={myReviewId ? onDeleteMyReview : undefined}
            />
          ))
        )}
      </div>
    </Overlay>
  );
}

/* ─── Shelf Dropdown ────────────────────────────────────────────── */

function ShelfDropdown({ current, onSelect, onClose }) {
  return (
    <div className="absolute right-0 top-11 z-40 w-56 bg-[#faf8f3] dark:bg-stone-900 rounded-[3px] border border-stone-200 dark:border-stone-700 shadow-xl overflow-hidden">
      <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-stone-400 px-4 pt-3 pb-1.5">
        Add to shelf
      </p>
      {SHELF_OPTIONS.map((opt) => (
        <button
          key={opt.key}
          onClick={() => { onSelect(opt.key); onClose(); }}
          className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] transition-colors ${
            current === opt.key
              ? `${opt.color} font-semibold bg-indigo-50/70 dark:bg-stone-800`
              : "text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
          }`}
        >
          <span className={`text-sm ${current === opt.key ? opt.color : "text-stone-400"}`}>{opt.icon}</span>
          {opt.label}
          {current === opt.key && <span className="ml-auto text-[10px] text-stone-400">✓</span>}
        </button>
      ))}
      {current && (
        <button
          onClick={() => { onSelect(null); onClose(); }}
          className="w-full flex items-center gap-2 px-4 py-2.5 text-[12px] text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 border-t border-stone-200 dark:border-stone-700 transition-colors"
        >
          Remove from shelf
        </button>
      )}
    </div>
  );
}

/* ─── Rating Bar ────────────────────────────────────────────────── */

function RatingBar({ reviews, avgRating, totalReviews, onShowMore }) {
  const counts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));
  
  const displayCounts = counts.slice(0, 2);
  
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-6">
        <div className="text-center shrink-0">
          <p className="font-serif text-4xl font-bold text-stone-900 dark:text-stone-50 leading-none">
            {avgRating.toFixed(1)}
          </p>
          <StarRating value={Math.round(avgRating)} readonly size="text-sm" />
          <p className="text-[10px] text-stone-400 mt-1">
            {totalReviews} rating{totalReviews !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex-1 space-y-1.5">
          {displayCounts.map(({ star, count }) => {
            const pct = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
            return (
              <div key={star} className="flex items-center gap-2">
                <span className="text-[10px] text-stone-400 w-2.5 text-right shrink-0">{star}</span>
                <HiStar className="text-amber-400 text-[9px] shrink-0" />
                <div className="flex-1 h-1 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-[10px] text-stone-400 w-4 shrink-0 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
      {onShowMore && (
        <button
          onClick={onShowMore}
          className="text-[12px] font-semibold text-indigo-900 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
        >
          See more ratings
        </button>
      )}
    </div>
  );
}

/* ─── Review Row ────────────────────────────────────────────────── */

function ReviewRow({ review, clamp = false, isMine = false, menuOpen = false, onMenuToggle, onEdit, onDelete }) {
  const name = typeof review.user === "object" ? review.user?.name || "Reader" : review.userName || "Reader";
  const timeValue = review.updatedAt ?? review.createdAt;
  const isEdited =
    review.updatedAt && review.createdAt &&
    new Date(review.updatedAt).getTime() - new Date(review.createdAt).getTime() > 60 * 1000;

  return (
    <div className="flex gap-3.5 px-5 py-4">
      <Avatar name={name} size="w-7 h-7 text-[11px]" />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-[13px] font-semibold text-stone-800 dark:text-stone-200">{name}</span>
              {review.rating > 0 && <StarRating value={review.rating} readonly size="text-xs" />}
            </div>
            <span className="text-[10.5px] italic text-stone-400 mt-0.5 block">
              {formatRelativeTime(timeValue)}{isEdited ? " · edited" : ""}
            </span>
          </div>
          {isMine && (onEdit || onDelete) && (
            <div className="relative shrink-0">
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // Ensure we're only toggling this specific review's menu
                  onMenuToggle?.(String(review._id));
                }}
                className="w-7 h-7 flex items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
              >
                <HiEllipsisVertical />
              </button>
              {menuOpen && (
                <div
                  className="absolute right-0 top-8 z-50 w-28 bg-[#faf8f3] dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shadow-xl rounded-[3px] overflow-visible"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  role="presentation"
                >
                  {onEdit && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onMenuToggle?.("");
                        onEdit(review);
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-medium text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
                    >Edit</button>
                  )}
                  {onDelete && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onMenuToggle?.("");
                        onDelete(review);
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                    >Delete</button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        <p className={`mt-1.5 text-[13px] leading-relaxed text-stone-500 dark:text-stone-400${clamp ? " line-clamp-3" : ""}`}>
          {review.comment}
        </p>
      </div>
    </div>
  );
}

/* ─── Section Divider ───────────────────────────────────────────── */
function SectionTitle({ children }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <h2 className="font-serif text-[17px] font-semibold text-stone-800 dark:text-stone-100 whitespace-nowrap">
        {children}
      </h2>
      <div className="flex-1 border-t border-dashed border-stone-300 dark:border-stone-700" />
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────────── */

export default function BookDetailPage() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const notify   = useNotification();

  const [book,   setBook]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [access,  setAccess]  = useState(null);
  const [error,   setError]   = useState(null);

  const [shelfStatus,   setShelfStatus]   = useState(null);
  const [showShelfMenu, setShowShelfMenu] = useState(false);

  const [showDescModal,    setShowDescModal]    = useState(false);
  const [showReviewsModal, setShowReviewsModal] = useState(false);

  const [myRating,       setMyRating]       = useState(0);
  const [comment,        setComment]        = useState("");
  const [reviews,        setReviews]        = useState([]);
  const [posting,        setPosting]        = useState(false);
  const [deletingReview, setDeletingReview] = useState(false);
  const [myReviewId,     setMyReviewId]     = useState(null);
  const [openReviewMenuId, setOpenReviewMenuId] = useState("");

  const [recommendations,         setRecommendations]         = useState([]);
  const [recommendationsLoading,  setRecommendationsLoading]  = useState(false);
  const [collabRecommendations,        setCollabRecommendations]        = useState([]);
  const [collabRecommendationsLoading, setCollabRecommendationsLoading] = useState(false);

  const isLoggedIn     = Boolean(localStorage.getItem("token"));
  const dropdownRef    = useRef(null);
  const reviewEditorRef = useRef(null);

  /* ── Data loading ── */
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null); setBook(null); setAccess(null); setReviews([]);
    setShelfStatus(null); setMyReviewId(null); setMyRating(0); setComment("");
    setOpenReviewMenuId("");
    setRecommendations([]); setRecommendationsLoading(true);
    setCollabRecommendations([]); setCollabRecommendationsLoading(true);

    (async () => {
      try {
        const [bookRes, reviewRes, recRes, collabRes] = await Promise.allSettled([
          fetchBookDetail(id),
          API.get(`/books/${id}/reviews`),
          fetchBookRecommendations(id, { limit: 12 }),
          fetchBookCollaborativeRecommendations(id, { limit: 12 }),
        ]);
        if (!active) return;

        if (bookRes.status === "fulfilled") {
          const d = bookRes.value.data?.book || bookRes.value.data;
          setBook(d);
          setAccess(bookRes.value.data?.access || null);
          setShelfStatus(d?.shelfStatus || null);
        } else {
          setError("Could not load book details.");
        }

        if (reviewRes.status === "fulfilled") {
          const d    = reviewRes.value.data;
          const list = d?.reviews ?? d?.data ?? (Array.isArray(d) ? d : []);
          setReviews(list);
          const me   = getCurrentUser();
          const mine = me?._id
            ? list.find((r) => {
                const uid = typeof r.user === "object" ? r.user?._id : r.user;
                return uid && String(uid) === String(me._id);
              })
            : null;
          if (mine) {
            setMyReviewId(mine._id);
            setMyRating(Number.isFinite(mine.rating) ? mine.rating : 0);
            setComment(typeof mine.comment === "string" ? mine.comment : "");
          }
          if (d?.averageRating !== undefined) {
            setBook((prev) =>
              prev ? { ...prev, averageRating: d.averageRating, totalRatings: d.totalRatings ?? list.length } : prev
            );
          }
        }

        if (recRes.status === "fulfilled") {
          const d = recRes.value.data;
          setRecommendations(d?.books ?? d?.data ?? (Array.isArray(d) ? d : []));
        }
        if (collabRes.status === "fulfilled") {
          const d = collabRes.value.data;
          setCollabRecommendations(d?.books ?? d?.data ?? (Array.isArray(d) ? d : []));
        }
      } catch {
        if (active) setError("Could not load book details.");
      } finally {
        if (active) {
          setLoading(false);
          setRecommendationsLoading(false);
          setCollabRecommendationsLoading(false);
        }
      }
    })();
    return () => { active = false; };
  }, [id]);

  /* ── Click-outside for dropdowns ── */
  useEffect(() => {
    const fn = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowShelfMenu(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  // Close review menu when modal opens
  useEffect(() => {
    if (showReviewsModal) {
      setOpenReviewMenuId("");
    }
  }, [showReviewsModal]);

  useEffect(() => {
    // Only set up click listener if modal is open and menu is open
    if (!openReviewMenuId || !showReviewsModal) return;
    
    const handleClickOutside = (e) => {
      // Check if click is on a button or inside the menu with role="presentation"
      const isMenuContent = e.target?.closest('[role="presentation"]');
      const isButton = e.target?.closest('button');
      
      // Only close if clicking completely outside both
      if (!isMenuContent && !isButton) {
        setOpenReviewMenuId("");
      }
    };
    
    // Use capture phase and small delay to avoid closing on the opening click
    const timeoutId = setTimeout(() => {
      document.addEventListener("click", handleClickOutside, true);
    }, 5);
    
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("click", handleClickOutside, true);
    };
  }, [openReviewMenuId, showReviewsModal]);

  /* ── Handlers ── */
  const handleShelfSelect = async (status) => {
    if (!localStorage.getItem("token")) {
      notify.info("Login Required", "Please login to use your bookshelf.");
      navigate("/auth/login"); return;
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

  const handleReadNow = () => {
    if (!localStorage.getItem("token")) {
      notify.info("Login Required", "Please login to read this book.");
      navigate("/auth/login");
      return;
    }
    navigate(`/read/${book._id}`, {
      state: { bookTitle: book?.title?.trim() || "Book Reader" },
    });
  };

  const handleComment = async () => {
    if (!comment.trim()) return;
    if (!isLoggedIn) { notify.info("Login Required", "Please login to post a review."); navigate("/auth/login"); return; }
    setPosting(true);
    try {
      const { data } = await API.post(`/books/${id}/reviews`, {
        comment: comment.trim(),
        rating: myRating > 0 ? myRating : undefined,
      });
      const me = getCurrentUser();
      const newReview = data?.review ?? {
        _id: Date.now().toString(),
        user: { _id: me?._id || "me", name: me?.name || "You" },
        comment: comment.trim(), rating: myRating,
        createdAt: new Date().toISOString(),
      };
      setMyReviewId(newReview._id);
      setReviews((prev) => {
        const idx = prev.findIndex((r) => r._id === newReview._id);
        if (idx >= 0) { const next = [...prev]; next[idx] = newReview; return next; }
        return [newReview, ...prev];
      });
      if (data?.stats) {
        setBook((prev) =>
          prev ? { ...prev, averageRating: data.stats.averageRating ?? prev.averageRating, totalRatings: data.stats.totalRatings ?? prev.totalRatings } : prev
        );
      }
      notify.success("Saved", "Your review has been saved.");
    } catch (err) {
      notify.error("Error", err.response?.data?.message || "Failed to post review.");
    } finally { setPosting(false); }
  };

  const handleEditMyReview = (review) => {
    if (!isLoggedIn) { notify.info("Login Required", "Please login to edit your review."); navigate("/auth/login"); return; }
    if (!review?._id) return;
    setMyReviewId(review._id);
    setMyRating(Number.isFinite(Number(review.rating)) ? Number(review.rating) : 0);
    setComment(typeof review.comment === "string" ? review.comment : "");
    setShowReviewsModal(false);
    setOpenReviewMenuId("");
    setTimeout(() => reviewEditorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
  };

  const handleDeleteMyReview = async (review) => {
    if (!isLoggedIn) { notify.info("Login Required", "Please login to delete your review."); navigate("/auth/login"); return; }
    if (deletingReview) return;
    const reviewId = review?._id ?? myReviewId;
    if (!reviewId) return;
    
    // Close menu first
    setOpenReviewMenuId("");
    
    // Show confirmation
    if (!window.confirm("Delete your review?")) return;
    
    // Close modal and start deletion
    setShowReviewsModal(false);
    setDeletingReview(true);
    try {
      const { data } = await API.delete(`/books/${id}/reviews`);
      setReviews((prev) => prev.filter((r) => String(r?._id) !== String(reviewId)));
      setMyReviewId(null); setMyRating(0); setComment(""); setOpenReviewMenuId("");
      if (data?.stats) {
        setBook((prev) =>
          prev ? { ...prev, averageRating: data.stats.averageRating ?? prev.averageRating, totalRatings: data.stats.totalRatings ?? prev.totalRatings } : prev
        );
      }
      notify.success("Deleted", "Your review has been deleted.");
    } catch (err) {
      notify.error("Error", err.response?.data?.message || "Failed to delete review.");
    } finally { setDeletingReview(false); }
  };

  const handleRatingChange = (value) => {
    if (!isLoggedIn) { notify.info("Login Required", "Please login to rate this book."); navigate("/auth/login"); return; }
    setMyRating(value);
  };

  /* ── Derived values ── */
  if (error) return (
    <div className="min-h-screen bg-[#faf8f3] dark:bg-[#18160f] flex items-center justify-center">
      <div className="text-center space-y-3">
        <p className="font-serif text-base text-stone-600 dark:text-stone-400">{error}</p>
        <button onClick={() => navigate(-1)} className="text-[13px] text-indigo-900 hover:underline dark:text-indigo-400">Go back</button>
      </div>
    </div>
  );

  if (loading) return <Skeleton />;
  if (!book) return null;

  const canRead       = access?.canRead;
  const avgRating     = Number.isFinite(book.averageRating) ? book.averageRating : 0;
  const totalReviews  = Number.isFinite(book.totalRatings)  ? book.totalRatings  : reviews.length;
  const totalReads    = Number.isFinite(book.reads)         ? book.reads         : 0;
  const currentShelf  = SHELF_OPTIONS.find((o) => o.key === shelfStatus);
  const isLongDesc    = (book.description?.length ?? 0) > 220;
  const priceLabel    = book.isPaid ? `Rs. ${book.price}` : "Free";

  const sortedReviews = [...reviews].sort((a, b) => {
    const aT = a?.updatedAt || a?.createdAt ? new Date(a.updatedAt ?? a.createdAt).getTime() : 0;
    const bT = b?.updatedAt || b?.createdAt ? new Date(b.updatedAt ?? b.createdAt).getTime() : 0;
    return bT - aT;
  });

  const myReview      = myReviewId ? sortedReviews.find((r) => String(r?._id) === String(myReviewId)) : null;
  const previewReviews = myReview ? [myReview, ...sortedReviews.filter((r) => String(r._id) !== String(myReviewId)).slice(0, 1)] : sortedReviews.slice(0, 2);
  const hasMoreReviews = sortedReviews.length > previewReviews.length;

  const otherInfo = [
    { label: "Pages",       value: book.pageCount       ? `${book.pageCount}` : "—" },
    { label: "Published",   value: book.publicationDate?.trim() || "—" },
    { label: "ISBN",        value: book.isbn?.trim()     || "—" },
    { label: "Language",    value: book.language?.trim() || "—" },
  ];

  /* ── Render ── */
  return (
    <>
      {showDescModal    && <DescriptionModal text={book.description} onClose={() => setShowDescModal(false)} />}
      {showReviewsModal && (
        <ReviewsModal
          reviews={sortedReviews} avgRating={avgRating} totalReviews={totalReviews}
          myReviewId={myReviewId} openReviewMenuId={openReviewMenuId}
          onMenuToggle={(rid) => setOpenReviewMenuId((prev) => String(prev) === String(rid) ? "" : String(rid))}
          onEditMyReview={handleEditMyReview} onDeleteMyReview={handleDeleteMyReview}
          onClose={() => setShowReviewsModal(false)}
        />
      )}

      <div className="min-h-screen bg-[#faf8f3] dark:bg-[#18160f] font-sans">

        {/* ── Top bar ─────────────────────────────────────────── */}
        <div className="border-b border-stone-200/70 dark:border-stone-800">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
            >
              <HiArrowLeft /> Back to Library
            </button>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-12 xl:grid-cols-[minmax(0,1fr)_300px]">

            {/* ── Left column ─────────────────────────────────── */}
            <div className="space-y-12">

              {/* ── HERO: Cover + Meta ──────────────────────────── */}
              <div className="grid gap-8 md:grid-cols-[225px_minmax(0,1fr)] md:items-start">

                {/* Cover */}
                <div className="mx-auto w-full max-w-[225px] md:mx-0 shrink-0">
                  {/* Physical book shadow */}
                  <div
                    className="relative rounded-[3px] overflow-hidden"
                    style={{ boxShadow: "4px 6px 20px rgba(60,40,10,0.18), 1px 2px 4px rgba(60,40,10,0.12)" }}
                  >
                    <div className="aspect-[177/266] w-full bg-indigo-50">
                      {book.coverImage ? (
                        <img src={book.coverImage} alt={book.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-indigo-50 via-violet-50 to-indigo-100">
                          <HiOutlineBookOpen className="text-5xl text-indigo-300" />
                        </div>
                      )}
                    </div>
                    {/* Spine gloss */}
                    <div className="pointer-events-none absolute inset-y-0 left-0 w-[6px] bg-gradient-to-r from-black/10 to-transparent" />
                  </div>

                  {/* Shelf button — responsive on all devices */}
                  <div className="relative mt-3" ref={dropdownRef}>
                    <button
                      type="button"
                      onClick={() => setShowShelfMenu((v) => !v)}
                      className={`w-full flex items-center justify-center gap-2 py-3 px-4 text-[13px] font-semibold border transition-colors rounded-[3px] ${
                        shelfStatus
                          ? "border-indigo-300 bg-indigo-50 text-indigo-900 dark:border-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300"
                          : "border-stone-300 bg-white text-stone-500 hover:border-indigo-700 hover:text-indigo-900 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-400 dark:hover:border-indigo-500 dark:hover:text-indigo-300"
                      }`}
                    >
                      {shelfStatus ? <HiBookmark className="text-indigo-700 dark:text-indigo-300" /> : <HiOutlineBookmark />}
                      {currentShelf ? currentShelf.label : "Add to Shelf"}
                    </button>
                    {showShelfMenu && (
                      <ShelfDropdown current={shelfStatus} onSelect={handleShelfSelect} onClose={() => setShowShelfMenu(false)} />
                    )}
                  </div>
                </div>

                {/* Meta */}
                <div className="min-w-0 space-y-2">

                  {/* Genre / category crumb */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.18em] leading-tight text-indigo-900 dark:text-indigo-400">
                    {book.genre && <span>{book.genre}</span>}
                    {book.genre && book.category && <span className="text-stone-300 dark:text-stone-600">·</span>}
                    {book.category && <span>{book.category}</span>}
                  </div>

                  {/* Title */}
                  <h1 className="font-serif text-[2.2rem] sm:text-[2.6rem] font-bold leading-[1.1] tracking-tight text-stone-900 dark:text-stone-50">
                    {book.title}
                  </h1>

                  {/* Author */}
                  <p className="font-sans italic text-[14px] font-semibold leading-tight text-stone-500 dark:text-stone-400">
                    by <span className="font-medium italic text-stone-900 dark:text-stone-100">
                      {book.author || "Unknown Author"}
                    </span>
                  </p>

                  {/* Rating row */}
                  <div className="flex flex-wrap items-center gap-3 leading-tight">
                    <div className="flex items-center gap-2">
                      <StarRating value={avgRating} readonly size="text-base" />
                      <span className="font-serif text-[15px] font-semibold leading-tight text-stone-700 dark:text-stone-300">
                        {avgRating.toFixed(1)}
                      </span>
                    </div>
                    <span className="text-stone-300 dark:text-stone-700">·</span>
                    <button
                      onClick={() => setShowReviewsModal(true)}
                      className="text-[13px] leading-tight text-stone-500 hover:text-indigo-900 dark:hover:text-indigo-300 transition-colors"
                    >
                      {totalReviews} review{totalReviews !== 1 ? "s" : ""}
                    </button>
                    <span className="text-stone-300 dark:text-stone-700">·</span>
                    <span className="text-[13px] leading-tight text-stone-400">{totalReads} reads</span>
                  </div>

                  {/* Price + shelf badge */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-sm px-2.5 py-1 text-[12px] font-bold uppercase tracking-widest font-ui ${
                        book.isPaid
                          ? "bg-indigo-100 text-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300"
                          : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                      }`}
                    >
                      {priceLabel}
                    </span>
                    {currentShelf && (
                      <span className={`inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest border ${currentShelf.bg} ${currentShelf.color}`}>
                        {currentShelf.icon}{currentShelf.label}
                      </span>
                    )}
                  </div>

                  {/* CTA button */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-10">
                    {canRead ? (
                      <button
                        type="button"
                        onClick={handleReadNow}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2.5 rounded-sm bg-stone-900 px-6 py-3 text-[13.5px] font-bold text-white shadow-sm hover:bg-stone-800 dark:bg-indigo-500 dark:text-white dark:hover:bg-indigo-400 transition-colors mb-3 mt-10"
                      >
                        <HiOutlineBookOpen className="text-base" /> Read Now
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => navigate(`/purchase/${book._id}`)}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2.5 rounded-md bg-indigo-900 px-6 py-3.5 text-[13.5px] font-bold text-white shadow-[0_14px_34px_rgba(49,46,129,0.22)] ring-1 ring-indigo-950/10 transition-all hover:-translate-y-0.5 hover:bg-indigo-800 dark:bg-indigo-500 dark:hover:bg-indigo-400 mb-3 mt-10"
                      >
                        <HiOutlineLockClosed className="text-base" />
                        Unlock Access · <span className="font-ui">{priceLabel}</span>
                      </button>
                    )}
                  </div>

                  {/* Description */}
                  <div className="pt-2 border-t border-dashed border-stone-200 dark:border-stone-800">
                    <p className="font-serif text-[14.5px] leading-7 text-stone-600 dark:text-stone-400">
                      {isLongDesc
                        ? book.description.slice(0, 220).trimEnd() + "…"
                        : (book.description || "No description available.")}
                    </p>
                    {isLongDesc && (
                      <button
                        type="button"
                        onClick={() => setShowDescModal(true)}
                        className="mt-1.5 text-[12.5px] font-semibold text-indigo-900 hover:text-indigo-700 dark:text-indigo-400"
                      >
                        Read more
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Book Details Table ───────────────────────────── */}
              <section>
                <SectionTitle>Book Details</SectionTitle>
                <div className="border border-stone-200 dark:border-stone-800 rounded-[3px] divide-y divide-stone-100 dark:divide-stone-800 overflow-hidden">
                  {otherInfo.map((item, i) => (
                    <div key={item.label} className={`flex items-center px-5 py-3.5 ${i % 2 === 0 ? "bg-white dark:bg-stone-900/40" : "bg-stone-50/60 dark:bg-stone-900/20"}`}>
                      <span className="w-36 shrink-0 text-[11px] font-bold uppercase tracking-[0.14em] text-stone-400">
                        {item.label}
                      </span>
                      <span className="font-serif text-[14px] text-stone-800 dark:text-stone-200">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              {/* ── Reviews ─────────────────────────────────────── */}
              <section>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <h2 className="font-serif text-[17px] font-semibold text-stone-800 dark:text-stone-100">
                      Reviews
                    </h2>
              </div>
                  <div className="flex items-center gap-3">
                    {hasMoreReviews && (
                      <button
                        onClick={() => setShowReviewsModal(true)}
                        className="text-[11.5px] font-bold uppercase tracking-wider text-indigo-900 hover:text-indigo-700 dark:text-indigo-400"
                      >
                        See all (                    
                        {reviews.length > 0 && (
                          <span className="text-[11px] font-bold uppercase tracking-widest text-indigo-900">
                            {reviews.length}
                          </span>
                        )})
                      </button>
                    )}
                  </div>
                </div>

                {/* Review list */}
                <div className="border border-stone-200 dark:border-stone-800 rounded-[3px] divide-y divide-stone-100 dark:divide-stone-800 overflow-hidden">
                  {previewReviews.length > 0 ? (
                    previewReviews.map((r) => (
                      <ReviewRow
                        key={r._id}
                        review={r}
                        clamp
                        isMine={Boolean(myReviewId && String(r?._id) === String(myReviewId))}
                        menuOpen={!showReviewsModal && Boolean(openReviewMenuId && String(openReviewMenuId) === String(r?._id))}
                        onMenuToggle={(rid) => setOpenReviewMenuId((prev) => String(prev) === String(rid) ? "" : String(rid))}
                        onEdit={handleEditMyReview}
                        onDelete={myReviewId ? handleDeleteMyReview : undefined}
                      />
                    ))
                  ) : (
                    <div className="flex items-center justify-center py-12 px-6 text-center">
                      <div>
                        <HiOutlineChatBubbleLeftRight className="mx-auto text-2xl text-stone-300 dark:text-stone-700 mb-2" />
                        <p className="font-serif text-[14px] text-stone-500 dark:text-stone-500">No reviews yet — be the first.</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Write / edit review */}
                <div
                  ref={reviewEditorRef}
                  className="mt-5 border border-stone-200 dark:border-stone-800 rounded-[3px] bg-white dark:bg-stone-900/40 p-5"
                >
                  <div className="flex items-center justify-between mb-4">
                    <p className="font-serif text-[15px] font-semibold text-stone-800 dark:text-stone-100">
                      {myReviewId ? "Edit your review" : "Write a review"}
                    </p>
                    <StarRating value={myRating} onChange={handleRatingChange} size="text-xl" />
                  </div>

                  {!isLoggedIn ? (
                    <p className="text-[13.5px] text-stone-400">
                      <button
                        onClick={() => navigate("/auth/login")}
                        className="font-semibold text-indigo-900 hover:underline dark:text-indigo-400"
                      >
                        Sign in
                      </button>{" "}
                      to leave a review.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Share your thoughts about this book…"
                        rows={4}
                        className="w-full resize-none rounded-[3px] border border-stone-200 bg-[#faf8f3] px-4 py-3 text-[13.5px] font-serif leading-relaxed text-stone-800 placeholder:text-stone-400 focus:border-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-900/15 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:focus:border-indigo-500"
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                          {myRating > 0 ? `${myRating} star${myRating > 1 ? "s" : ""}` : "No rating selected"}
                        </span>
                        <button
                          type="button"
                          onClick={handleComment}
                          disabled={!comment.trim() || posting || deletingReview}
                          className="rounded-sm bg-stone-900 px-5 py-2 text-[13px] font-bold text-white hover:bg-stone-800 dark:bg-indigo-500 dark:text-white dark:hover:bg-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          {posting ? "Saving…" : myReviewId ? "Update" : "Post"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* Similar books (mobile/tablet) */}
              <div className="xl:hidden">
                <SectionTitle>Similar Books</SectionTitle>
                <ContentBasedFilteringSidebar
                  books={recommendations}
                  loading={recommendationsLoading}
                  title=""
                  variant="large"
                  maxItems={4}
                  className="border-stone-200 dark:border-stone-800"
                />
              </div>

            </div>

            {/* ── Right sidebar ──────────────────────────────────── */}
            <aside className="hidden xl:block">
              <div className="xl:sticky xl:top-8">
                <SectionTitle>Similar Books</SectionTitle>
                <ContentBasedFilteringSidebar
                  books={recommendations}
                  loading={recommendationsLoading}
                  title=""
                  variant="large"
                  maxItems={4}
                  className="border-stone-200 dark:border-stone-800"
                />
              </div>
            </aside>

          </div>

          {/* ── Collaborative recs ──────────────────────────────── */}
          <div className="mt-14">
            <SectionTitle>Readers Also Enjoyed</SectionTitle>
            <CollaborativeFilteringBottom books={collabRecommendations} loading={collabRecommendationsLoading} />
          </div>

        </div>
      </div>
    </>
  );
}
