import { useNavigate } from "react-router-dom";
import { HiOutlineBookOpen, HiOutlineBookmark, HiBookmark } from "react-icons/hi2";

export function BookCardSkeleton() {
  return (
    <div className="w-full min-w-0 animate-pulse">
      <div className="overflow-hidden bg-white p-0 shadow-[0_16px_35px_rgba(15,23,42,0.08)] dark:bg-gray-900 dark:shadow-black/30">
        <div className="aspect-[175/266] w-full bg-gray-200 dark:bg-gray-800" />
      </div>
      <div className="px-0 pt-3">
        <div className="flex flex-col gap-2">
          <div className="h-4 w-4/5 bg-gray-200 dark:bg-gray-700" />
          <div className="h-3.5 w-3/5 bg-gray-200 dark:bg-gray-700" />
          <div className="h-3.5 w-1/3 bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>
    </div>
  );
}

const BookCard = ({ book, onClick, onToggleBookmark, isBookmarked = false }) => {
  const navigate = useNavigate();
  const handleOpen = () => {
    if (typeof onClick === "function") {
      onClick(book);
      return;
    }

    navigate(`/books/${book._id}`);
  };

  return (
    <article className="group w-full min-w-0">
      <div
        role="button"
        tabIndex={0}
        onClick={handleOpen}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleOpen();
          }
        }}
        className="cursor-pointer outline-none"
      >
        <div className="relative overflow-hidden bg-white p-0 shadow-[0_18px_38px_rgba(15,23,42,0.08)] transition duration-300 group-hover:shadow-[0_22px_48px_rgba(15,23,42,0.14)] dark:bg-gray-900 dark:shadow-black/30">
          <div className="aspect-[177/266] w-full overflow-hidden bg-[#eef1e6]">
            {book.coverImage ? (
              <img
                src={book.coverImage}
                alt={book.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#eef5df] via-[#dce8c9] to-[#bac98e] dark:from-slate-800 dark:via-slate-700 dark:to-slate-600">
                <HiOutlineBookOpen className="text-5xl text-[#6a7f46] dark:text-slate-300" />
              </div>
            )}
          </div>

          {typeof onToggleBookmark === "function" && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleBookmark(book);
              }}
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center bg-white/92 text-indigo-900 shadow-sm transition hover:bg-white dark:bg-gray-900/92 dark:text-indigo-300"
              title={isBookmarked ? "Bookmarked" : "Add bookmark"}
            >
              {isBookmarked ? <HiBookmark className="text-base" /> : <HiOutlineBookmark className="text-base" />}
            </button>
          )}
        </div>

        <div className="px-0 pt-3 font-sans">
          <h3 className="line-clamp-2 text-[16px] font-semibold leading-[1.28] tracking-[-0.01em] text-gray-950 dark:text-white">
            {book.title}
          </h3>
          <p className="font-sans italic mt-1 text-[14px] font-semibold leading-[1.35] text-stone-500 dark:text-stone-400">
            by <span className="font-medium italic text-stone-900 dark:text-stone-100">
              {book.author || "Unknown Author"}
            </span>
          </p>

          <p className="font-sans mt-3 text-[14px] font-semibold leading-[1.35] tracking-[-0.01em] text-stone-900 dark:text-stone-100">
            {book.isPaid ? `Rs. ${book.price}` : "Free"}
          </p>
        </div>
      </div>
    </article>
  );
};

export default BookCard;
