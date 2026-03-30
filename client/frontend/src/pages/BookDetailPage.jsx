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
  HiOutlineEye,
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


/* Constants */
const SHELF_OPTIONS = [
  {
    key: "reading",
    label: "Currently Reading",
    icon: <HiOutlineClock />,
    color: "text-indigo-600",
    bg: "bg-indigo-50 hover:bg-indigo-100 border-indigo-100",
  },
  {
    key: "completed",
    label: "Completed",
    icon: <HiOutlineCheckCircle />,
    color: "text-emerald-600",
    bg: "bg-emerald-50 hover:bg-emerald-100 border-emerald-100",
  },
  {
    key: "planned",
    label: "Plan to Read",
    icon: <HiOutlineBookmarkSquare />,
    color: "text-amber-600",
    bg: "bg-amber-50 hover:bg-amber-100 border-amber-100",
  },
];

const AVATAR_COLORS = [
  "bg-indigo-500", "bg-violet-500", "bg-emerald-500",
  "bg-rose-500", "bg-amber-500", "bg-sky-500",
];

/* Helpers */
function getCurrentUser() {
  const token = localStorage.getItem("token");
  if (!token) return null;

  if (isJwtExpired(token)) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return null;
  }

  const payload = getJwtPayload(token);
  const userId = payload?.userId || payload?.id || payload?._id;
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

/* Shared UI */

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
            ? <HiStar className="text-amber-400" />
            : <HiOutlineStar className="text-gray-300 dark:text-gray-600" />}
        </button>
      ))}
    </div>
  );
}

function Avatar({ name, size = "w-8 h-8 text-xs" }) {
  const color = AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
  return (
    <div className={`${size} ${color} rounded-full flex items-center justify-center text-white font-semibold shrink-0`}>
      {name[0].toUpperCase()}
    </div>
  );
}

function Badge({ children, color = "gray" }) {
  const map = {
    gray: "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400",
    indigo: "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 border border-indigo-100 dark:border-indigo-800/40",
    emerald: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 border border-emerald-100 dark:border-emerald-800/40",
    amber: "bg-amber-50 dark:bg-amber-950/50 text-amber-600 border border-amber-100 dark:border-amber-800/40",
  };
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded-full ${map[color]}`}>
      {children}
    </span>
  );
}

/* Skeleton */

function Skeleton() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 animate-pulse">
      <div className="page-container py-8">
        <div className="h-3 w-28 bg-gray-200 dark:bg-gray-800 rounded-full" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mt-4">
          <div className="lg:col-span-8 space-y-6">
            {/* Book panel */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
              <div className="flex flex-col sm:flex-row">
                <div className="sm:w-44 md:w-52 shrink-0 bg-gray-200 dark:bg-gray-800 h-60 sm:h-auto" />
                <div className="flex-1 p-6 space-y-3">
                  <div className="h-6 w-4/5 bg-gray-200 dark:bg-gray-800 rounded-full" />
                  <div className="h-4 w-2/5 bg-gray-200 dark:bg-gray-800 rounded-full" />
                  <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-800 rounded-full" />
                  <div className="flex flex-wrap gap-2 pt-1">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-5 w-20 bg-gray-200 dark:bg-gray-800 rounded-full" />
                    ))}
                  </div>
                  <div className="space-y-2 pt-1">
                    <div className="h-3 w-full bg-gray-200 dark:bg-gray-800 rounded-full" />
                    <div className="h-3 w-5/6 bg-gray-200 dark:bg-gray-800 rounded-full" />
                    <div className="h-3 w-4/6 bg-gray-200 dark:bg-gray-800 rounded-full" />
                  </div>
                  <div className="flex items-center gap-2 pt-3">
                    <div className="h-10 w-32 bg-gray-200 dark:bg-gray-800 rounded-xl" />
                    <div className="h-10 w-44 bg-gray-200 dark:bg-gray-800 rounded-xl" />
                  </div>
                </div>
              </div>
            </div>

            {/* Reviews */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden lg:h-[560px] flex flex-col">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <div className="h-4 w-28 bg-gray-200 dark:bg-gray-800 rounded-full" />
                <div className="h-4 w-16 bg-gray-200 dark:bg-gray-800 rounded-full" />
              </div>
              <div className="p-4 flex-1 min-h-0 space-y-3">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="border border-gray-100 dark:border-gray-800 rounded-2xl p-3 space-y-2">
                    <div className="h-3 w-1/3 bg-gray-200 dark:bg-gray-800 rounded-full" />
                    <div className="h-3 w-full bg-gray-200 dark:bg-gray-800 rounded-full" />
                    <div className="h-3 w-4/6 bg-gray-200 dark:bg-gray-800 rounded-full" />
                  </div>
                ))}
                <div className="mt-auto border-t border-gray-100 dark:border-gray-800 pt-4 space-y-3">
                  <div className="h-3 w-36 bg-gray-200 dark:bg-gray-800 rounded-full" />
                  <div className="h-24 w-full bg-gray-200 dark:bg-gray-800 rounded-2xl" />
                  <div className="flex items-center justify-between">
                    <div className="h-3 w-20 bg-gray-200 dark:bg-gray-800 rounded-full" />
                    <div className="h-9 w-28 bg-gray-200 dark:bg-gray-800 rounded-xl" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Similar books */}
          <aside className="hidden lg:block lg:col-span-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-5 lg:h-[560px]">
              <div className="h-5 w-40 bg-gray-200 dark:bg-gray-800 rounded-full mb-4" />
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-16 h-20 bg-gray-200 dark:bg-gray-800 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-4/5 bg-gray-200 dark:bg-gray-800 rounded-full" />
                      <div className="h-3 w-2/5 bg-gray-200 dark:bg-gray-800 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>

        {/* Bottom recommendations */}
        <div className="mt-8 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
          <div className="h-5 w-44 bg-gray-200 dark:bg-gray-800 rounded-full mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
                <div className="h-44 bg-gray-200 dark:bg-gray-800" />
                <div className="p-4 space-y-2">
                  <div className="h-3 w-4/5 bg-gray-200 dark:bg-gray-800 rounded-full" />
                  <div className="h-3 w-2/5 bg-gray-200 dark:bg-gray-800 rounded-full" />
                  <div className="h-8 w-full bg-gray-200 dark:bg-gray-800 rounded-xl mt-2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* Modals */
function Overlay({ onClose, children }) {
  useEffect(() => {
    const esc = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", esc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", esc);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-[2px] px-4 pb-4 sm:pb-0"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function ModalHeader({ title, onClose }) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-gray-800 shrink-0">
      <p className="text-sm font-semibold text-gray-900 dark:text-white">{title}</p>
      <button
        onClick={onClose}
        className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <HiXMark />
      </button>
    </div>
  );
}

function DescriptionModal({ text, onClose }) {
  return (
    <Overlay onClose={onClose}>
      <ModalHeader title="About this book" onClose={onClose} />
      <div className="px-5 py-4 overflow-y-auto">
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{text}</p>
      </div>
    </Overlay>
  );
}

function ReviewsModal({
  reviews,
  avgRating,
  totalReviews,
  onClose,
  myReviewId,
  openReviewMenuId,
  onMenuToggle,
  onEditMyReview,
  onDeleteMyReview,
}) {
  return (
    <Overlay onClose={onClose}>
      <ModalHeader title={`Reviews (${reviews.length})`} onClose={onClose} />
      {totalReviews > 0 && (
        <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <RatingBar reviews={reviews} avgRating={avgRating} totalReviews={totalReviews} />
        </div>
      )}
      <div className="overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
        {reviews.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">No reviews yet.</p>
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

/* Shelf Dropdown */

function ShelfDropdown({ current, onSelect, onClose }) {
  return (
    <div className="absolute right-0 top-9 z-40 w-52 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-xl overflow-hidden">
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 pt-3 pb-1.5">
        Add to Shelf
      </p>
      {SHELF_OPTIONS.map((opt) => (
        <button
          key={opt.key}
          onClick={() => { onSelect(opt.key); onClose(); }}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors border-l-2 ${
            current === opt.key
              ? `${opt.color} border-current bg-gray-50 dark:bg-gray-800 font-semibold`
              : "text-gray-600 dark:text-gray-400 border-transparent hover:bg-gray-50 dark:hover:bg-gray-800"
          }`}
        >
          <span className={`text-sm ${current === opt.key ? opt.color : ""}`}>{opt.icon}</span>
          {opt.label}
          {current === opt.key && (
            <span className="ml-auto text-[10px] text-gray-400">✓</span>
          )}
        </button>
      ))}
      {current && (
        <button
          onClick={() => { onSelect(null); onClose(); }}
          className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 border-t border-gray-100 dark:border-gray-800 transition-colors"
        >
          Remove from shelf
        </button>
      )}
    </div>
  );
}

/* Rating Bar */

function RatingBar({ reviews, avgRating, totalReviews }) {
  const counts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));
  return (
    <div className="flex items-center gap-5">
      <div className="text-center shrink-0">
        <p className="text-3xl font-bold text-gray-900 dark:text-white leading-none">
          {avgRating.toFixed(1)}
        </p>
        <StarRating value={Math.round(avgRating)} readonly size="text-xs" />
        <p className="text-[10px] text-gray-400 mt-0.5">
          {totalReviews} rating{totalReviews !== 1 ? "s" : ""}
        </p>
      </div>
      <div className="flex-1 space-y-1">
        {counts.map(({ star, count }) => {
          const pct = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
          return (
            <div key={star} className="flex items-center gap-1.5">
              <span className="text-[10px] text-gray-400 w-2.5 text-right shrink-0">{star}</span>
              <HiStar className="text-amber-400 text-[9px] shrink-0" />
              <div className="flex-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-[10px] text-gray-400 w-4 shrink-0 text-right">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* Review Row */
function ReviewRow({
  review,
  compact = false,
  clamp = false,
  isMine = false,
  menuOpen = false,
  onMenuToggle,
  onEdit,
  onDelete,
}) {
  const name =
    typeof review.user === "object"
      ? review.user?.name || "Reader"
      : review.userName || "Reader";

  const timeValue = review.updatedAt ?? review.createdAt;
  const isEdited =
    review.updatedAt &&
    review.createdAt &&
    new Date(review.updatedAt).getTime() - new Date(review.createdAt).getTime() > 60 * 1000;

  const commentClass = `text-xs text-gray-500 dark:text-gray-400 leading-relaxed${
    clamp ? " line-clamp-2" : ""
  }`;

  return (
    <div
      className={`${
        compact ? "px-4 py-3" : "px-5 py-3.5"
      } flex gap-3 rounded-xl transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/40`}
    >
      <Avatar
        name={name}
        size={compact ? "w-6 h-6 text-[10px]" : "w-7 h-7 text-[11px]"}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-0.5">
          <div className="min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">
                {name}
              </span>
              {review.rating > 0 && (
                <StarRating value={review.rating} readonly size="text-xs" />
              )}
            </div>
            <span className="block text-[10px] text-gray-400 mt-0.5">
              {formatRelativeTime(timeValue)}{isEdited ? " (Edited)" : ""}
            </span>
          </div>

          {isMine && (onEdit || onDelete) ? (
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onMenuToggle?.(review._id); }}
                onMouseDown={(e) => e.stopPropagation()}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Review actions"
                title="Actions"
              >
                <HiEllipsisVertical className="text-lg" />
              </button>

              {menuOpen ? (
                <div
                  className="absolute right-0 top-9 z-50 w-32 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xl rounded-xl overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  {onEdit ? (
                    <button
                      type="button"
                      onClick={() => { onMenuToggle?.(""); onEdit(review); }}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      Edit
                    </button>
                  ) : null}
                  {onDelete ? (
                    <button
                      type="button"
                      onClick={() => { onMenuToggle?.(""); onDelete(review); }}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                    >
                      Delete
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
        <p className={commentClass}>{review.comment}</p>
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
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [myRating, setMyRating] = useState(0);
  const [comment, setComment] = useState("");
  const [reviews, setReviews] = useState([]);
  const [posting, setPosting] = useState(false);
  const [deletingReview, setDeletingReview] = useState(false);
  const [myReviewId, setMyReviewId] = useState(null);
  const [openReviewMenuId, setOpenReviewMenuId] = useState("");
  const [recommendations, setRecommendations] = useState([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [collabRecommendations, setCollabRecommendations] = useState([]);
  const [collabRecommendationsLoading, setCollabRecommendationsLoading] = useState(false);

  const isLoggedIn = Boolean(localStorage.getItem("token"));
  const dropdownRef = useRef(null);
  const reviewEditorRef = useRef(null);

  useEffect(() => {
    let active = true;
    setError(null); setBook(null); setAccess(null); setReviews([]);
    setShelfStatus(null); setMyReviewId(null); setMyRating(0); setComment("");
    setOpenReviewMenuId("");
    setRecommendations([]); setRecommendationsLoading(true);
    setCollabRecommendations([]); setCollabRecommendationsLoading(true);

    const load = async () => {
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
          const d = reviewRes.value.data;
          const list = d?.reviews ?? d?.data ?? (Array.isArray(d) ? d : []);
          setReviews(list);
          const me = getCurrentUser();
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
        if (active) { setRecommendationsLoading(false); setCollabRecommendationsLoading(false); }
      }
    };
    load();
    return () => { active = false; };
  }, [id]);

  useEffect(() => {
    const fn = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowShelfMenu(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  useEffect(() => {
    if (!openReviewMenuId) return;
    const close = () => setOpenReviewMenuId("");
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [openReviewMenuId]);

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
    setTimeout(() => reviewEditorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
  };

  const handleDeleteMyReview = async (review) => {
    if (!isLoggedIn) { notify.info("Login Required", "Please login to delete your review."); navigate("/auth/login"); return; }
    if (deletingReview) return;
    const reviewId = review?._id ?? myReviewId;
    if (!reviewId) return;
    if (!window.confirm("Delete your review?")) return;

    setDeletingReview(true);
    try {
      const { data } = await API.delete(`/books/${id}/reviews`);

      setReviews((prev) => prev.filter((r) => String(r?._id) !== String(reviewId)));
      setMyReviewId(null);
      setMyRating(0);
      setComment("");
      setOpenReviewMenuId("");

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
      }

      notify.success("Deleted", "Your review has been deleted.");
    } catch (err) {
      notify.error("Error", err.response?.data?.message || "Failed to delete review.");
    } finally {
      setDeletingReview(false);
    }
  };

  const handleRatingChange = (value) => {
    if (!isLoggedIn) { notify.info("Login Required", "Please login to rate this book."); navigate("/auth/login"); return; }
    setMyRating(value);
  };

  if (error) return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
      <div className="text-center space-y-2">
        <p className="text-sm text-gray-500 dark:text-gray-400">{error}</p>
        <button onClick={() => navigate(-1)} className="text-xs text-indigo-600 hover:underline">Go back</button>
      </div>
    </div>
  );

  if (!book) return <Skeleton />;

  const canRead       = access?.canRead;
  const avgRating     = Number.isFinite(book.averageRating) ? book.averageRating : 0;
  const totalReviews  = Number.isFinite(book.totalRatings) ? book.totalRatings : reviews.length;
  const totalViews    = Number.isFinite(book.views) ? book.views : 0;
  const totalReads    = Number.isFinite(book.reads) ? book.reads : 0;
  const currentShelf  = SHELF_OPTIONS.find((o) => o.key === shelfStatus);
  const isLongDesc    = (book.description?.length ?? 0) > 220;
  const sortedReviews = [...reviews].sort((a, b) => {
    const aTime = a?.updatedAt || a?.createdAt ? new Date(a.updatedAt ?? a.createdAt).getTime() : 0;
    const bTime = b?.updatedAt || b?.createdAt ? new Date(b.updatedAt ?? b.createdAt).getTime() : 0;
    return bTime - aTime;
  });
  const myReview = myReviewId ? sortedReviews.find((r) => String(r?._id) === String(myReviewId)) : null;
  const previewReviews = myReview ? [myReview] : sortedReviews.slice(0, 2);
  const hasMoreReviews = sortedReviews.length > previewReviews.length;

  return (
    <>
      {showDescModal && (
        <DescriptionModal text={book.description} onClose={() => setShowDescModal(false)} />
      )}
      {showReviewsModal && (
        <ReviewsModal
          reviews={sortedReviews}
          avgRating={avgRating}
          totalReviews={totalReviews}
          myReviewId={myReviewId}
          openReviewMenuId={openReviewMenuId}
          onMenuToggle={(rid) => setOpenReviewMenuId((prev) => (String(prev) === String(rid) ? "" : String(rid)))}
          onEditMyReview={handleEditMyReview}
          onDeleteMyReview={handleDeleteMyReview}
          onClose={() => setShowReviewsModal(false)}
        />
      )}

      <div className="min-h-screen bg-white dark:bg-gray-950">
        <div className="page-container py-8">

          {/* Back */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors mb-1"
          >
            <HiArrowLeft /> Back to Library
          </button>

          {/* Book Card */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mt-4">
            <div className="lg:col-span-8 space-y-6">

          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden animate-fade-up">
            <div className="flex flex-col sm:flex-row">

              {/* Cover */}
              <div className="sm:w-44 md:w-52 shrink-0">
                {book.coverImage ? (
                  <img
                    src={book.coverImage}
                    alt={book.title}
                    className="w-full h-60 sm:h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-60 sm:h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-indigo-100 dark:from-slate-800 dark:to-indigo-950">
                    <HiOutlineBookOpen className="text-indigo-300 dark:text-indigo-700 text-5xl" />
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="flex-1 p-4 sm:p-6 flex flex-col gap-3 min-w-0">

                {/* Title + Bookmark */}
                <div className="flex items-start justify-between gap-3">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white leading-tight">
                    {book.title}
                  </h1>
                  <div className="relative shrink-0" ref={dropdownRef}>
                    <button
                      type="button"
                      onClick={() => setShowShelfMenu((v) => !v)}
                      title="Add to shelf"
                      className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      {shelfStatus
                        ? <HiBookmark className="text-indigo-600 text-xl" />
                        : <HiOutlineBookmark className="text-gray-400 text-xl hover:text-indigo-500 transition-colors" />}
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

                {/* Author */}
                <p className="text-sm text-gray-500 dark:text-gray-400 -mt-1">
                  by <span className="font-semibold text-gray-700 dark:text-gray-300">{book.author}</span>
                </p>

                {/* Rating */}
                <div className="flex items-center gap-2">
                  <StarRating value={avgRating} readonly size="text-lg" />
                  <span className="text-sm text-gray-400">
                    {avgRating.toFixed(1)} - {totalReviews} rating{totalReviews !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Meta row */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {currentShelf && (
                    <Badge
                      color={
                        shelfStatus === "reading" ? "indigo"
                        : shelfStatus === "completed" ? "emerald"
                        : "amber"
                      }
                    >
                      {currentShelf.icon} {currentShelf.label}
                    </Badge>
                  )}
                  <span className="inline-flex items-center gap-1 text-[11px] text-gray-400">
                    <HiOutlineEye className="shrink-0" /> {totalViews}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-gray-400">
                    <HiOutlineBookOpen className="shrink-0" /> {totalReads}
                  </span>
                  {book.genre && <Badge>{book.genre}</Badge>}
                  {book.category && <Badge>{book.category}</Badge>}
                  {book.isPaid ? <Badge color="indigo">Rs. {book.price}</Badge> : null}
                </div>

                {/* Description */}
                <div className="pt-0.5">
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-3">
                    {book.description || "No description available."}
                  </p>
                  {isLongDesc && (
                    <button
                      type="button"
                      onClick={() => setShowDescModal(true)}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline mt-1 font-semibold"
                    >
                      Read more
                    </button>
                  )}
                </div>

                {/* CTA */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 pt-1 mt-auto">
                  {canRead ? (
                    <button
                      type="button"
                      onClick={() => navigate(`/read/${book._id}`)}
                      className="inline-flex w-full sm:w-auto justify-center items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all hover:-translate-y-px active:translate-y-0"
                    >
                      <HiOutlineBookOpen /> Read Now
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => navigate(`/purchase/${book._id}`)}
                      className="inline-flex w-full sm:w-auto justify-center items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all hover:-translate-y-px active:translate-y-0"
                    >
                      Buy · Rs. {book.price}
                    </button>
                  )}
                  <span
                    className={`inline-flex w-full sm:w-auto justify-center items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl border ${
                      canRead
                        ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-800/40"
                        : "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/30 dark:border-amber-800/40"
                    }`}
                  >
                    {canRead ? <HiOutlineCheckCircle /> : <HiOutlineLockClosed />}
                    {canRead ? "Access granted" : "Purchase required"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Reviews Card */}
          <div className={`bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden animate-fade-up-2 flex flex-col`}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <HiOutlineChatBubbleLeftRight className="text-indigo-500 text-sm" />
                  <span className="text-sm font-bold text-gray-900 dark:text-white">Reviews</span>
                  {reviews.length > 0 && (
                    <span className="text-[10px] font-semibold bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">
                      {reviews.length}
                    </span>
                  )}
                </div>
                {hasMoreReviews && (
                  <button
                    onClick={() => setShowReviewsModal(true)}
                    className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline transition-colors"
                  >
                    See more
                  </button>
                )}
              </div>

              <div className="px-4 pt-3 pb-2 space-y-3 flex-1 min-h-0 overflow-y-auto scrollbar-none">
                {/* Preview reviews */}
                {previewReviews.length > 0 && (
                  <div className="-mx-4 border-t border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
                    {previewReviews.map((r) => (
                      <div key={r._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                        <ReviewRow
                          review={r}
                          compact
                          clamp
                          isMine={Boolean(myReviewId && String(r?._id) === String(myReviewId))}
                          menuOpen={Boolean(openReviewMenuId && String(openReviewMenuId) === String(r?._id))}
                          onMenuToggle={(rid) => setOpenReviewMenuId((prev) => (String(prev) === String(rid) ? "" : String(rid)))}
                          onEdit={handleEditMyReview}
                          onDelete={myReviewId ? handleDeleteMyReview : undefined}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Write / edit review */}
                <div ref={reviewEditorRef} className="border-t border-gray-100 dark:border-gray-800 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {myReviewId ? "Edit your review" : "Write a review"}
                    </p>
                    <StarRating value={myRating} onChange={handleRatingChange} size="text-xl" />
                  </div>

                  {!isLoggedIn ? (
                    <p className="text-sm text-gray-400 italic">
                      <button
                        onClick={() => navigate("/auth/login")}
                        className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                      >
                        Sign in
                      </button>{" "}
                      to leave a review.
                    </p>
                  ) : (
                    <>
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Share your thoughts about this book..."
                        rows={3}
                        className="w-full text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                          {myRating > 0 ? `${myRating} star${myRating > 1 ? "s" : ""}` : "No rating"}
                        </span>
                        <button
                          type="button"
                          onClick={handleComment}
                          disabled={!comment.trim() || posting || deletingReview}
                          className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all"
                        >
                          {posting ? "Saving..." : myReviewId ? "Update" : "Post"}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
          </div>

          {/* Recommendations */}
          </div>
            <aside className="hidden lg:block lg:col-span-4">
              <div className="lg:sticky lg:top-20 space-y-5 animate-fade-up">
                <ContentBasedFilteringSidebar
                  books={recommendations}
                  loading={recommendationsLoading}
                  title="Similar books"
                  variant="large"
                  maxItems={4}
                />
              </div>
            </aside>
          </div>

          <div className="mt-8 animate-fade-up">
            <CollaborativeFilteringBottom books={collabRecommendations} loading={collabRecommendationsLoading} />
          </div>

        </div>
      </div>
    </>
  );
}
