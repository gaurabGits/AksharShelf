import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  HiExclamationTriangle,
  HiOutlineBookOpen,
  HiOutlineMagnifyingGlass,
  HiOutlineSparkles,
  HiOutlineStar,
  HiStar,
} from "react-icons/hi2";
import AdminNavbar from "../Components/adminNavbar";
import { fetchAllBooks } from "../adminAPI";
import { useNotification } from "../../context/Notification";

const PUBLIC_API_BASE = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? "http://localhost:3000/api" : "/api");

function Stars({ value = 0 }) {
  const rating = Math.max(0, Math.min(5, Number(value) || 0));
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) =>
        s <= rating ? (
          <HiStar key={s} className="text-amber-400 text-sm" />
        ) : (
          <HiOutlineStar key={s} className="text-slate-300 text-sm" />
        )
      )}
    </div>
  );
}

function RecCard({ title, subtitle, items, loading }) {
  return (
    <section className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <p className="text-sm font-semibold text-[#1a1a2e]">{title}</p>
        <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
      </div>

      {loading ? (
        <div className="p-5 space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-10 bg-slate-100 rounded animate-pulse" />
          ))}
        </div>
      ) : !items?.length ? (
        <div className="p-10 text-center text-slate-400 text-sm">No recommendations.</div>
      ) : (
        <div className="divide-y divide-slate-50">
          {items.map((b) => (
            <div key={b._id} className="p-4 flex items-center gap-3 hover:bg-slate-50">
              {b.coverImage ? (
                <img
                  src={b.coverImage}
                  alt={b.title || "Book cover"}
                  className="w-10 h-12 rounded-md object-cover border border-slate-100"
                  loading="lazy"
                />
              ) : (
                <div className="w-10 h-12 rounded-md bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-100">
                  <HiOutlineBookOpen />
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-800 truncate">{b.title || "—"}</p>
                <p className="text-xs text-slate-400 truncate">{b.author || "Unknown Author"}</p>
                {Array.isArray(b.recommendation?.reasons) && b.recommendation.reasons.length > 0 ? (
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                    {b.recommendation.reasons.join(" • ")}
                  </p>
                ) : null}
              </div>

              <div className="text-right shrink-0">
                <p className="text-[11px] font-semibold text-slate-500">Score</p>
                <p className="text-sm font-bold text-indigo-600">
                  {Number.isFinite(Number(b.recommendation?.score))
                    ? Number(b.recommendation.score).toFixed(2)
                    : "0.00"}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

const AdminAlgorithm = () => {
  const notify = useNotification();
  const [books, setBooks] = useState([]);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState("");

  const [loadingRecs, setLoadingRecs] = useState(false);
  const [contentBased, setContentBased] = useState(null);
  const [collaborative, setCollaborative] = useState(null);

  const loadBooks = useCallback(async () => {
    try {
      const { data } = await fetchAllBooks();
      setBooks(Array.isArray(data) ? data : []);
    } catch (err) {
      const message = err.response?.data?.message || "Failed to load books";
      setError(message);
      notify.error("Load Error", message);
    } finally {
      setLoadingBooks(false);
    }
  }, [notify]);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  const selectedBook = useMemo(
    () => books.find((b) => String(b._id) === String(selectedId)),
    [books, selectedId]
  );

  const filteredBooks = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return books;
    return books.filter((b) => {
      const title = String(b.title || "").toLowerCase();
      const author = String(b.author || "").toLowerCase();
      const category = String(b.category || "").toLowerCase();
      return title.includes(q) || author.includes(q) || category.includes(q);
    });
  }, [books, search]);

  const ratedMeta = useMemo(() => {
    const avg = Number(selectedBook?.averageRating) || 0;
    const total = Number(selectedBook?.totalRatings) || 0;
    return { avg, total };
  }, [selectedBook]);

  const loadRecs = useCallback(async (bookId) => {
    if (!bookId) return;
    setLoadingRecs(true);
    setError("");
    try {
      const [cb, cf] = await Promise.all([
        axios.get(`${PUBLIC_API_BASE}/books/${bookId}/recommendations`),
        axios.get(`${PUBLIC_API_BASE}/books/${bookId}/recommendations/collaborative`),
      ]);
      setContentBased(cb.data || null);
      setCollaborative(cf.data || null);
    } catch (err) {
      const message = err.response?.data?.message || "Failed to load recommendations";
      setError(message);
      notify.error("Recommendation Error", message);
    } finally {
      setLoadingRecs(false);
    }
  }, [notify]);

  useEffect(() => {
    if (!selectedId) return;
    loadRecs(selectedId);
  }, [selectedId, loadRecs]);

  return (
    <div className="h-screen bg-[#f5f6fa] flex overflow-hidden">
      <AdminNavbar />

      <main className="flex-1 min-w-0 overflow-y-auto bg-[#f5f6fa] pt-20 md:pt-10">
        <div className="admin-page-container space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-[#1a1a2e] flex items-center gap-2">
              <HiOutlineSparkles className="text-xl" /> Recommendation Algorithm
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Preview content-based and collaborative recommendations for any book.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              <span className="inline-flex items-center gap-2">
                <HiExclamationTriangle /> {error}
              </span>
            </div>
          )}

          {/* Picker */}
          <section className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Choose Book
                </label>
                <div className="mt-2">
                  <select
                    value={selectedId}
                    onChange={(e) => setSelectedId(e.target.value)}
                    className="w-full py-2.5 px-3 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
                    disabled={loadingBooks}
                  >
                    <option value="">{loadingBooks ? "Loading..." : "Select a book"}</option>
                    {filteredBooks.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.title} — {b.author}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Filter
                </label>
                <div className="relative mt-2">
                  <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search title, author, category…"
                    className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  {filteredBooks.length} book{filteredBooks.length !== 1 ? "s" : ""} shown
                </p>
              </div>
            </div>
          </section>

          {/* Selected Book */}
          {selectedBook && (
            <section className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  {selectedBook.coverImage ? (
                    <img
                      src={selectedBook.coverImage}
                      alt={selectedBook.title || "Book cover"}
                      className="w-14 h-16 rounded-lg object-cover border border-slate-100"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-14 h-16 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-100">
                      <HiOutlineBookOpen className="text-xl" />
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="text-base font-bold text-slate-800 truncate">{selectedBook.title}</p>
                    <p className="text-sm text-slate-500 truncate">{selectedBook.author}</p>
                    <p className="text-xs text-slate-400 truncate">{selectedBook.category || "—"}</p>
                  </div>
                </div>

                <div className="sm:ml-auto flex items-center gap-3">
                  <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2">
                    <p className="text-[11px] font-semibold text-slate-500 flex items-center gap-2">
                      <HiOutlineStar /> Rating
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Stars value={ratedMeta.avg} />
                      <p className="text-xs text-slate-500">
                        {ratedMeta.avg ? ratedMeta.avg.toFixed(1) : "0.0"} ({ratedMeta.total})
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Recommendations */}
          {selectedId ? (
            <div className="grid lg:grid-cols-2 gap-5">
              <RecCard
                title="Content-based"
                subtitle="Matches category, author and text similarity."
                items={contentBased?.books}
                loading={loadingRecs}
              />
              <RecCard
                title="Collaborative"
                subtitle="Based on what similar readers viewed/read."
                items={collaborative?.books}
                loading={loadingRecs}
              />
            </div>
          ) : (
            <section className="bg-white rounded-xl border border-slate-100 shadow-sm p-10 text-center text-slate-400">
              <p className="text-3xl mb-2">✨</p>
              <p className="text-sm">Select a book to preview recommendations.</p>
            </section>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminAlgorithm;
