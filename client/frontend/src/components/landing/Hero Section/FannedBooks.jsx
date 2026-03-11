import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { HiArrowRight, HiOutlineBookOpen, HiOutlineEye, HiOutlineStar } from "react-icons/hi2";
import API from "../../../services/api";

function FannedBooks() {
  const [books, setBooks] = useState(null);
  const [hovered, setHovered] = useState(null);

  useEffect(() => {
    const BOOK_GRADIENTS = [
      "from-blue-500 to-purple-600",
      "from-amber-500 to-orange-600",
      "from-green-500 to-teal-600",
    ];

    const fetchBooks = async () => {
      try {
        let res;
        try {
          res = await API.get("/books/popular", { params: { limit: 3 } });
        } catch {
          res = await API.get("/books");
        }

        const booksArray = res?.data?.books;

        if (Array.isArray(booksArray)) {
          const topThree = booksArray.slice(0, 3).map(({ title, author, _id, views, reads }, idx) => ({
            title,
            author,
            id: _id,
            rank: idx + 1,
            views: Number.isFinite(views) ? views : 0,
            reads: Number.isFinite(reads) ? reads : 0,
          }));

          // Layout order: most popular in middle, 2nd left, 3rd right
          const ordered = topThree.length === 3 ? [topThree[1], topThree[0], topThree[2]] : topThree;

          setBooks(
            ordered.map((book, idx) => ({
              ...book,
              img: BOOK_GRADIENTS[idx] || BOOK_GRADIENTS[0],
            }))
          );
        }
      } catch (error) {
        console.error("Failed to fetch books:", error);
      }
    };

    fetchBooks();
  }, []);



  const FAN_IDLE = [
    { rotate: -14, x: -100, z: 10 },
    { rotate: 0, x: 0, z: 20 },
    { rotate: 14, x: 100, z: 30 },
  ];

  const getCardStyle = (i) => {
    const base = FAN_IDLE[i];

    if (hovered === null) {
      return {
        transform: `translateX(${base.x}px) rotate(${base.rotate}deg)`,
        zIndex: base.z,
        transition: "transform 0.45s cubic-bezier(0.22,1,0.36,1)",
      };
    }

    if (hovered === i) {
      return {
        transform: `translateX(${base.x}px) rotate(0deg) translateY(-28px) scale(1.08)`,
        zIndex: 60,
        transition: "transform 0.35s cubic-bezier(0.22,1,0.36,1)",
      };
    }

    const spread = i < hovered ? -22 : 22;

    return {
      transform: `translateX(${base.x + spread}px) rotate(${base.rotate + (i < hovered ? -5 : 5)}deg)`,
      zIndex: base.z,
      transition: "transform 0.35s cubic-bezier(0.22,1,0.36,1)",
    };
  };

  return (
    <div
      className="hidden lg:flex flex-col items-center justify-center gap-6"
      onMouseLeave={() => setHovered(null)}
    >
      <div className="relative flex items-end justify-center w-[380px] h-[300px] perspective-[1200px]">

        {/* Softer ground shadow */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-72 h-6 bg-black/15 dark:bg-black/30 rounded-full blur-2xl pointer-events-none" />

        {books && books.map((book, i) => (
          <Link
            key={book.id || i}
            to={book.id ? `/books/${book.id}` : "/books"}
            className="absolute bottom-4"
            style={{
              ...getCardStyle(i),
              transformOrigin: "bottom center",
            }}
            onMouseEnter={() => setHovered(i)}
          >
            <div
              className={`relative w-44 h-64 rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.4)]
                          bg-gradient-to-br ${book.img}
                          flex flex-col justify-between p-5 select-none cursor-pointer
                          transition-shadow duration-300 hover:shadow-[0_35px_70px_-10px_rgba(0,0,0,0.5)]`}
            >
              {/* Soft edge highlight */}
              <div className="absolute inset-0 rounded-2xl border border-white/10 pointer-events-none" />

              {/* Gloss */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/30 to-transparent pointer-events-none" />

              {/* Top */}
              <div className="flex items-start justify-between relative z-10">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <HiOutlineBookOpen className="text-white text-xl" />
                </div>

                <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-full px-2.5 py-1">
                  <HiOutlineStar className="text-white text-[10px]" />
                  <span className="text-white text-[10px] font-bold">
                    #{book.rank ?? i + 1}
                  </span>
                </div>
              </div>

              {/* Bottom */}
              <div className="relative z-10">
                <p className="text-white font-bold text-sm leading-snug line-clamp-2">
                  {book.title}
                </p>
                <p className="text-white/70 text-[11px] mt-1.5">
                  {book.author}
                </p>

                <div className="mt-2 flex items-center gap-3 text-white/85 text-[11px] font-medium">
                  <span className="inline-flex items-center gap-1">
                    <HiOutlineEye className="text-xs" />
                    {book.views}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <HiOutlineBookOpen className="text-xs" />
                    {book.reads}
                  </span>
                </div>

                <div
                  className="mt-3 flex items-center gap-1 text-white/90 text-[11px] font-medium"
                  style={{
                    opacity: hovered === i ? 1 : 0,
                    transform: hovered === i ? "translateY(0)" : "translateY(6px)",
                    transition: "opacity 0.25s ease, transform 0.25s ease",
                  }}
                >
                  View book <HiArrowRight className="text-xs" />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <Link
        to="/books"
        className="text-xs text-gray-400 dark:text-gray-600 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1"
      >
        View all books <HiArrowRight className="text-sm" />
      </Link>
    </div>
  );
}

export default FannedBooks;
