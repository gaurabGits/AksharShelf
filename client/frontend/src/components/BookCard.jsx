import { useNavigate } from "react-router-dom";
import { HiOutlineBookOpen, HiOutlineBookmark, HiBookmark } from "react-icons/hi2";

export function BookCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm animate-pulse">
      <div className="h-52 bg-gray-200 dark:bg-gray-800" />
      <div className="p-4 flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded-full w-3/4" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full w-1/2" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full w-1/4" />
        </div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-xl" />
      </div>
    </div>
  );
}

const BookCard = ({ book, onToggleBookmark, isBookmarked = false }) => {
  const navigate = useNavigate();

  return (
    <div className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm hover:shadow-lg dark:hover:shadow-black/30 hover:-translate-y-1 transition-all duration-300">

      {/* Cover */}
      <div className="h-52 bg-gray-100 dark:bg-gray-800 overflow-hidden relative">
        {book.coverImage ? (
          <img
            src={book.coverImage}
            alt={book.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-50 to-violet-100 dark:from-indigo-950/60 dark:to-violet-950/60">
            <HiOutlineBookOpen className="text-indigo-300 dark:text-indigo-700 text-5xl" />
          </div>
        )}

        {typeof onToggleBookmark === "function" && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleBookmark(book);
            }}
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 dark:bg-gray-900/90 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-indigo-600 hover:bg-white transition"
            title={isBookmarked ? "Bookmarked" : "Add bookmark"}
          >
            {isBookmarked ? <HiBookmark className="text-base" /> : <HiOutlineBookmark className="text-base" />}
          </button>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate leading-snug">
            {book.title}
          </h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{book.author}</p>
          {book.isPaid ? (
            <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">Rs. {book.price}</p>
          ) : (
            <p className="text-xs font-semibold text-emerald-500 dark:text-emerald-400">Free</p>
          )}
        </div>

        <button
          onClick={() => navigate(`/book/${book._id}`)}
          className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 dark:hover:bg-indigo-500 text-white text-xs font-semibold transition-all hover:-translate-y-px active:scale-95"
        >
          View Details
        </button>
      </div>
    </div>
  );
};

export default BookCard;
