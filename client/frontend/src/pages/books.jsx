import { useEffect, useState, useMemo } from "react";
import {
  HiOutlineMagnifyingGlass,
  HiOutlineBookOpen,
} from "react-icons/hi2";
import { useNavigate, useSearchParams } from "react-router-dom";
import API from "../services/api";
import BookCard, { BookCardSkeleton } from "../components/BookCard";

const SKELETON_COUNT = 8;

export default function BooksPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [books, setBooks]       = useState([]);
  const [allBooks, setAllBooks] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [filter, setFilter] = useState(() => {
    const initial = String(searchParams.get("filter") || "all").toLowerCase();
    return initial === "free" || initial === "paid" || initial === "all" ? initial : "all";
  });

  useEffect(() => {
    const fetchBooks = async () => {
      setLoading(true);
      try {
        const res      = await API.get("/books");
        const data     = res.data;
        const bookList = data.books ?? data;
        setBooks(bookList);
        setAllBooks(bookList);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchBooks();
  }, []);

  const filteredBooks = useMemo(() => {
    let list = [...books];
    if (search) {
      list = list.filter(
        (b) =>
          b.title?.toLowerCase().includes(search.toLowerCase()) ||
          b.author?.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (filter === "free") list = list.filter((b) => !b.isPaid);
    if (filter === "paid") list = list.filter((b) =>  b.isPaid);
    return list;
  }, [books, search, filter]);

  const recentBooks = useMemo(() => {
    return [...allBooks]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 4);
  }, [allBooks]);

  // Mini Car─
  const isSearching = search.trim().length > 0;
  const shouldShowRecentlyAdded =
	    !loading && recentBooks.length > 0 && !isSearching;

  const MiniCard = ({ book }) => (
    <div
      onClick={() => navigate(`/books/${book._id}`)}
      className="group w-full min-w-0 cursor-pointer"
    >
      <div className="overflow-hidden bg-white p-0 shadow-[0_16px_34px_rgba(15,23,42,0.08)] transition duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_20px_42px_rgba(15,23,42,0.14)] dark:bg-gray-900 dark:shadow-black/30">
        <div className="relative aspect-[175/266] w-full overflow-hidden bg-[#eef1e6]">
          {book.coverImage ? (
            <img
              src={book.coverImage}
              alt={book.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#eef5df] via-[#dce8c9] to-[#bac98e] dark:from-slate-800 dark:via-slate-700 dark:to-slate-600">
              <HiOutlineBookOpen className="text-5xl text-[#6a7f46] dark:text-slate-300" />
            </div>
          )}

          <span className="absolute right-3 top-3 rounded-[8px] bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-gray-700 shadow-sm">
            New
          </span>
        </div>
      </div>

      <div className="px-0 pt-3">
        <p className="font-display line-clamp-2 text-[16px] font-semibold leading-[1.28] tracking-[-0.01em] text-gray-950 dark:text-white">
          {book.title}
        </p>
        <p className="font-ui mt-1 truncate text-[14px] leading-[1.35] text-gray-500 dark:text-gray-400">{book.author}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="page-container py-10">
        <div className="flex flex-col gap-10">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              Books
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              {loading ? "Loading..." : `${filteredBooks.length} books available`}
            </p>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-72">
            <HiOutlineMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-base pointer-events-none" />
            <input
              type="text"
              placeholder="Search books or authors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 dark:focus:border-indigo-600 shadow-sm transition-all"
            />
            {isSearching && recentBooks.length > 0 && (
              <p className="mt-1 text-[11px] text-gray-400">
                Recently added is hidden while searching.
              </p>
            )}
          </div>
        </div>

        {/* Recently Added Section */}
        {shouldShowRecentlyAdded && (
          <section>
            {/* Section header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                  Recently Added
                </h2>
              </div>
            </div>
            <div className="grid w-full grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-[repeat(auto-fill,minmax(160px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(175px,1fr))] md:gap-x-4">
              {recentBooks.map((book) => (
                <MiniCard key={book._id} book={book} />
              ))}
            </div>
          </section>
        )}

        {/* Divider */}
        <div className="flex items-center gap-3 -my-2">
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
          <span className="text-xs text-gray-400 font-medium uppercase tracking-widest">
            All Books
          </span>
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: "all",  label: "All Books"  },
            { id: "free", label: "Free Books" },
            { id: "paid", label: "Paid Books" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilter(item.id)}
              className={`px-4 py-2 text-xs font-medium rounded-full border transition-all ${
                filter === item.id
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                  : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-indigo-400 hover:text-indigo-600"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Main Book Grid */}
        <div className="grid w-full grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-[repeat(auto-fill,minmax(160px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(175px,1fr))] md:gap-x-4 md:gap-y-7">
          {loading
            ? Array(SKELETON_COUNT).fill(0).map((_, i) => <BookCardSkeleton key={i} />)
            : filteredBooks.map((book) => (
                <BookCard
                  key={book._id}
                  book={book}
                  onClick={() => navigate(`/books/${book._id}`)}
                />
              ))
          }
        </div>

        {/* Empty State─ */}
        {!loading && filteredBooks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center">
              <HiOutlineBookOpen className="text-3xl text-indigo-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">No books found</p>
              <p className="text-xs text-gray-400 mt-1">Try adjusting your search or filter</p>
            </div>
            {search && (
              <button
                onClick={() => setSearch("")}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        )}

        </div>
      </div>
    </div>
  );
}
