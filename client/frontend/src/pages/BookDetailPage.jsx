import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  HiArrowLeft, HiOutlineBookOpen, HiOutlineStar, HiStar,
  HiOutlineChatBubbleLeftRight, HiOutlineLockClosed,
  HiOutlineCheckCircle, HiOutlineHeart, HiHeart,
} from "react-icons/hi2";
import { fetchBookDetail } from "../services/bookService";


function StarRating({ value = 0, onChange, readonly = false }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <button key={s} disabled={readonly}
          onClick={() => onChange?.(s)}
          onMouseEnter={() => !readonly && setHover(s)}
          onMouseLeave={() => !readonly && setHover(0)}
          className={`text-xl ${readonly ? "cursor-default" : "cursor-pointer"} transition-colors`}
        >
          {s <= (hover || value)
            ? <HiStar className="text-amber-400" />
            : <HiOutlineStar className="text-gray-300 dark:text-gray-600" />}
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
        {/* Big card skeleton */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 flex flex-col md:flex-row gap-8">
          {/* Cover */}
          <div className="w-full md:w-56 h-80 bg-gray-200 dark:bg-gray-800 rounded-2xl flex-shrink-0" />
          {/* Info */}
          <div className="flex-1 flex flex-col gap-4 py-2">
            <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-800 rounded-full" />
            <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-800 rounded-full" />
            <div className="h-4 w-1/3 bg-gray-200 dark:bg-gray-800 rounded-full" />
            <div className="space-y-2 mt-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-3 bg-gray-200 dark:bg-gray-800 rounded-full" style={{ width: `${95 - i * 8}%` }} />
              ))}
            </div>
            <div className="h-11 w-36 bg-gray-200 dark:bg-gray-800 rounded-xl mt-4" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 h-48" />
      </div>
    </div>
  );
}


export default function BookDetailPage() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [book, setBook]         = useState(null);
  const [access, setAccess]     = useState(null);
  const [error, setError]       = useState(null);
  const [liked, setLiked]       = useState(false);
  const [myRating, setMyRating] = useState(0);
  const [comment, setComment]   = useState("");
  const [comments, setComments] = useState([
    { id: 1, user: "Aarav S.",  rating: 5, text: "Absolutely loved this book. Changed my perspective!", time: "2 days ago" },
    { id: 2, user: "Priya M.",  rating: 4, text: "Great read, very insightful content.",               time: "5 days ago" },
  ]);

  useEffect(() => {
    fetchBookDetail(id)
      .then((res) => { setBook(res.data.book); setAccess(res.data.access); })
      .catch(() => setError("Could not load book details."));
  }, [id]);

  const handleComment = () => {
    if (!comment.trim()) return;
    setComments((prev) => [
      { id: Date.now(), user: "You", rating: myRating, text: comment, time: "Just now" },
      ...prev,
    ]);
    setComment("");
  };

  if (error) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
      <div className="text-center flex flex-col items-center gap-3">
        <span className="text-4xl">😕</span>
        <p className="text-sm text-gray-500 dark:text-gray-400">{error}</p>
        <button onClick={() => navigate(-1)} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">Go back</button>
      </div>
    </div>
  );

  if (!book) return <Skeleton />;

  const canRead = access?.canRead;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 px-4">
      <div className="max-w-4xl mx-auto flex flex-col gap-5">

        {/* Back */}
        <button onClick={() => navigate(-1)}
          className="self-start flex items-center gap-1 text-sm text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
          <HiArrowLeft /> Back
        </button>

        {/* ── BIG Book Card ── */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="flex flex-col md:flex-row">

            {/* ── BIG Cover ── */}
            <div className="md:w-64 flex-shrink-0 bg-gray-100 dark:bg-gray-800">
              {book.coverImage ? (
                <img
                  src={book.coverImage}
                  alt={book.title}
                  className="w-full h-72 md:h-full object-cover"
                />
              ) : (
                <div className="w-full h-72 md:h-full flex items-center justify-center bg-gradient-to-br from-indigo-100 to-violet-200 dark:from-indigo-950/70 dark:to-violet-950/70">
                  <HiOutlineBookOpen className="text-indigo-300 dark:text-indigo-700 text-6xl" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 p-7 flex flex-col gap-4">

              {/* Title + like */}
              <div className="flex items-start justify-between gap-3">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                  {book.title}
                </h1>
                <button onClick={() => setLiked((l) => !l)}
                  className="flex-shrink-0 transition-transform hover:scale-110 active:scale-95 mt-1">
                  {liked
                    ? <HiHeart className="text-red-500 text-2xl" />
                    : <HiOutlineHeart className="text-gray-300 dark:text-gray-600 text-2xl hover:text-red-400 transition-colors" />}
                </button>
              </div>

              {/* Author */}
              <p className="text-sm text-gray-500 dark:text-gray-400 -mt-2">by {book.author}</p>

              {/* Stars */}
              <div className="flex items-center gap-2">
                <StarRating value={book.averageRating ?? 4} readonly />
                <span className="text-xs text-gray-400">({book.totalRatings ?? comments.length} reviews)</span>
              </div>

              {/* Badges */}
              <div className="flex items-center gap-2 flex-wrap">
                {book.genre && (
                  <span className="text-xs font-medium px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                    {book.genre}
                  </span>
                )}
                {book.isPaid ? (
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/50">
                    Rs. {book.price}
                  </span>
                ) : (
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50">
                    Free
                  </span>
                )}
              </div>

              {/* Divider */}
              <div className="h-px bg-gray-100 dark:bg-gray-800" />

              {/* Description */}
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-4">
                {book.description || "No description available for this book."}
              </p>

              {/* Access pill */}
              <div className={`self-start flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full ${
                canRead
                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
                  : "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400"
              }`}>
                {canRead ? <HiOutlineCheckCircle className="text-sm" /> : <HiOutlineLockClosed className="text-sm" />}
                {canRead ? "You have access" : "Purchase required"}
              </div>

              {/* CTA */}
              <div className="flex items-center gap-3 mt-auto pt-1">
                {canRead ? (
                  <button onClick={() => navigate(`/read/${book._id}`)}
                    className="flex items-center gap-2 px-7 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all hover:-translate-y-px">
                    <HiOutlineBookOpen /> Read Now
                  </button>
                ) : (
                  <button onClick={() => navigate(`/purchase/${book._id}`)}
                    className="flex items-center gap-2 px-7 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all hover:-translate-y-px">
                    Buy · Rs. {book.price}
                  </button>
                )}
                <button onClick={() => navigate(-1)}
                  className="px-5 py-3 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm font-medium rounded-xl transition-all">
                  Go Back
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Rate & Review ── */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <HiOutlineChatBubbleLeftRight className="text-indigo-500 text-lg" />
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Ratings & Reviews</h2>
          </div>

          <div className="flex flex-col gap-1.5">
            <p className="text-xs text-gray-400 uppercase tracking-wide">Your Rating</p>
            <StarRating value={myRating} onChange={setMyRating} />
          </div>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your thoughts about this book..."
            rows={3}
            className="w-full text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 dark:focus:border-indigo-600 transition-all"
          />
          <div className="flex justify-end">
            <button onClick={handleComment} disabled={!comment.trim()}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all">
              Post Review
            </button>
          </div>
        </div>

        {/* ── Comments ── */}
        <div className="flex flex-col gap-3">
          {comments.map((c) => (
            <div key={c.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm px-5 py-4 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {c.user[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white leading-none">{c.user}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{c.time}</p>
                  </div>
                </div>
                {c.rating > 0 && <StarRating value={c.rating} readonly />}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{c.text}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}