
import BookCard, { BookCardSkeleton } from "../BookCard";

export default function CollaborativeFilteringBottom({
  books = [],
  loading = false,
  title = "You may also like",
}) {
  const items = Array.isArray(books) ? books.slice(0, 8) : [];

  return (
    <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4 sm:p-6">
      <div className="flex items-center gap-3 mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">
        <h1 className="font-bold sm:text-xl text-gray-900 dark:text-white tracking-tight">
          {title}
        </h1>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <BookCardSkeleton key={i} />
          ))}
        </div>
      ) : items.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((book) => (
            <BookCard key={book._id} book={book} />
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-400">No recommendations found.</p>
      )}
    </section>
  );
}
