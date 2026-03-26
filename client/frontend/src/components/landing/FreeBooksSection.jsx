import { Link } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { HiArrowRight, HiChevronLeft, HiChevronRight, HiOutlineBookOpen } from "react-icons/hi2";
import API from "../../services/api";

const STYLES = `
  @keyframes slideInRight {
    from { opacity: 0; transform: translateX(40px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  .slide-right { animation: slideInRight 0.4s ease both; }
  .scroll-row::-webkit-scrollbar { display: none; }
  .scroll-row { -ms-overflow-style: none; scrollbar-width: none; }
`;

function FreeBooksSection() {
  const [books, setBooks]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [visible, setVisible]   = useState(false);
  const [canLeft, setCanLeft]   = useState(false);
  const [canRight, setCanRight] = useState(true);
  const rowRef     = useRef(null);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res  = await API.get("/books?limit=30");
        const all  = res.data.books ?? res.data ?? [];
        const free = all.filter((b) => !b.isPaid).slice(0, 12);
        setBooks(free);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const updateArrows = () => {
    const el = rowRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 0);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  const scroll = (dir) => {
    const el = rowRef.current;
    if (!el) return;
    const amount = Math.min(420, Math.max(240, Math.round(el.clientWidth * 0.85)));
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
    setTimeout(updateArrows, 350);
  };

  return (
    <>
      <style>{STYLES}</style>

      <section ref={sectionRef} className="bg-gray-50 dark:bg-gray-950 section-pad">
        <div className="page-container">

          {/* Header */}
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Free Books</h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
                No cost
              </span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Link to="/books?filter=free" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 whitespace-nowrap">
                See all <HiArrowRight className="text-sm" />
              </Link>
              <div className="hidden sm:flex gap-1.5">
                <button onClick={() => scroll("left")} disabled={!canLeft}
                  className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 dark:border-gray-700 text-gray-500 hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                  <HiChevronLeft />
                </button>
                <button onClick={() => scroll("right")} disabled={!canRight}
                  className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 dark:border-gray-700 text-gray-500 hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                  <HiChevronRight />
                </button>
              </div>
            </div>
          </div>

          {/* Skeleton */}
          {loading && (
            <div className="flex gap-3 overflow-hidden sm:gap-4">
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className="h-56 w-36 flex-shrink-0 rounded-xl bg-gray-200 animate-pulse dark:bg-gray-800 sm:h-64 sm:w-44" />
              ))}
            </div>
          )}

          {/* Scroll row */}
          {!loading && books.length > 0 && (
            <div ref={rowRef} onScroll={updateArrows} className="scroll-row flex gap-3 overflow-x-auto pb-2 sm:gap-4">
              {books.map((book, i) => (
                <Link
                  key={book._id}
                  to={`/books/${book._id}`}
                  className={`group w-36 flex-shrink-0 no-underline sm:w-44 ${visible ? "slide-right" : "opacity-0"}`}
                  style={visible ? { animationDelay: `${i * 60}ms` } : {}}
                >
                  <div className="relative h-56 w-36 overflow-hidden rounded-xl shadow-md transition-all duration-300 hover:scale-105 hover:shadow-xl sm:h-64 sm:w-44">

                    {/* Cover image — full, no tint */}
                    {book.coverImage ? (
                      <img
                        src={book.coverImage}
                        alt={book.title}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      /* Fallback only when no cover */
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 to-violet-200 dark:from-indigo-950/80 dark:to-violet-950/80 flex items-center justify-center">
                        <HiOutlineBookOpen className="text-indigo-400 dark:text-indigo-600 text-4xl" />
                      </div>
                    )}

                    {/* Subtle bottom gradient so text is readable */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none" />

                    {/* Dark overlay on hover */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 pointer-events-none" />

                    {/* Bottom content */}
                    <div className="absolute inset-0 flex flex-col justify-end p-3 z-10">
                      <h3 className="text-white font-bold text-xs leading-snug line-clamp-2 mb-0.5">
                        {book.title}
                      </h3>
                      <p className="text-white/60 text-[10px] truncate">{book.author}</p>
                      <div className="flex items-center gap-1 text-white text-[10px] font-semibold mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        Read now <HiArrowRight className="text-xs" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Empty */}
          {!loading && books.length === 0 && (
            <div className="flex flex-col items-center py-16 gap-3">
              <HiOutlineBookOpen className="text-5xl text-gray-300 dark:text-gray-700" />
              <p className="text-sm text-gray-400">No free books available yet</p>
            </div>
          )}

        </div>
      </section>
    </>
  );
}

export default FreeBooksSection;
