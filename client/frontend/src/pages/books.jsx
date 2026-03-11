import { useEffect, useState, useMemo } from "react";
import {
  HiOutlineMagnifyingGlass,
  HiOutlineBookOpen,
  HiOutlineSparkles,
} from "react-icons/hi2";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import BookCard, { BookCardSkeleton } from "../components/BookCard";

const SKELETON_COUNT = 8;

export default function BooksPage() {
  const navigate = useNavigate();

  const [books, setBooks]       = useState([]);
  const [allBooks, setAllBooks] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [filter, setFilter]     = useState("all");

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
  const MiniCard = ({ book }) => (
    <div
      onClick={() => navigate(`/books/${book._id}`)}
      className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
    >
      {/* Cover */}
      <div className="h-44 bg-gray-100 dark:bg-gray-800 overflow-hidden relative">
        {book.coverImage ? (
          <img
            src={book.coverImage}
            alt={book.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-100 to-violet-200 dark:from-indigo-950/60 dark:to-violet-950/60">
            <HiOutlineBookOpen className="text-5xl text-indigo-300 dark:text-indigo-700" />
          </div>
        )}

        {/* New badge */}
        <span className="absolute top-2.5 right-2.5 text-[10px] font-semibold bg-white/90 dark:bg-gray-900/90 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full shadow-sm">
          New
        </span>
      </div>

      {/* Info */}
      <div className="p-3.5 space-y-1">
        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate leading-snug">
          {book.title}
        </p>
        <p className="text-xs text-gray-400 truncate">by {book.author}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 py-10 px-4">
      <div className="max-w-6xl mx-auto flex flex-col gap-10">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              📚 Books
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
          </div>
        </div>

        {/* Recently Added Section */}
        {!loading && recentBooks.length > 0 && (
          <section>
            {/* Section header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                  Recently Added
                </h2>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
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
  );
}
