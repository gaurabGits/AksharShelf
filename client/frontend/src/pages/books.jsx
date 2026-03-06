import { useEffect, useState, useCallback } from "react";
import { HiOutlineMagnifyingGlass, HiOutlineBookOpen, HiChevronLeft, HiChevronRight } from "react-icons/hi2";
import API from "../services/api";
import BookCard, { BookCardSkeleton } from "../components/BookCard";
import BackroundGrid from "../components/layout/BackroundGrid";

const LIMIT = 12;

// Inject keyframes once
const STYLES = `
  @keyframes fadeSlideIn {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0);    }
  }
  .book-card-anim {
    animation: fadeSlideIn 0.35s ease both;
  }
`;

export default function BooksPage() {
  const [books, setBooks]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [page, setPage]             = useState(1);
  const [total, setTotal]           = useState(0);
  const [animKey, setAnimKey]       = useState(0); // Used to retrigger animations on book change

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: LIMIT, ...(search && { search }) });
      const res    = await API.get(`/books?${params}`);
      const data   = res.data;
      setBooks(data.books ?? data);
      setTotal(data.total ?? (data.books ?? data).length);
      setAnimKey((k) => k + 1); // retrigger card animations
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchBooks(); }, [fetchBooks]);
  useEffect(() => { setPage(1); }, [search]);

  return (
    <>
      <style>{STYLES}</style>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10 px-4">
         <div>
            <BackroundGrid />
        </div>

        <div className="relative max-w-6xl mx-auto flex flex-col gap-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Books</h1>
              <p className="text-sm text-gray-400 mt-0.5 h-5 transition-all duration-300">
                {!loading && `${total} books available`}
              </p>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-72">
              <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base pointer-events-none" />
              <input
                type="text"
                placeholder="Search books or authors..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 dark:focus:border-indigo-600 transition-all"
              />
            </div>
          </div>

          {/* ── Grid ── */}
          <div key={animKey} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {loading
              ? Array(LIMIT).fill(0).map((_, i) => <BookCardSkeleton key={i} />)
              : books.map((book, i) => (
                  <div
                    key={book._id}
                    className="book-card-anim"
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    <BookCard book={book} />
                  </div>
                ))
            }
          </div>

          {/* ── Empty ── */}
          {!loading && books.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 gap-3 book-card-anim">
              <HiOutlineBookOpen className="text-indigo-200 dark:text-indigo-900 text-6xl" />
              <p className="text-sm text-gray-400">No books found</p>
              {search && (
                <button onClick={() => setSearch("")}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
                  Clear search
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}