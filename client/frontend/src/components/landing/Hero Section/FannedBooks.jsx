import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { HiOutlineBookOpen } from "react-icons/hi2";
import API from "../../../services/api";

const BOOK_GRADIENTS = [
  "from-blue-500 to-purple-600",
  "from-amber-500 to-orange-600",
  "from-green-500 to-teal-600",
];

const coverBaseUrl = String(API.defaults.baseURL || "").replace(/\/api\/?$/, "");

function getCoverImageSrc(coverImage) {
  if (!coverImage) return "";
  if (coverImage.startsWith("data:")) return coverImage;
  if (/^https?:\/\//i.test(coverImage)) return coverImage;
  if (coverImage.startsWith("/")) return `${coverBaseUrl}${coverImage}`;
  return coverImage;
}

function FannedBooks() {
  const [books, setBooks] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window === "undefined" ? 1280 : window.innerWidth
  );

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        let res;
        try {
          res = await API.get("/books/popular", { params: { limit: 3 } });
        } catch {
          res = await API.get("/books");
        }

        const booksArray = Array.isArray(res?.data?.books)
          ? res.data.books
          : Array.isArray(res?.data)
            ? res.data
            : [];

        if (Array.isArray(booksArray)) {
          const topThree = [...booksArray]
            .sort((a, b) => Number(b?.reads || 0) - Number(a?.reads || 0))
            .slice(0, 3)
            .map(({ title, author, _id, reads, coverImage }, idx) => ({
              title,
              author,
              id: _id,
              rank: idx + 1,
              reads: Number.isFinite(reads) ? reads : 0,
              coverImage: getCoverImageSrc(coverImage),
            }));

          // Layout order: most popular in middle, 2nd left, 3rd right
          const ordered = topThree.length === 3 ? [topThree[1], topThree[0], topThree[2]] : topThree;

          setBooks(
            ordered.map((book, idx) => ({
              ...book,
              gradient: BOOK_GRADIENTS[idx] || BOOK_GRADIENTS[0],
            }))
          );
        }
      } catch (error) {
        console.error("Failed to fetch books:", error);
      }
    };

    fetchBooks();
  }, []);

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fanOffset = viewportWidth < 640 ? 54 : viewportWidth < 768 ? 68 : viewportWidth < 1024 ? 84 : 100;
  const fanSpread = viewportWidth < 640 ? 10 : viewportWidth < 768 ? 14 : viewportWidth < 1024 ? 18 : 22;
  const fanLift = viewportWidth < 640 ? 18 : viewportWidth < 1024 ? 22 : 28;
  const hoverEase = "cubic-bezier(0.16,1,0.3,1)";

  const FAN_IDLE = [
    { rotate: -14, x: -fanOffset, z: 10 },
    { rotate: 0, x: 0, z: 20 },
    { rotate: 14, x: fanOffset, z: 30 },
  ];

  const getCardStyle = (i) => {
    const base = FAN_IDLE[i];

    if (hovered === null) {
      return {
        transform: `translateX(${base.x}px) rotate(${base.rotate}deg)`,
        zIndex: base.z,
        transition: `transform 0.62s ${hoverEase}`,
        willChange: "transform",
      };
    }

    if (hovered === i) {
      return {
        transform: `translateX(${base.x}px) rotate(0deg) translateY(-${fanLift}px) scale(1.08)`,
        zIndex: 60,
        transition: `transform 0.5s ${hoverEase}`,
        willChange: "transform",
      };
    }

    const spread = i < hovered ? -fanSpread : fanSpread;

    return {
      transform: `translateX(${base.x + spread}px) rotate(${base.rotate + (i < hovered ? -5 : 5)}deg)`,
      zIndex: base.z,
      transition: `transform 0.5s ${hoverEase}`,
      willChange: "transform",
    };
  };

  return (
    <div
      className="flex w-full items-center justify-center"
      onMouseLeave={() => setHovered(null)}
    >
      <div className="relative flex h-[220px] w-[280px] items-end justify-center perspective-[1200px] sm:h-[250px] sm:w-[320px] md:h-[290px] md:w-[360px] lg:h-[330px] lg:w-[400px]">

        {/* Softer ground shadow */}
        <div className="pointer-events-none absolute bottom-0 left-1/2 h-5 w-48 -translate-x-1/2 rounded-full bg-black/15 blur-2xl dark:bg-black/30 sm:h-6 sm:w-56 lg:w-72" />

        {books && books.map((book, i) => (
          <Link
            key={book.id || i}
            to={book.id ? `/books/${book.id}` : "/books"}
            className="absolute bottom-3 sm:bottom-4"
            style={{
              ...getCardStyle(i),
              transformOrigin: "bottom center",
            }}
            onMouseEnter={() => setHovered(i)}
          >
            <div
              className={`relative h-52 w-32 rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.4)]
                          sm:h-60 sm:w-36 md:h-64 md:w-40 lg:h-72 lg:w-44
                          overflow-hidden bg-gradient-to-br ${book.gradient}
                          select-none cursor-pointer
                          transition-shadow duration-500 ease-out hover:shadow-[0_35px_70px_-10px_rgba(0,0,0,0.5)]`}
            >
              {book.coverImage ? (
                <img
                  src={book.coverImage}
                  alt={book.title}
                  className="absolute inset-0 h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : null}

              <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/25 pointer-events-none" />

              {/* Soft edge highlight */}
              <div className="absolute inset-0 rounded-2xl border border-white/10 pointer-events-none" />

              {/* Gloss */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/30 via-white/8 to-transparent pointer-events-none" />

              <div className="absolute right-2.5 top-2.5 z-10 rounded-full border border-white/70 bg-white/85 px-2 py-1 text-[10px] font-semibold text-slate-700 shadow-[0_8px_20px_-12px_rgba(15,23,42,0.45)] backdrop-blur-sm sm:right-3 sm:top-3 sm:px-2.5 sm:text-[11px]">
                {book.rank ?? i + 1}
              </div>

              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-24 bg-gradient-to-t from-black/65 via-black/18 to-transparent"
                style={{
                  opacity: hovered === i ? 1 : 0,
                  transform: hovered === i ? "translateY(0)" : "translateY(18px)",
                  transition: `opacity 0.45s ${hoverEase}, transform 0.55s ${hoverEase}`,
                }}
              />

              <div
                className="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex justify-center"
                style={{
                  opacity: hovered === i ? 1 : 0,
                  transform: hovered === i ? "translateY(0)" : "translateY(18px)",
                  transition: `opacity 0.42s ${hoverEase}, transform 0.58s ${hoverEase}`,
                }}
              >
                <span className="text-[10px] font-thin tracking-[0.18em] text-white drop-shadow-[0_3px_12px_rgba(0,0,0,0.85)] sm:text-[11px]">
                  See more
                </span>
              </div>

              {!book.coverImage ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <HiOutlineBookOpen className="text-5xl text-white/85" />
                </div>
              ) : null}
            </div>
          </Link>
        ))}
      </div>

    </div>
  );
}

export default FannedBooks;
