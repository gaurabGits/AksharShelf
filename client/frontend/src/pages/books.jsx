import { useEffect, useState, useMemo } from "react";
import { HiOutlineMagnifyingGlass, HiOutlineBookOpen, HiXMark } from "react-icons/hi2";
import { useNavigate, useSearchParams } from "react-router-dom";
import API from "../services/api";
import BookCard, { BookCardSkeleton } from "../components/BookCard";

const SKELETON_COUNT = 8;

/* tiny helpers */

const Badge = ({ children, className = "" }) => (
  <span
    className={`inline-flex items-center rounded-sm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest ${className}`}
  >
    {children}
  </span>
);

/* MiniCard (Recently Added) */
const MiniCard = ({ book, onClick }) => (
  <button
    onClick={onClick}
    className="group flex h-full w-[186px] flex-col text-left focus:outline-none"
  >
    {/* Cover */}
    <div className="relative overflow-hidden rounded-[3px] shadow-[2px_4px_14px_rgba(60,40,10,0.13)] transition-all duration-300 group-hover:shadow-[2px_8px_24px_rgba(60,40,10,0.22)]">
      <div className="aspect-[186/266] w-[186px] bg-indigo-50">
        {book.coverImage ? (
          <img
            src={book.coverImage}
            alt={book.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-indigo-50 via-violet-50 to-indigo-100">
            <HiOutlineBookOpen className="text-4xl text-indigo-300" />
          </div>
        )}
      </div>

      {/* "New" ribbon */}
      <span
        className="absolute left-0 top-4 bg-indigo-500 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-white shadow"
        style={{ borderRadius: "0 2px 2px 0" }}
      >
        New
      </span>
    </div>

    {/* Meta */}
    <div className="mt-2.5 flex flex-1 flex-col px-0.5">
      <p className="truncate min-h-[1.35rem] text-[16px] font-semibold leading-[1.28] tracking-[-0.01em] text-stone-900 dark:text-stone-100">
        {book.title}
      </p>
      <p className="mt-1 line-clamp-1 min-h-[1.35rem] font-sans italic text-[14px] font-semibold leading-[1.35] text-stone-500 dark:text-stone-400">
        by <span className="font-medium italic text-stone-900 dark:text-stone-100">
          {book.author || "Unknown Author"}
        </span>
      </p>

      <p className="mt-auto pt-3 font-sans text-[14px] font-semibold leading-[1.35] tracking-[-0.01em] text-stone-900 dark:text-stone-100">
        {book.isPaid ? `Rs. ${book.price}` : "Free"}
      </p>
    </div>
  </button>
);

/* Skeleton for MiniCard */
const MiniCardSkeleton = () => (
  <div className="w-[186px] animate-pulse">
    <div className="aspect-[186/266] w-[186px] rounded-[3px] bg-stone-200 dark:bg-stone-700" />
    <div className="mt-2.5 space-y-1.5 px-0.5">
      <div className="h-3.5 w-4/5 rounded bg-stone-200 dark:bg-stone-700" />
      <div className="h-3 w-1/2 rounded bg-stone-100 dark:bg-stone-800" />
      <div className="h-3 w-1/3 rounded bg-stone-200 dark:bg-stone-700" />
      <div className="h-3 w-1/3 rounded bg-stone-200 dark:bg-stone-700" />
    </div>
  </div>
);

/* Main Page */
export default function BooksPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [books, setBooks]       = useState([]);
  const [allBooks, setAllBooks] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [filter, setFilter]     = useState(() => {
    const v = String(searchParams.get("filter") || "all").toLowerCase();
    return ["free", "paid", "all"].includes(v) ? v : "all";
  });

  useEffect(() => {
    (async () => {
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
    })();
  }, []);

  const filteredBooks = useMemo(() => {
    let list = [...books];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (b) => b.title?.toLowerCase().includes(q) || b.author?.toLowerCase().includes(q),
      );
    }
    if (filter === "free") list = list.filter((b) => !b.isPaid);
    if (filter === "paid") list = list.filter((b) =>  b.isPaid);

    // Sort by popularity (most reads first)
    list.sort((a, b) => {
      const readsA = Number(a?.reads) || 0;
      const readsB = Number(b?.reads) || 0;
      if (readsB !== readsA) return readsB - readsA;
      return (new Date(b?.createdAt).getTime() || 0) - (new Date(a?.createdAt).getTime() || 0);
    });
    return list;
  }, [books, search, filter]);

  const recentBooks = useMemo(
    () =>
      [...allBooks]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 6),
    [allBooks],
  );

  const isSearching             = search.trim().length > 0;
  const shouldShowRecentlyAdded = !loading && recentBooks.length > 0 && !isSearching;

  /*  Render  */
  return (
    <div className="min-h-screen bg-[#faf8f3] dark:bg-[#18160f]">

      {/*  Top bar */}
      <div className="border-b border-stone-200/80 bg-[#faf8f3] dark:border-stone-800 dark:bg-[#18160f]">
        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

            {/* Title */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-indigo-900 dark:text-indigo-400 mb-1">
                Library
              </p>
              <h1 className="font-serif text-[2.1rem] font-bold leading-none tracking-tight text-stone-900 dark:text-stone-50">
                Books
              </h1>
              <p className="font-sans text-[14px] mt-1.5 text-stone-400 dark:text-stone-500">
                {loading
                  ? "Loading catalogue…"
                  : `${filteredBooks.length.toLocaleString()} title${filteredBooks.length !== 1 ? "s" : ""} in the catalogue`}
              </p>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-80">
              <HiOutlineMagnifyingGlass className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Search by title or author…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-sm border border-stone-300 bg-white py-2.5 pl-10 pr-9 text-[13.5px] text-stone-800 placeholder-stone-400 shadow-sm transition focus:border-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-900/15 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:placeholder-stone-600 dark:focus:border-indigo-500"
              />
              {isSearching && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                >
                  <HiXMark className="text-base" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/*  Page body */}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-12">

        {/*  Recently Added */}
        {(shouldShowRecentlyAdded || loading) && (
          <section>
            <div className="mb-5 flex items-center gap-3">
              <h2 className="font-serif text-[17px] font-semibold text-stone-800 dark:text-stone-100">
                Recently Added
              </h2>
            </div>

            <div className="grid grid-cols-2 justify-items-start gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-6">
              {loading
                ? Array(6).fill(0).map((_, i) => <MiniCardSkeleton key={i} />)
                : recentBooks.map((book) => (
                    <MiniCard
                      key={book._id}
                      book={book}
                      onClick={() => navigate(`/books/${book._id}`)}
                    />
                  ))}
            </div>
          </section>
        )}

        {/*  All Books */}
        <section>
          {/* Section header + filter tabs */}
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <h2 className="font-serif text-[17px] font-semibold text-stone-800 dark:text-stone-100">
                All Books
              </h2>
              <div className="flex-1 border-t border-dashed border-stone-300 dark:border-stone-700" />
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-1.5">
              {[
                { id: "all",  label: "All"  },
                { id: "free", label: "Free" },
                { id: "paid", label: "Paid" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setFilter(item.id)}
                  className={`rounded-sm border px-3.5 py-1.5 text-[11.5px] font-semibold uppercase tracking-wider transition-all ${
                    filter === item.id
                      ? "border-indigo-900 bg-indigo-900 text-white shadow-sm"
                      : "border-stone-300 bg-white text-stone-500 hover:border-indigo-700 hover:text-indigo-900 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-400 dark:hover:border-indigo-500 dark:hover:text-indigo-300"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search hint */}
          {isSearching && (
            <p className="mb-4 text-[12px] text-stone-400 dark:text-stone-500">
              Showing results for{" "}
              <span className="font-semibold text-stone-600 dark:text-stone-300">"{search}"</span>
            </p>
          )}

          {/* Grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-[repeat(auto-fill,minmax(160px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(175px,1fr))] md:gap-x-5 md:gap-y-8">
            {loading
              ? Array(SKELETON_COUNT).fill(0).map((_, i) => <BookCardSkeleton key={i} />)
              : filteredBooks.map((book) => (
                  <BookCard
                    key={book._id}
                    book={book}
                    onClick={() => navigate(`/books/${book._id}`)}
                  />
                ))}
          </div>

          {/* Empty state */}
          {!loading && filteredBooks.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-sm border border-dashed border-stone-300 dark:border-stone-700">
                <HiOutlineBookOpen className="text-3xl text-stone-300 dark:text-stone-600" />
              </div>
              <div>
                <p className="font-serif text-[15px] font-semibold text-stone-700 dark:text-stone-300">
                  No titles found
                </p>
                <p className="mt-1 text-[12.5px] text-stone-400">
                  Try a different search term or filter.
                </p>
              </div>
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="mt-1 text-[12px] font-medium text-indigo-900 underline underline-offset-2 hover:text-indigo-700 dark:text-indigo-400"
                >
                  Clear search
                </button>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
