import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Document, Page, pdfjs } from "react-pdf";
import {
  FiArrowLeft, FiChevronLeft, FiChevronRight, FiColumns,
  FiFileText, FiGrid, FiRotateCcw, FiMinus, FiPlus,
  FiSearch, FiX, FiBookmark, FiClock,
  FiMaximize2, FiTrash2,
} from "react-icons/fi";
import { RiFocusMode } from "react-icons/ri";
import { fetchBookDetail, persistReadingProgress } from "../services/bookService";
import APIClient from "../services/api.jsx";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

const API_BASE     = String(APIClient.defaults.baseURL || "").replace(/\/$/, "");
const MIN_SCALE    = 0.5;
const MAX_SCALE    = 4.0;
const THUMB_W      = 108;
const FALLBACK_ASP = 1 / 1.414;
const GUTTER       = 12;
const PAGE_GAP     = 20;
const V_PAD        = 24;
const SELECTION_DEBOUNCE_MS = 180;
const MIN_SELECTION_CHARS   = 2;
const READING_PROGRESS_FLUSH_MS = 20000;

const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
const clamp    = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/* ─── Highlight palette ─── */
const HIGHLIGHT_COLORS = [
  { name: "Yellow", solid: "#f59e0b", bg: "rgba(251,191,36,0.55)",  border: "#f59e0b" },
  { name: "Lime",   solid: "#84cc16", bg: "rgba(132,204,22,0.52)",  border: "#84cc16" },
  { name: "Cyan",   solid: "#06b6d4", bg: "rgba(6,182,212,0.48)",   border: "#06b6d4" },
  { name: "Pink",   solid: "#f472b6", bg: "rgba(244,114,182,0.52)", border: "#f472b6" },
  { name: "Violet", solid: "#a78bfa", bg: "rgba(167,139,250,0.52)", border: "#a78bfa" },
];

/* ─────────────────────────────────────────────────────────────────────────
   mergeRectsIntoLines
   Takes raw DOMRect[] (viewport-absolute) + the page's bounding rect,
   converts to page-relative pixels, then groups rects on the same visual
   line and merges each group into ONE wide rect — fixing the "center-only"
   highlight gap problem caused by PDF text spans being stored as dozens of
   tiny individual word/character boxes.
──────────────────────────────────────────────────────────────────────────── */
function mergeRectsIntoLines(clientRects, pageRect) {
  const rel = clientRects
    .filter((r) => r.width > 0.5 && r.height > 0.5)
    .map((r) => ({
      left:   r.left   - pageRect.left,
      top:    r.top    - pageRect.top,
      right:  r.right  - pageRect.left,
      bottom: r.bottom - pageRect.top,
    }));

  if (!rel.length) return [];

  rel.sort((a, b) => a.top - b.top || a.left - b.left);

  // Merge rects whose vertical midpoints are within 60% of average height
  const lines = [];
  for (const r of rel) {
    const mid = (r.top + r.bottom) / 2;
    const h   = r.bottom - r.top;
    let placed = false;
    for (const line of lines) {
      const lineMid = (line.top + line.bottom) / 2;
      if (Math.abs(mid - lineMid) < h * 0.6) {
        line.left   = Math.min(line.left,   r.left);
        line.right  = Math.max(line.right,  r.right);
        line.top    = Math.min(line.top,    r.top);
        line.bottom = Math.max(line.bottom, r.bottom);
        placed = true;
        break;
      }
    }
    if (!placed) lines.push({ ...r });
  }

  return lines.map((l) => ({
    left:   (l.left   / pageRect.width)  * 100,
    top:    (l.top    / pageRect.height) * 100,
    width:  ((l.right - l.left) / pageRect.width)  * 100,
    height: ((l.bottom - l.top) / pageRect.height) * 100,
  }));
}

function getSelectionPageSurface(node) {
  const el = node?.nodeType === 1 ? node : node?.parentElement;
  return el?.closest?.("[data-page-surface]") || null;
}

function topBtn(active = false) {
  return [
    "inline-flex h-9 w-9 items-center justify-center rounded-full border text-sm font-medium transition-all",
    active ? "border-white bg-white text-black shadow-md"
           : "border-white/15 bg-white/8 text-white hover:bg-white/15 hover:border-white/30",
  ].join(" ");
}
function dockBtn(active = false) {
  return [
    "inline-flex h-9 w-9 items-center justify-center rounded-lg border text-white transition-all",
    active ? "border-white/40 bg-white/20" : "border-transparent hover:border-white/20 hover:bg-white/10",
  ].join(" ");
}

export default function ReaderPage() {
  const { id }   = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  /* refs */
  const containerRef      = useRef(null);
  const singleViewRef     = useRef(null);
  const doubleViewRef     = useRef(null);
  const pdfDocRef         = useRef(null);
  const searchInputRef    = useRef(null);
  const debSearchRef      = useRef(null);
  const touchRef          = useRef(null);
  const panRef            = useRef({ active: false, startX: 0, startY: 0, sl: 0, st: 0, didMove: false });
  const dragHintTimer     = useRef(null);
  const transitionTimer   = useRef(null);
  const activeKeyRef      = useRef("");
  const prevScaleRef      = useRef(1);
  const singleObsRef      = useRef(null);
  const doubleTapRef      = useRef({ lastTime: 0, lastX: 0, lastY: 0 });
  const hlToolbarRef      = useRef(null);
  const prevQueryRef      = useRef("");
  const selectionTimerRef = useRef(null);
  const isSelectingRef    = useRef(false);
  const currentPageRef    = useRef(1);
  const pendingReadSecondsRef = useRef(0);
  const isFlushingReadProgressRef = useRef(false);

  /* FIX 1 — stash the page we want to jump to in single mode */
  const pendingSingleScrollRef = useRef(null);

  /* ── core state ── */
  const [bookTitle,       setBookTitle]       = useState(() => location.state?.bookTitle?.trim() || "Book Reader");
  const [numPages,        setNumPages]        = useState(null);
  const [currentPage,     setCurrentPage]     = useState(1);
  const [doublePage,      setDoublePage]      = useState(true);
  const [prevRenderPages, setPrevRenderPages] = useState(null);
  const [fadeIn,          setFadeIn]          = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [readyPages,      setReadyPages]      = useState({});
  const [scale,           setScale]           = useState(1);
  const [pdfAsp,          setPdfAsp]          = useState(FALLBACK_ASP);
  const [vpW,             setVpW]             = useState(0);
  const [vpH,             setVpH]             = useState(0);
  const [bookError,       setBookError]       = useState("");
  const [accessChecked,   setAccessChecked]   = useState(false);
  const [serverLastReadPage, setServerLastReadPage] = useState(1);

  /* panels */
  const [sidebarOpen,   setSidebarOpen]   = useState(false);
  const [hlSidebarOpen, setHlSidebarOpen] = useState(false);
  const [searchOpen,    setSearchOpen]    = useState(false);
  const [showGoTo,      setShowGoTo]      = useState(false);
  const [goToInput,     setGoToInput]     = useState("");

  /* search */
  const [searchQuery,   setSearchQuery]   = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchIdx,     setSearchIdx]     = useState(0);
  const [searching,     setSearching]     = useState(false);

  const [focusMode,    setFocusMode]    = useState(false);
  const [isDragging,   setIsDragging]   = useState(false);
  const [showDragHint, setShowDragHint] = useState(false);

  const [bookmarks,   setBookmarks]   = useState([]);
  const [elapsed,     setElapsed]     = useState(0);
  const [thumbLoaded, setThumbLoaded] = useState(30);

  /* highlights */
  const highlightsKey = `reader-highlights-${id}`;
  const [highlights,     setHighlights]     = useState(() => {
    try { return JSON.parse(localStorage.getItem(`reader-highlights-${id}`) || "[]"); }
    catch { return []; }
  });
  const [hlToolbar,      setHlToolbar]      = useState(null);
  const [activeColorIdx, setActiveColorIdx] = useState(0);
  const [hlFilter,       setHlFilter]       = useState("all");

  const token       = localStorage.getItem("token");
  const progressKey = `reader-progress-${id}`;
  const bmsKey      = `reader-bookmarks-${id}`;
  const viewModeKey = `reader-viewmode-${id}`;
  const FADE_MS     = 200;

  const leftSidebarW  = sidebarOpen   ? 144 : 0;
  const rightSidebarW = hlSidebarOpen ? 260 : 0;
  const sidebarW      = leftSidebarW + rightSidebarW;

  const leftPage = useMemo(() => {
    if (!doublePage) return currentPage;
    return currentPage % 2 === 0 ? Math.max(1, currentPage - 1) : currentPage;
  }, [currentPage, doublePage]);

  const rightPage = useMemo(() => {
    if (!doublePage || !numPages) return null;
    const r = leftPage + 1;
    return r <= numPages ? r : null;
  }, [leftPage, doublePage, numPages]);

  const renderPages = useMemo(
    () => (doublePage ? (rightPage ? [leftPage, rightPage] : [leftPage]) : [currentPage]),
    [doublePage, leftPage, rightPage, currentPage]
  );

  const baseDims = useMemo(() => {
    if (vpW === 0 || vpH === 0) return { pageW: 500, pageH: 707 };
    const numCols = rightPage ? 2 : 1;
    const availW  = Math.max(200, vpW - sidebarW);
    const availH  = Math.max(200, vpH - V_PAD * 2);
    const byH_W   = Math.round(availH * pdfAsp);
    const totalW  = byH_W * numCols + (numCols > 1 ? GUTTER : 0);
    if (totalW <= availW) return { pageW: byH_W, pageH: availH };
    const colW = Math.floor((availW - (numCols > 1 ? GUTTER : 0)) / numCols);
    return { pageW: colW, pageH: Math.min(Math.round(colW / pdfAsp), availH) };
  }, [vpW, vpH, sidebarW, pdfAsp, rightPage]);

  const scaledPageW   = Math.round(baseDims.pageW * scale);
  const scaledPageH   = Math.round(baseDims.pageH * scale);
  const numCols       = renderPages.length;
  const frameW        = scaledPageW * numCols + (numCols > 1 ? GUTTER : 0);
  const frameH        = scaledPageH;
  const doubleViewerW = Math.max(200, vpW - sidebarW);
  const doubleViewerH = Math.max(200, vpH);
  const dblContentW   = Math.max(frameW, doubleViewerW);
  const dblContentH   = Math.max(frameH + V_PAD * 2, doubleViewerH);
  const singlePageW   = 800;

  const canPanZoom      = scale > 1;
  const canGoPrev       = currentPage > 1;
  const canGoNext       = !!numPages && currentPage < numPages;
  const isBookmarked    = bookmarks.some((b) => b.page === currentPage);
  const sortedBookmarks = useMemo(() => [...bookmarks].sort((a, b) => a.page - b.page), [bookmarks]);
  const progress        = numPages ? (currentPage / numPages) * 100 : 0;

  const activeRenderKey = useMemo(
    () => [renderPages.join("-"), scaledPageW, scaledPageH].join(":"),
    [renderPages, scaledPageW, scaledPageH]
  );
  const isRenderReady = renderPages.every((n) => !!readyPages[n]);
  const activeRef     = doublePage ? doubleViewRef : singleViewRef;

  const numberedHighlights = useMemo(
    () => [...highlights].sort((a, b) => a.page - b.page || a.id - b.id).map((h, i) => ({ ...h, num: i + 1 })),
    [highlights]
  );
  const filteredHighlights = useMemo(
    () => numberedHighlights.filter((h) => hlFilter === "all" || h.colorIdx === Number(hlFilter)),
    [numberedHighlights, hlFilter]
  );

  useEffect(() => { localStorage.setItem(highlightsKey, JSON.stringify(highlights)); }, [highlights, highlightsKey]);
  useEffect(() => { localStorage.setItem(viewModeKey, doublePage ? "double" : "single"); }, [doublePage, viewModeKey]);
  useEffect(() => { currentPageRef.current = currentPage; }, [currentPage]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(viewModeKey);
      if (saved === "single") setDoublePage(false);
      else if (saved === "double") setDoublePage(true);
    } catch { /**/ }
  }, [viewModeKey]);

  /* ════════════════════════════════════════════════════════════
     FIX 1 — reliable scroll to preserved page after mode switch.

     scrollSingleToPage retries up to `retries` times every 100ms
     until the [data-page] element exists in the DOM and scrolls it
     into view. pendingSingleScrollRef is cleared on success.
  ════════════════════════════════════════════════════════════ */
  const flushReadingProgress = useCallback(async ({ useKeepalive = false } = {}) => {
    if (!token || isFlushingReadProgressRef.current) return;

    const secondsSpent = pendingReadSecondsRef.current;
    if (secondsSpent <= 0) return;

    const payload = {
      bookId: id,
      secondsSpent,
      lastReadPage: Math.max(1, currentPageRef.current || 1),
    };

    pendingReadSecondsRef.current = 0;

    if (useKeepalive && typeof window !== "undefined" && typeof window.fetch === "function") {
      try {
        window.fetch(`${API_BASE}/bookshelf/progress`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
          keepalive: true,
        }).catch(() => {});
        return;
      } catch {
        pendingReadSecondsRef.current += secondsSpent;
        return;
      }
    }

    isFlushingReadProgressRef.current = true;
    try {
      await persistReadingProgress(payload);
    } catch {
      pendingReadSecondsRef.current += secondsSpent;
    } finally {
      isFlushingReadProgressRef.current = false;
    }
  }, [id, token]);

  const scrollSingleToPage = useCallback((pageNum, retries = 10) => {
    const container = singleViewRef.current;
    if (!container) {
      if (retries > 0) setTimeout(() => scrollSingleToPage(pageNum, retries - 1), 100);
      return;
    }
    const el = container.querySelector(`[data-page="${pageNum}"]`);
    if (el) {
      el.scrollIntoView({ behavior: "auto", block: "start" });
      pendingSingleScrollRef.current = null;
    } else if (retries > 0) {
      setTimeout(() => scrollSingleToPage(pageNum, retries - 1), 100);
    }
  }, []);

  const switchToSingle = useCallback(() => {
    const target = leftPage; // snapshot BEFORE toggling
    pendingSingleScrollRef.current = target;
    setCurrentPage(target);
    setDoublePage(false);
    setTimeout(() => scrollSingleToPage(target), 60);
  }, [leftPage, scrollSingleToPage]);

  const switchToDouble = useCallback(() => {
    pendingSingleScrollRef.current = null;
    setDoublePage(true);
  }, []);

  /* scroll helpers */
  const getScrollState = useCallback(() => {
    const v = activeRef.current;
    if (!v) return { v: null, canX: false, canY: false, atT: true, atB: true };
    return {
      v,
      canX: v.scrollWidth  > v.clientWidth  + 1,
      canY: v.scrollHeight > v.clientHeight + 1,
      atT:  v.scrollTop <= 1,
      atB:  v.scrollTop + v.clientHeight >= v.scrollHeight - 1,
    };
  }, [activeRef]);

  const scrollBy = useCallback((dx, dy, behavior = "smooth") => {
    const v = activeRef.current;
    if (!v) return false;
    const nL = clamp(v.scrollLeft + dx, 0, Math.max(0, v.scrollWidth  - v.clientWidth));
    const nT = clamp(v.scrollTop  + dy, 0, Math.max(0, v.scrollHeight - v.clientHeight));
    if (nL === v.scrollLeft && nT === v.scrollTop) return false;
    v.scrollTo({ left: nL, top: nT, behavior });
    return true;
  }, [activeRef]);

  useEffect(() => {
    let dead = false;
    fetchBookDetail(id)
      .then(({ data }) => {
        if (dead) return;

        const nextTitle = data?.book?.title?.trim() || data?.title?.trim() || "Book Reader";
        const canRead = Boolean(data?.access?.canRead);
        const isPaid = Boolean(data?.book?.isPaid);
        const nextLastReadPage = Math.max(1, Math.floor(Number(data?.book?.lastReadPage) || 1));

        setBookTitle(nextTitle);
        setServerLastReadPage(nextLastReadPage);
        setAccessChecked(true);

        if (!canRead) {
          if (!token) {
            navigate("/auth/login", { replace: true, state: { from: `/read/${id}` } });
            return;
          }

          if (isPaid) {
            navigate(`/purchase/${id}`, {
              replace: true,
              state: { bookTitle: nextTitle },
            });
            return;
          }

          setBookError("You do not have access to read this book.");
        }
      })
      .catch(() => {
        if (dead) return;
        setBookTitle("Book Reader");
        setAccessChecked(true);
      });
    return () => { dead = true; };
  }, [id, navigate, token]);
  useEffect(() => { document.title = `${bookTitle} | Read`; return () => { document.title = "eBook Platform"; }; }, [bookTitle]);

  useEffect(() => {
    try { const r = JSON.parse(localStorage.getItem(bmsKey) || "[]"); setBookmarks(Array.isArray(r) ? r : []); }
    catch { setBookmarks([]); }
  }, [bmsKey]);

  useEffect(() => {
    const t = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      pendingReadSecondsRef.current += 1;
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!token) return;

    const t = setInterval(() => { void flushReadingProgress(); }, READING_PROGRESS_FLUSH_MS);
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") void flushReadingProgress({ useKeepalive: true });
    };
    const onPageHide = () => { void flushReadingProgress({ useKeepalive: true }); };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", onPageHide);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", onPageHide);
      clearInterval(t);
      void flushReadingProgress();
    };
  }, [flushReadingProgress, token]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const upd = () => { setVpW(el.clientWidth); setVpH(el.clientHeight); };
    upd();
    const ro = new ResizeObserver(upd);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const file    = useMemo(() => ({ url: `${API_BASE}/books/${id}/read`, httpHeaders: token ? { Authorization: `Bearer ${token}` } : undefined }), [id, token]);
  const options = useMemo(() => ({ cMapUrl: "https://unpkg.com/pdfjs-dist/cmaps/", cMapPacked: true, standardFontDataUrl: "https://unpkg.com/pdfjs-dist/standard_fonts/" }), []);

  const onLoadSuccess = useCallback((pdf) => {
    pdfDocRef.current = pdf;
    setNumPages(pdf.numPages);
    setBookError("");
    pdf.getPage(1).then((pg) => { const vp = pg.getViewport({ scale: 1 }); setPdfAsp(vp.width / vp.height); }).catch(() => {});
    const localSaved = parseInt(localStorage.getItem(progressKey), 10);
    const nextPage = localSaved >= 1 && localSaved <= pdf.numPages
      ? localSaved
      : serverLastReadPage >= 1 && serverLastReadPage <= pdf.numPages
        ? serverLastReadPage
        : null;
    if (nextPage) setCurrentPage(nextPage);
    // If a mode-switch scroll is pending, retry now that the PDF is ready
    if (!doublePage && pendingSingleScrollRef.current) {
      setTimeout(() => scrollSingleToPage(pendingSingleScrollRef.current), 80);
    }
  }, [progressKey, doublePage, scrollSingleToPage, serverLastReadPage]);

  const onLoadError = useCallback((err) => { console.error(err); setBookError("Failed to load this PDF."); }, []);

  useEffect(() => { if (numPages && currentPage > 0) localStorage.setItem(progressKey, String(currentPage)); }, [currentPage, numPages, progressKey]);

  /* single: IntersectionObserver — suppressed while pending scroll */
  useEffect(() => {
    if (doublePage || !numPages || !singleViewRef.current) return;
    const root = singleViewRef.current;
    singleObsRef.current?.disconnect();
    const timer = setTimeout(() => {
      // Execute pending scroll from mode switch if still needed
      if (pendingSingleScrollRef.current) {
        scrollSingleToPage(pendingSingleScrollRef.current);
      }
      singleObsRef.current = new IntersectionObserver(
        (entries) => {
          if (pendingSingleScrollRef.current) return; // ignore while scrolling
          let best = null, bestRatio = 0;
          entries.forEach((e) => { if (e.isIntersecting && e.intersectionRatio > bestRatio) { bestRatio = e.intersectionRatio; best = e.target; } });
          if (best) { const p = parseInt(best.dataset.page, 10); if (p) setCurrentPage(p); }
        },
        { root, threshold: [0.1, 0.5, 0.9] }
      );
      root.querySelectorAll("[data-page]").forEach((el) => singleObsRef.current.observe(el));
    }, 150);
    return () => { clearTimeout(timer); singleObsRef.current?.disconnect(); };
  }, [doublePage, numPages, scale, scrollSingleToPage]);

  const goToPage = useCallback((p) => {
    if (!numPages) return;
    let t = clamp(Math.round(p), 1, numPages);
    if (doublePage && t % 2 === 0) t = Math.max(1, t - 1);
    setCurrentPage(t);
    if (!doublePage && singleViewRef.current) {
      const el = singleViewRef.current.querySelector(`[data-page="${t}"]`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [numPages, doublePage]);

  const navigatePage = useCallback((target) => {
    if (!doublePage) { goToPage(target); return; }
    if (isTransitioning) return;
    setPrevRenderPages(renderPages);
    setFadeIn(false);
    setIsTransitioning(true);
    setReadyPages({});
    goToPage(target);
  }, [doublePage, isTransitioning, renderPages, goToPage]);

  const goToPrev = useCallback(() => { if (!canGoPrev) return; navigatePage(currentPage - (doublePage ? 2 : 1)); }, [currentPage, navigatePage, doublePage, canGoPrev]);
  const goToNext = useCallback(() => { if (!canGoNext) return; navigatePage(currentPage + (doublePage ? 2 : 1)); }, [currentPage, navigatePage, doublePage, canGoNext]);

  useEffect(() => { activeKeyRef.current = activeRenderKey; setReadyPages({}); setFadeIn(false); }, [activeRenderKey]);

  useEffect(() => {
    clearTimeout(transitionTimer.current);
    if (!prevRenderPages || !isRenderReady) return;
    requestAnimationFrame(() => { requestAnimationFrame(() => { setTimeout(() => setFadeIn(true), 50); }); });
    transitionTimer.current = setTimeout(() => { setPrevRenderPages(null); setFadeIn(false); setIsTransitioning(false); }, FADE_MS + 100);
    return () => clearTimeout(transitionTimer.current);
  }, [prevRenderPages, isRenderReady]);

  useEffect(() => () => clearTimeout(transitionTimer.current), []);
  useEffect(() => { if (doublePage && doubleViewRef.current) doubleViewRef.current.scrollTo({ top: 0, left: 0, behavior: "auto" }); }, [currentPage, doublePage]);
  useEffect(() => {
    if (!doublePage) return;
    const v = doubleViewRef.current;
    if (!v || prevScaleRef.current === scale) return;
    prevScaleRef.current = scale;
    requestAnimationFrame(() => { v.scrollTo({ left: Math.max(0, (v.scrollWidth - v.clientWidth) / 2), top: Math.max(0, (v.scrollHeight - v.clientHeight) / 2), behavior: "auto" }); });
  }, [scale, doublePage, frameW, frameH]);
  useEffect(() => { if (doublePage && scale <= 1 && doubleViewRef.current) { doubleViewRef.current.scrollTo({ top: 0, left: 0, behavior: "auto" }); panRef.current.active = false; setIsDragging(false); } }, [scale, doublePage]);

  /* ════════════════════════════════════════════════════════════
     FIX 2 — HIGHLIGHT SELECTION
     Uses mergeRectsIntoLines to produce one continuous rect per
     text line instead of dozens of fragmented span-level boxes.
  ════════════════════════════════════════════════════════════ */
  const handleTextSelection = useCallback(() => {
    clearTimeout(selectionTimerRef.current);
    selectionTimerRef.current = setTimeout(() => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.toString().trim()) {
        if (!isSelectingRef.current) setHlToolbar(null);
        return;
      }
      const text = sel.toString().replace(/\s+/g, " ").trim();
      if (!text) return;

      const range  = sel.getRangeAt(0);
      const startPageEl = getSelectionPageSurface(range.startContainer);
      const endPageEl   = getSelectionPageSurface(range.endContainer);
      if (!startPageEl || startPageEl !== endPageEl) {
        if (!isSelectingRef.current) setHlToolbar(null);
        return;
      }

      const pageEl = startPageEl;
      if (!pageEl) return;

      const pageNum  = parseInt(pageEl.dataset.page, 10);
      if (!pageNum) return;

      const pageRect = pageEl.getBoundingClientRect();
      const rawRects = Array.from(range.getClientRects());
      if (!rawRects.length || (text.length < MIN_SELECTION_CHARS && rawRects.length === 1)) {
        if (!isSelectingRef.current) setHlToolbar(null);
        return;
      }

      // Merge fragmented per-span rects into one rect per visual line
      const rects = mergeRectsIntoLines(rawRects, pageRect);
      if (!rects.length) return;

      const selectionBounds = range.getBoundingClientRect();
      const toolbarWidth = 264;
      const toolbarHeight = 52;
      const placeBelow = selectionBounds.top < toolbarHeight + 20;
      setHlToolbar({
        text, rects, page: pageNum,
        top: placeBelow
          ? Math.min(window.innerHeight - toolbarHeight - 8, selectionBounds.bottom + 12)
          : Math.max(8, selectionBounds.top - toolbarHeight - 12),
        left: clamp(
          selectionBounds.left + selectionBounds.width / 2 - toolbarWidth / 2,
          8,
          window.innerWidth - toolbarWidth - 8
        ),
        placeBelow,
      });
    }, SELECTION_DEBOUNCE_MS);
  }, []);

  useEffect(() => {
    const onDown = (e) => {
      if (hlToolbarRef.current && !hlToolbarRef.current.contains(e.target)) {
        const sel   = window.getSelection();
        const range = sel?.rangeCount > 0 ? sel.getRangeAt(0) : null;
        const inTL  = range?.commonAncestorContainer?.parentElement?.closest?.(".react-pdf__Page__textContent");
        if (!inTL) { setHlToolbar(null); window.getSelection()?.removeAllRanges(); }
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const confirmHighlight = useCallback((colorIdx) => {
    if (!hlToolbar) return;
    setHighlights((prev) => [...prev, { id: Date.now() + Math.random(), ...hlToolbar, colorIdx }]);
    setActiveColorIdx(colorIdx);
    setHlToolbar(null);
    window.getSelection()?.removeAllRanges();
    setHlSidebarOpen(true);
  }, [hlToolbar]);

  const removeHighlight = useCallback((hlId) => { setHighlights((prev) => prev.filter((h) => h.id !== hlId)); }, []);
  const suppressReaderContextMenu = useCallback((e) => {
    if (e.target?.closest?.("[data-page-surface], .react-pdf__Page__textContent")) e.preventDefault();
  }, []);
  const selectionBelongsToReader = useCallback((sel) => {
    if (!sel || sel.rangeCount === 0) return false;
    return !!(getSelectionPageSurface(sel.anchorNode) && getSelectionPageSurface(sel.focusNode));
  }, []);

  useEffect(() => {
    const onMouseDown = () => { isSelectingRef.current = true; };
    const onMouseUp   = () => { setTimeout(() => { isSelectingRef.current = false; }, 200); handleTextSelection(); };
    const onTouchStart = () => { isSelectingRef.current = true; };
    const onTouchEnd   = () => { setTimeout(() => { isSelectingRef.current = false; }, 220); handleTextSelection(); };
    const onSelectionChange = () => {
      const sel = window.getSelection();
      if (!selectionBelongsToReader(sel)) return;
      handleTextSelection();
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mouseup",   onMouseUp);
    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchend", onTouchEnd, { passive: true });
    document.addEventListener("touchcancel", onTouchEnd, { passive: true });
    document.addEventListener("selectionchange", onSelectionChange);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchend", onTouchEnd);
      document.removeEventListener("touchcancel", onTouchEnd);
      document.removeEventListener("selectionchange", onSelectionChange);
      clearTimeout(selectionTimerRef.current);
    };
  }, [handleTextSelection, selectionBelongsToReader]);

  /* PAN */
  const onPointerDown = useCallback((e) => {
    if (!doublePage || !canPanZoom) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (e.target?.closest?.(".react-pdf__Page__textContent")) return;
    const v = doubleViewRef.current;
    if (!v) return;
    panRef.current = { active: true, didMove: false, startX: e.clientX, startY: e.clientY, sl: v.scrollLeft, st: v.scrollTop };
  }, [doublePage, canPanZoom]);

  const onPointerMove = useCallback((e) => {
    if (!panRef.current.active) return;
    const v = doubleViewRef.current; if (!v) return;
    const dx = e.clientX - panRef.current.startX, dy = e.clientY - panRef.current.startY;
    if (!panRef.current.didMove && Math.hypot(dx, dy) < 4) return;
    if (!panRef.current.didMove) { panRef.current.didMove = true; e.currentTarget.setPointerCapture?.(e.pointerId); setIsDragging(true); }
    v.scrollLeft = clamp(panRef.current.sl - dx, 0, Math.max(0, v.scrollWidth  - v.clientWidth));
    v.scrollTop  = clamp(panRef.current.st - dy, 0, Math.max(0, v.scrollHeight - v.clientHeight));
    e.preventDefault();
  }, []);

  const onPointerUp = useCallback((e) => {
    if (!panRef.current.active) return;
    if (panRef.current.didMove) e?.currentTarget?.releasePointerCapture?.(e.pointerId);
    panRef.current.active = false; panRef.current.didMove = false; setIsDragging(false);
  }, []);

  const handleDoubleTap = useCallback((clientX, clientY) => {
    if (!canPanZoom) return;
    const v = activeRef.current; if (!v) return;
    const panX = clientX < v.clientWidth  / 2 ? -v.clientWidth  * 0.85 : v.clientWidth  * 0.85;
    const panY = clientY < v.clientHeight / 2 ? -v.clientHeight * 0.85 : v.clientHeight * 0.85;
    v.scrollTo({ left: clamp(v.scrollLeft + panX, 0, Math.max(0, v.scrollWidth - v.clientWidth)), top: clamp(v.scrollTop + panY, 0, Math.max(0, v.scrollHeight - v.clientHeight)), behavior: "smooth" });
  }, [canPanZoom, activeRef]);

  const onTouchStartViewer = useCallback((e) => {
    if (e.touches.length !== 1) return;
    const { clientX, clientY } = e.touches[0];
    const now = Date.now(), dt = now - doubleTapRef.current.lastTime;
    const ddx = Math.abs(clientX - doubleTapRef.current.lastX), ddy = Math.abs(clientY - doubleTapRef.current.lastY);
    if (dt < 300 && ddx < 40 && ddy < 40) { handleDoubleTap(clientX, clientY); doubleTapRef.current.lastTime = 0; }
    else doubleTapRef.current = { lastTime: now, lastX: clientX, lastY: clientY };
  }, [handleDoubleTap]);

  const onDoubleClickViewer = useCallback((e) => {
    if (!canPanZoom || e.target?.closest?.(".react-pdf__Page__textContent")) return;
    handleDoubleTap(e.clientX, e.clientY);
  }, [canPanZoom, handleDoubleTap]);

  useEffect(() => {
    if (canPanZoom && doublePage) { setShowDragHint(true); clearTimeout(dragHintTimer.current); dragHintTimer.current = setTimeout(() => setShowDragHint(false), 4000); }
    else setShowDragHint(false);
    return () => clearTimeout(dragHintTimer.current);
  }, [canPanZoom, doublePage]);

  useEffect(() => {
    if (!doublePage) return;
    let cool = false;
    const onW = (e) => {
      e.stopPropagation();
      const v = doubleViewRef.current; if (!v) return;
      const canX = v.scrollWidth  > v.clientWidth  + 1, canY = v.scrollHeight > v.clientHeight + 1;
      const atT  = v.scrollTop <= 1, atB = v.scrollTop + v.clientHeight >= v.scrollHeight - 1;
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && canX) return;
      if (canY) { if (e.deltaY > 0 && !atB) return; if (e.deltaY < 0 && !atT) return; }
      e.preventDefault();
      if (cool || Math.abs(e.deltaY) < 30) return;
      cool = true; setTimeout(() => { cool = false; }, 600);
      e.deltaY > 0 ? goToNext() : goToPrev();
    };
    const el = doubleViewRef.current;
    if (el) { el.addEventListener("wheel", onW, { passive: false }); return () => el.removeEventListener("wheel", onW); }
  }, [doublePage, goToNext, goToPrev]);

  useEffect(() => {
    const onS = (e) => { touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; };
    const onE = (e) => {
      if (canPanZoom) { touchRef.current = null; return; }
      if (!touchRef.current) return;
      const dx = e.changedTouches[0].clientX - touchRef.current.x, dy = e.changedTouches[0].clientY - touchRef.current.y;
      if (Math.abs(dx) > 50 && Math.abs(dy) < 60) dx > 0 ? goToPrev() : goToNext();
      touchRef.current = null;
    };
    window.addEventListener("touchstart", onS, { passive: true });
    window.addEventListener("touchend",   onE, { passive: true });
    return () => { window.removeEventListener("touchstart", onS); window.removeEventListener("touchend", onE); };
  }, [canPanZoom, goToPrev, goToNext]);

  /* bookmarks */
  const toggleBookmark = useCallback(async () => {
    const exists  = bookmarks.some((b) => b.page === currentPage);
    const updated = exists ? bookmarks.filter((b) => b.page !== currentPage) : [...bookmarks, { page: currentPage, timestamp: Date.now() }];
    setBookmarks(updated); localStorage.setItem(bmsKey, JSON.stringify(updated));
    if (!token) return;
    try {
      if (!exists) await APIClient.post("/bookshelf", { bookId: id, status: "reading" });
      else if (updated.length === 0) await APIClient.delete(`/bookshelf/${id}`);
    } catch (err) { console.error(err); }
  }, [bookmarks, bmsKey, currentPage, id, token]);

  useEffect(() => {
    const onKey = (e) => {
      const inInput = ["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName);
      if (e.key === "Escape") {
        if (showGoTo)     { setShowGoTo(false); return; }
        if (searchOpen)   { setSearchOpen(false); clearSearch(); return; }
        if (focusMode)    { setFocusMode(false); return; }
        navigate(`/books/${id}`); return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "f") { e.preventDefault(); setSearchOpen(true); setTimeout(() => searchInputRef.current?.focus(), 30); return; }
      if ((e.ctrlKey || e.metaKey) && e.key === "b") { e.preventDefault(); toggleBookmark(); return; }
      if ((e.ctrlKey || e.metaKey) && e.key === "g") { e.preventDefault(); setShowGoTo(true); return; }
      if (!inInput) {
        const { canY } = getScrollState();
        const step = Math.max(120, Math.round((activeRef.current?.clientHeight || 0) * 0.85));
        if (e.key === "ArrowUp")    { if (scrollBy(0, -80))  { e.preventDefault(); return; } if (doublePage) goToPrev(); e.preventDefault(); return; }
        if (e.key === "ArrowDown")  { if (scrollBy(0,  80))  { e.preventDefault(); return; } if (doublePage) goToNext(); e.preventDefault(); return; }
        if (e.key === "ArrowLeft")  { if (scrollBy(-80, 0))  { e.preventDefault(); return; } goToPrev(); e.preventDefault(); return; }
        if (e.key === "ArrowRight") { if (scrollBy( 80, 0))  { e.preventDefault(); return; } goToNext(); e.preventDefault(); return; }
        if (e.key === "PageUp"   || (e.key === " " && e.shiftKey)) { if (canY && scrollBy(0, -step)) { e.preventDefault(); return; } goToPrev(); e.preventDefault(); return; }
        if (e.key === "PageDown" ||  e.key === " ")               { if (canY && scrollBy(0,  step)) { e.preventDefault(); return; } goToNext(); e.preventDefault(); return; }
        if (e.key === "f" || e.key === "F") { e.preventDefault(); setFocusMode((p) => !p); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showGoTo, searchOpen, focusMode, id, navigate, goToPrev, goToNext, getScrollState, scrollBy, doublePage, activeRef, toggleBookmark]);

  /* SEARCH */
  const runSearch = useCallback(async (query, isNewQuery = true) => {
    if (!query.trim() || !pdfDocRef.current) { setSearchResults([]); return; }
    setSearching(true);
    const q = query.toLowerCase(), results = [];
    for (let pn = 1; pn <= pdfDocRef.current.numPages; pn++) {
      try {
        const pg  = await pdfDocRef.current.getPage(pn);
        const ct  = await pg.getTextContent();
        const txt = ct.items.map((i) => i.str).join(""), lo = txt.toLowerCase();
        let s = 0;
        while (true) { const i = lo.indexOf(q, s); if (i === -1) break; results.push({ page: pn, snippet: txt.slice(Math.max(0, i - 30), i + q.length + 30), index: results.length }); s = i + q.length; }
      } catch { /**/ }
    }
    setSearchResults(results); setSearching(false);
    if (!results.length) return;
    if (isNewQuery) {
      let bestIdx = 0;
      const onCP = results.find((r, i) => { if (r.page === currentPage) { bestIdx = i; return true; } return false; });
      if (!onCP) { let bd = Infinity; results.forEach((r, i) => { const d = Math.abs(r.page - currentPage); if (d < bd) { bd = d; bestIdx = i; } }); }
      setSearchIdx(bestIdx); goToPage(results[bestIdx].page);
      setTimeout(() => { const m = containerRef.current?.querySelector(`mark.search-mark[data-idx="${bestIdx}"]`); if (m) m.scrollIntoView({ block: "center", behavior: "smooth" }); }, 300);
    }
  }, [goToPage, currentPage]);

  useEffect(() => { debSearchRef.current = debounce((q) => runSearch(q, true), 400); }, [runSearch]);

  const clearSearch = () => { setSearchQuery(""); setSearchResults([]); setSearchIdx(0); prevQueryRef.current = ""; };
  const handleSearchChange = (e) => {
    const v = e.target.value; setSearchQuery(v); prevQueryRef.current = v;
    if (!v.trim()) { setSearchResults([]); return; }
    debSearchRef.current?.(v);
  };
  const goToResult = useCallback((idx) => {
    if (!searchResults.length) return;
    const next = ((idx % searchResults.length) + searchResults.length) % searchResults.length;
    setSearchIdx(next); goToPage(searchResults[next].page);
    setTimeout(() => { const m = containerRef.current?.querySelector(`mark.search-mark[data-idx="${next}"]`); if (m) m.scrollIntoView({ block: "center", behavior: "smooth" }); }, doublePage ? 400 : 200);
  }, [searchResults, goToPage, doublePage]);

  useEffect(() => {
    const root = containerRef.current; if (!root) return;
    root.querySelectorAll("mark.search-mark").forEach((m) => { m.parentNode?.replaceChild(document.createTextNode(m.textContent), m); m.parentNode?.normalize(); });
    if (!searchQuery.trim()) return;
    const q = searchQuery.toLowerCase(); let gIdx = 0;
    root.querySelectorAll(".react-pdf__Page__textContent").forEach((layer) => {
      const walker = document.createTreeWalker(layer, NodeFilter.SHOW_TEXT);
      const nodes = []; let n;
      while ((n = walker.nextNode())) { if (n.textContent.trim()) nodes.push(n); }
      nodes.forEach((node) => {
        const orig = node.textContent;
        if (!orig.toLowerCase().includes(q)) return;
        const frag = document.createDocumentFragment(); let last = 0; let mi = orig.toLowerCase().indexOf(q);
        while (mi !== -1) {
          if (mi > last) frag.appendChild(document.createTextNode(orig.slice(last, mi)));
          const mark = document.createElement("mark"); mark.className = "search-mark"; mark.dataset.idx = String(gIdx++); mark.textContent = orig.slice(mi, mi + q.length); frag.appendChild(mark);
          last = mi + q.length; mi = orig.toLowerCase().indexOf(q, last);
        }
        if (last < orig.length) frag.appendChild(document.createTextNode(orig.slice(last)));
        node.parentNode?.replaceChild(frag, node);
      });
    });
    setTimeout(() => { const a = root.querySelector(`mark.search-mark[data-idx="${searchIdx}"]`); if (a) a.scrollIntoView({ block: "center", behavior: "smooth" }); }, 100);
  }, [currentPage, searchQuery, searchIdx, doublePage, renderPages]);

  const handleGoTo = useCallback(() => {
    const p = parseInt(goToInput, 10);
    if (Number.isFinite(p)) { goToPage(p); setShowGoTo(false); setGoToInput(""); }
  }, [goToInput, goToPage]);

  const fmtTime    = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const bgCls      = "bg-[#0d0d0d] text-white";
  const pageShadow = "0 4px 40px rgba(0,0,0,0.7)";
  const hlBlend    = "screen";

  /* Highlight overlay — one merged rect per line, zIndex above text layer */
  const HighlightLayer = ({ pageNum }) => {
    const ph = highlights.filter((h) => h.page === pageNum);
    const preview = hlToolbar?.page === pageNum
      ? [{ id: "selection-preview", rects: hlToolbar.rects, colorIdx: activeColorIdx, preview: true }]
      : [];
    const overlayItems = [...ph, ...preview];
    if (!overlayItems.length) return null;
    return (
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 10, overflow: "hidden" }}>
        {overlayItems.map((hl) => {
          const c = HIGHLIGHT_COLORS[hl.colorIdx ?? 0];
          const previewBg = c.bg.replace(/0\.\d+\)/, "0.72)");
          return hl.rects.map((r, ri) => (
            <div key={`${hl.id}-${ri}`}
              style={{
                position: "absolute",
                left: `${r.left}%`, top: `${r.top}%`,
                width: `${r.width}%`, height: `${r.height}%`,
                background: hl.preview ? previewBg : c.bg,
                borderBottom: `2.5px solid ${c.border}`,
                borderRadius: 2, mixBlendMode: hlBlend,
                boxShadow: hl.preview ? `0 0 0 1px ${c.border} inset` : "none",
                pointerEvents: hl.preview ? "none" : "auto",
                cursor: hl.preview ? "default" : "pointer",
              }}
              title="Click to remove highlight"
              onClick={hl.preview ? undefined : () => removeHighlight(hl.id)}
            />
          ));
        })}
      </div>
    );
  };

  /* Right highlight sidebar */
  const HlSidebar = () => {
    const colorCounts = HIGHLIGHT_COLORS.map((_, ci) => highlights.filter((h) => h.colorIdx === ci).length);
    return (
      <aside style={{ width: 260 }} className="shrink-0 border-l border-white/10 bg-[#0a0a0a] flex flex-col z-30 h-full select-none">
        <div className="flex items-center justify-between px-3.5 py-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-4 rounded-full bg-gradient-to-b from-amber-400 to-pink-500" />
            <span className="text-[11px] font-bold text-white/60 uppercase tracking-widest">Highlights</span>
            {highlights.length > 0 && <span className="rounded-full bg-white/10 border border-white/15 text-white/70 text-[10px] font-bold min-w-[20px] h-5 px-1.5 flex items-center justify-center">{highlights.length}</span>}
          </div>
          <div className="flex items-center gap-0.5">
            {highlights.length > 0 && (
              <button type="button" onClick={() => { if (window.confirm("Remove all highlights?")) setHighlights([]); }}
                className="p-1.5 rounded-lg text-white/25 hover:text-red-400 hover:bg-red-400/10 transition"><FiTrash2 className="w-3.5 h-3.5" /></button>
            )}
            <button type="button" onClick={() => setHlSidebarOpen(false)} className="p-1.5 rounded-lg text-white/25 hover:text-white hover:bg-white/10 transition"><FiX className="w-3.5 h-3.5" /></button>
          </div>
        </div>

        {highlights.length > 0 && (
          <div className="px-3 py-2.5 border-b border-white/8 flex flex-wrap gap-1.5">
            <button type="button" onClick={() => setHlFilter("all")}
              className={`px-2.5 h-6 rounded-full text-[10px] font-semibold border transition-all ${hlFilter === "all" ? "bg-white/15 border-white/30 text-white" : "border-white/10 text-white/35 hover:text-white/60 hover:border-white/20"}`}>
              All · {highlights.length}
            </button>
            {HIGHLIGHT_COLORS.map((c, ci) => colorCounts[ci] > 0 && (
              <button key={ci} type="button" onClick={() => setHlFilter(hlFilter === ci ? "all" : ci)}
                className="flex items-center gap-1 px-2 h-6 rounded-full text-[10px] font-semibold border transition-all"
                style={{ borderColor: hlFilter === ci ? c.solid : "rgba(255,255,255,0.1)", background: hlFilter === ci ? c.solid + "22" : "transparent", color: hlFilter === ci ? c.solid : "rgba(255,255,255,0.38)" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.solid, display: "inline-block" }} />{colorCounts[ci]}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto scrollbar-none">
          {filteredHighlights.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 px-5 text-center pb-8">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center text-xl">✏️</div>
              <div>
                <p className="text-xs font-semibold text-white/40 mb-1">No highlights yet</p>
                <p className="text-[11px] text-white/20 leading-relaxed">Select any text on the page to highlight it</p>
              </div>
            </div>
          ) : (
            <div className="p-2.5 space-y-1.5">
              {filteredHighlights.map((hl) => {
                const c = HIGHLIGHT_COLORS[hl.colorIdx ?? 0];
                const isVisible = renderPages.includes(hl.page) || currentPage === hl.page;
                return (
                  <div key={hl.id}
                    className="group relative rounded-xl overflow-hidden border cursor-pointer transition-all duration-150"
                    style={{ borderColor: isVisible ? c.solid + "55" : "rgba(255,255,255,0.07)", background: isVisible ? c.solid + "0c" : "rgba(255,255,255,0.03)" }}
                    onClick={() => goToPage(hl.page)}>
                    <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: c.solid, opacity: isVisible ? 1 : 0.4 }} />
                    <div className="pl-4 pr-2.5 pt-2.5 pb-2">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center justify-center rounded-md text-[9px] font-black min-w-[20px] h-[18px] px-1.5 tabular-nums"
                            style={{ background: c.solid + "30", color: c.solid, border: `1px solid ${c.solid}45` }}>#{hl.num}</span>
                          <span className="text-[10px] text-white/35 font-medium">page {hl.page}</span>
                        </div>
                        <button type="button" onClick={(e) => { e.stopPropagation(); removeHighlight(hl.id); }}
                          className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-white/25 hover:text-red-400 transition"><FiX className="w-3 h-3" /></button>
                      </div>
                      <p className="text-[11px] leading-relaxed line-clamp-3 italic"
                        style={{ color: "rgba(255,255,255,0.65)", paddingLeft: 6, borderLeft: `2px solid ${c.solid}40` }}>"{hl.text}"</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {highlights.length > 0 && (
          <div className="border-t border-white/8 px-3.5 py-2.5 flex items-center justify-between">
            <div className="flex gap-1.5">
              {HIGHLIGHT_COLORS.map((c, ci) => colorCounts[ci] > 0 && (
                <div key={ci} className="flex items-center gap-0.5" title={c.name}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: c.solid }} />
                  <span className="text-[9px] text-white/30">{colorCounts[ci]}</span>
                </div>
              ))}
            </div>
            <span className="text-[10px] text-white/25">{highlights.length} total</span>
          </div>
        )}
      </aside>
    );
  };

  /* ════════════════════════════════════ RENDER ════════════════════════════════════ */
  return (
    <div className={`relative w-full h-screen flex flex-col overflow-hidden ${bgCls}`}
      style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <style>{`
        .react-pdf__Page__textContent {
          position: absolute !important; inset: 0 !important;
          overflow: hidden !important; line-height: 1 !important;
          text-size-adjust: none !important; z-index: 2 !important;
          -webkit-touch-callout: none !important;
        }
        .react-pdf__Page__textContent span {
          position: absolute !important; white-space: pre !important;
          transform-origin: 0% 0% !important; cursor: text !important;
          user-select: text !important; -webkit-user-select: text !important;
          color: transparent !important;
          -webkit-user-drag: none !important;
          -webkit-touch-callout: none !important;
        }
        [data-page-surface] {
          -webkit-touch-callout: none !important;
          -webkit-tap-highlight-color: transparent !important;
        }
        .react-pdf__Page__textContent span::selection {
          background: rgba(99,102,241,0.35) !important;
          color: rgba(15,23,42,0.95) !important;
          -webkit-text-fill-color: rgba(15,23,42,0.95) !important;
        }
        .react-pdf__Page__textContent span::-moz-selection {
          background: rgba(99,102,241,0.35) !important;
          color: rgba(15,23,42,0.95) !important;
        }

        .react-pdf__Page__canvas { display: block !important; user-select: none !important; pointer-events: none !important; position: relative; z-index: 1 !important; }

        mark.search-mark {
          background: rgba(251,191,36,0.65) !important; color: #111 !important;
          border-radius: 2px; padding: 0 1px; outline: 1.5px solid rgba(251,191,36,0.5);
          transition: all 0.2s ease; position: relative; z-index: 3;
        }
        mark.search-mark[data-idx="${searchIdx}"] {
          background: rgba(249,115,22,0.90) !important; color: #fff !important;
          outline: 2px solid rgba(249,115,22,1) !important; border-radius: 3px;
          box-shadow: 0 0 0 3px rgba(249,115,22,0.3), 0 2px 10px rgba(249,115,22,0.4) !important;
          z-index: 4; position: relative;
        }
        ::selection { background: rgba(99,102,241,0.35); color: rgba(15,23,42,0.95); }
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
        .hl-swatch { border-radius: 50%; transition: transform 0.12s, box-shadow 0.12s, outline 0.1s; }
        .hl-swatch:hover { transform: scale(1.2); box-shadow: 0 3px 12px rgba(0,0,0,0.55); }
        .hl-swatch.picked { outline: 2.5px solid white; outline-offset: 2px; transform: scale(1.15); }
      `}</style>

      {/* HIGHLIGHT TOOLBAR */}
      {hlToolbar && (
        <div ref={hlToolbarRef}
          style={{ position: "fixed", top: hlToolbar.top, left: hlToolbar.left, zIndex: 9999, display: "flex", alignItems: "center", gap: 8, background: "rgba(12,12,12,0.97)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, padding: "8px 14px", boxShadow: "0 12px 40px rgba(0,0,0,0.65), 0 2px 8px rgba(0,0,0,0.4)", backdropFilter: "blur(18px)" }}>
          <div style={hlToolbar.placeBelow
            ? { position: "absolute", top: -7, left: "50%", transform: "translateX(-50%)", width: 0, height: 0, borderLeft: "7px solid transparent", borderRight: "7px solid transparent", borderBottom: "7px solid rgba(12,12,12,0.97)" }
            : { position: "absolute", bottom: -7, left: "50%", transform: "translateX(-50%)", width: 0, height: 0, borderLeft: "7px solid transparent", borderRight: "7px solid transparent", borderTop: "7px solid rgba(12,12,12,0.97)" }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", userSelect: "none" }}>Highlight</span>
          <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
            {HIGHLIGHT_COLORS.map((c, ci) => (
              <button key={ci} type="button" title={c.name} className={`hl-swatch ${activeColorIdx === ci ? "picked" : ""}`} onClick={() => confirmHighlight(ci)}
                style={{ width: 21, height: 21, background: c.solid, border: "2px solid rgba(255,255,255,0.2)", cursor: "pointer", outline: "none", padding: 0, display: "block" }} />
            ))}
          </div>
          <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.1)" }} />
          <button type="button" onClick={() => { setHlToolbar(null); window.getSelection()?.removeAllRanges(); }}
            style={{ color: "rgba(255,255,255,0.3)", fontSize: 14, cursor: "pointer", background: "none", border: "none", padding: "0 1px", lineHeight: 1, display: "flex", alignItems: "center" }}>✕</button>
        </div>
      )}

      {/* Go-to */}
      {showGoTo && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm" onClick={() => setShowGoTo(false)}>
          <div className="w-full max-w-xs rounded-2xl bg-[#111] border border-white/12 p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-white font-bold mb-4">Go to Page</h2>
            <div className="flex gap-2">
              <input type="number" min="1" max={numPages||1} value={goToInput} onChange={(e) => setGoToInput(e.target.value)}
                onKeyDown={(e) => e.key==="Enter"&&handleGoTo()} placeholder={`1 – ${numPages||"?"}`} autoFocus
                className="flex-1 px-4 py-2 rounded-xl bg-white/10 border border-white/15 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
              <button type="button" onClick={handleGoTo} className="px-4 py-2 rounded-xl bg-white text-black font-semibold text-sm hover:bg-white/90 transition">Go</button>
            </div>
          </div>
        </div>
      )}

      {/* TOP BAR */}
      {!focusMode && (
        <header className="shrink-0 z-40 border-b border-white/8 bg-black/88 backdrop-blur-md px-3 sm:px-5 py-2.5">
          {!searchOpen ? (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <button type="button" onClick={() => navigate(`/books/${id}`)} className={topBtn()} title="Back (Esc)"><FiArrowLeft /></button>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white leading-tight">{bookTitle}</p>
                  <p className="text-[11px] text-white/45 leading-tight">Page {currentPage} of {numPages ?? "…"}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button type="button" onClick={toggleBookmark} className={topBtn(isBookmarked)} title="Bookmark (Ctrl+B)"><FiBookmark /></button>
                <button type="button" onClick={() => { setSearchOpen(true); setTimeout(() => searchInputRef.current?.focus(), 30); }} className={topBtn(false)} title="Search (Ctrl+F)"><FiSearch /></button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 h-9">
              <div className="relative flex-1">
                <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm" />
                <input ref={searchInputRef} value={searchQuery} onChange={handleSearchChange}
                  onKeyDown={(e) => { if(e.key==="Enter") e.shiftKey?goToResult(searchIdx-1):goToResult(searchIdx+1); if(e.key==="Escape"){setSearchOpen(false);clearSearch();} }}
                  placeholder="Search in book…"
                  className="w-full h-9 pl-9 pr-3 rounded-full border border-white/15 bg-white/8 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-400/60 focus:bg-white/10 transition" />
              </div>
              {searchQuery.trim() && <span className="text-[11px] text-white/45 shrink-0 tabular-nums">{searching ? "…" : searchResults.length ? `${searchIdx+1}/${searchResults.length}` : "0"}</span>}
              <button type="button" onClick={() => goToResult(searchIdx-1)} disabled={!searchResults.length} className="p-1.5 text-white/60 hover:text-white disabled:opacity-25 transition shrink-0"><FiChevronLeft className="w-4 h-4" /></button>
              <button type="button" onClick={() => goToResult(searchIdx+1)} disabled={!searchResults.length} className="p-1.5 text-white/60 hover:text-white disabled:opacity-25 transition shrink-0"><FiChevronRight className="w-4 h-4" /></button>
              <button type="button" onClick={() => { setSearchOpen(false); clearSearch(); }} className="p-1.5 rounded-full border border-white/15 text-white/60 hover:text-white hover:bg-white/10 transition shrink-0"><FiX className="w-4 h-4" /></button>
            </div>
          )}
          <div className="w-full h-[3px] rounded-full bg-white/10 overflow-hidden mt-2">
            <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </header>
      )}

      {/* BODY */}
      <div ref={containerRef} className="relative flex-1 overflow-hidden flex min-h-0">
        {sidebarOpen && (
          <aside className="shrink-0 w-36 border-r border-white/10 bg-black/90 backdrop-blur-sm flex flex-col z-30">
            <div className="flex items-center justify-between px-2.5 py-2 border-b border-white/10">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Pages</span>
              <button type="button" onClick={() => setSidebarOpen(false)} className="p-1 rounded text-white/40 hover:text-white hover:bg-white/10 transition"><FiX className="text-xs" /></button>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-none px-2 py-2"
              onScroll={(e) => { const el=e.currentTarget; if(numPages&&thumbLoaded<numPages&&el.scrollTop+el.clientHeight>=el.scrollHeight-180) setThumbLoaded((p)=>Math.min(p+20,numPages)); }}>
              {sortedBookmarks.length > 0 && (
                <div className="mb-3">
                  <div className="px-1 pb-2 text-[10px] font-bold uppercase tracking-widest text-white/45">Bookmarks</div>
                  <div className="space-y-1.5">
                    {sortedBookmarks.map((bm) => (
                      <button key={`bm-${bm.page}`} type="button" onClick={() => goToPage(bm.page)}
                        className={["flex w-full items-center justify-between rounded-lg border px-2.5 py-2 text-left text-xs transition",
                          currentPage===bm.page||(doublePage&&leftPage===bm.page)?"border-amber-400 bg-amber-400/10 text-white":"border-white/10 bg-white/5 text-white/75 hover:border-white/25 hover:bg-white/10 hover:text-white"].join(" ")}>
                        <span className="font-semibold">p.{bm.page}</span>
                        <span className="text-[9px] text-white/45">{bm.timestamp?new Date(bm.timestamp).toLocaleDateString():"–"}</span>
                      </button>
                    ))}
                  </div>
                  <div className="my-3 h-px bg-white/10" />
                </div>
              )}
              <div className="px-1 pb-2 text-[10px] font-bold uppercase tracking-widest text-white/45">Pages</div>
              <Document file={file} options={options} loading={null} error={null}>
                {numPages && Array.from({ length: Math.min(numPages, thumbLoaded) }, (_, i) => i+1).map((num) => (
                  <button key={num} type="button" onClick={() => { goToPage(num); setSidebarOpen(false); }}
                    className={["mb-2 block w-full rounded-lg border overflow-hidden transition-all", currentPage===num||(doublePage&&leftPage===num)?"border-indigo-400 ring-1 ring-indigo-400/40":"border-white/10 hover:border-white/30"].join(" ")}>
                    <div className="relative">
                      <span className="absolute left-1.5 top-1.5 z-10 text-[9px] font-bold bg-black/70 text-white px-1.5 py-0.5 rounded">{num}</span>
                      <Page pageNumber={num} width={THUMB_W} renderTextLayer={false} renderAnnotationLayer={false}
                        loading={<div className="bg-neutral-700 animate-pulse" style={{ width: THUMB_W, height: Math.round(THUMB_W/pdfAsp) }} />} />
                    </div>
                  </button>
                ))}
              </Document>
            </div>
          </aside>
        )}

        <div className="relative flex-1 min-w-0 overflow-hidden">
          {!accessChecked ? (
            <div className="flex h-full items-center justify-center px-6">
              <div className="text-center">
                <div className="mx-auto h-12 w-12 rounded-full border-[3px] border-white/20 border-t-white animate-spin mb-4" />
                <p className="text-sm font-medium text-white/60">Preparing reader...</p>
              </div>
            </div>
          ) : (
            <>
          {doublePage && (
            <>
              <button type="button" onClick={goToPrev} disabled={!canGoPrev} aria-label="Previous"
                className="absolute left-0 inset-y-0 z-30 w-14 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity disabled:pointer-events-none group"
                style={{ pointerEvents: isDragging ? "none" : undefined }}>
                <span className="bg-black/60 backdrop-blur-sm rounded-full p-2.5 text-white/90 group-hover:bg-black/80 transition shadow-xl"><FiChevronLeft className="w-5 h-5" /></span>
              </button>
              <button type="button" onClick={goToNext} disabled={!canGoNext} aria-label="Next"
                className="absolute right-0 inset-y-0 z-30 w-14 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity disabled:pointer-events-none group"
                style={{ pointerEvents: isDragging ? "none" : undefined }}>
                <span className="bg-black/60 backdrop-blur-sm rounded-full p-2.5 text-white/90 group-hover:bg-black/80 transition shadow-xl"><FiChevronRight className="w-5 h-5" /></span>
              </button>
            </>
          )}
          {showDragHint && (
            <div className="pointer-events-none absolute left-1/2 bottom-5 z-40 -translate-x-1/2 rounded-full bg-black/75 px-4 py-2 text-[11px] font-medium text-white/90 shadow-lg backdrop-blur-sm">
              Drag to pan · double-tap quadrant to jump
            </div>
          )}
          {bookError ? (
            <div className="flex h-full items-center justify-center px-6">
              <div className="rounded-2xl bg-white/6 px-8 py-10 text-center max-w-sm">
                <p className="font-semibold mb-4">{bookError}</p>
                <button type="button" onClick={() => navigate(`/books/${id}`)} className="rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-black hover:bg-white/90 transition">Back</button>
              </div>
            </div>
          ) : (
            <>
              {!doublePage && (
                <div ref={singleViewRef} className="absolute inset-0 scrollbar-none overflow-y-auto overflow-x-hidden" onContextMenuCapture={suppressReaderContextMenu} style={{ touchAction: "auto" }}>
                  <Document file={file} options={options} onLoadSuccess={onLoadSuccess} onLoadError={onLoadError}
                    loading={<div className="flex items-center justify-center" style={{ height: vpH }}><div className="text-center"><div className="mx-auto h-12 w-12 rounded-full border-[3px] border-white/20 border-t-white animate-spin mb-4" /><p className="text-sm font-medium text-white/60">Loading…</p></div></div>}>
                    {numPages && (
                      <div style={{ paddingTop: V_PAD, paddingBottom: V_PAD }}>
                        {Array.from({ length: numPages }, (_, i) => i+1).map((num) => (
                          <div key={num} className="flex justify-center" style={{ marginBottom: num < numPages ? PAGE_GAP : 0 }}>
                            <div data-page={num} data-page-surface className="relative overflow-hidden rounded-sm"
                              style={{ lineHeight: 0, fontSize: 0, backgroundColor: "#fff", boxShadow: pageShadow, userSelect: "text", WebkitUserSelect: "text" }}>
                              <Page pageNumber={num} width={Math.round(singlePageW * scale)} renderTextLayer renderAnnotationLayer={false}
                                loading={<div className="animate-pulse bg-neutral-200" style={{ width: Math.round(singlePageW*scale), height: Math.round(Math.round(singlePageW*scale)/pdfAsp) }} />} />
                              <HighlightLayer pageNum={num} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Document>
                </div>
              )}
              {doublePage && (
                <div ref={doubleViewRef}
                  className={["absolute inset-0 scrollbar-none overflow-auto", canPanZoom?(isDragging?"cursor-grabbing":"cursor-grab"):"cursor-default"].join(" ")}
                  onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}
                  onDoubleClick={onDoubleClickViewer} onTouchStart={onTouchStartViewer} onContextMenuCapture={suppressReaderContextMenu}
                  style={{ touchAction: canPanZoom ? "none" : "auto" }}>
                  <Document file={file} options={options} onLoadSuccess={onLoadSuccess} onLoadError={onLoadError}
                    loading={<div className="absolute inset-0 flex items-center justify-center"><div className="text-center"><div className="mx-auto h-12 w-12 rounded-full border-[3px] border-white/20 border-t-white animate-spin mb-4" /><p className="text-sm font-medium text-white/60">Loading…</p></div></div>}>
                    <div style={{ width: dblContentW, height: dblContentH, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div style={{ position: "relative", width: frameW, height: frameH, flexShrink: 0 }}>
                        {prevRenderPages && (
                          <div style={{ position: "absolute", inset: 0, display: "flex", gap: GUTTER, zIndex: 1, pointerEvents: "none" }}>
                            {prevRenderPages.map((num) => (
                              <div key={`prev-${num}`} style={{ width: scaledPageW, height: scaledPageH, lineHeight: 0, fontSize: 0, flexShrink: 0, backgroundColor: "#fff", boxShadow: pageShadow, overflow: "hidden", borderRadius: 2 }}>
                                <Page key={`prev-${num}-${scaledPageW}`} pageNumber={num} width={scaledPageW} renderTextLayer={false} renderAnnotationLayer={false} loading={<div style={{ width: scaledPageW, height: scaledPageH }} />} />
                              </div>
                            ))}
                          </div>
                        )}
                        <div style={{ position: "absolute", inset: 0, display: "flex", gap: GUTTER, zIndex: 2, opacity: prevRenderPages?(fadeIn?1:0):1, transition: prevRenderPages?`opacity ${FADE_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`:"none" }}>
                          {renderPages.map((num) => (
                            <div key={num} data-page={num} data-page-surface
                              style={{ position: "relative", width: scaledPageW, height: scaledPageH, lineHeight: 0, fontSize: 0, flexShrink: 0, backgroundColor: "#fff", boxShadow: pageShadow, overflow: "hidden", borderRadius: 2, userSelect: "text", WebkitUserSelect: "text" }}>
                              <Page key={`page-${num}-${scaledPageW}-${scaledPageH}`} pageNumber={num} width={scaledPageW}
                                renderTextLayer renderAnnotationLayer={false}
                                onRenderSuccess={() => { if(activeKeyRef.current!==activeRenderKey)return; setReadyPages((p)=>p[num]?p:{...p,[num]:true}); }}
                                loading={<div className="animate-pulse bg-neutral-200" style={{ width: scaledPageW, height: scaledPageH }} />} />
                              <HighlightLayer pageNum={num} />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Document>
                </div>
              )}
            </>
          )}
            </>
          )}
        </div>
        {hlSidebarOpen && <HlSidebar />}
      </div>

      {/* BOTTOM DOCK */}
      <footer className="shrink-0 z-40 border-t border-white/8 bg-black/88 backdrop-blur-md px-2 sm:px-4 pt-1.5 pb-2">
        <div className="flex items-center justify-between text-[11px] text-white/40 mb-1.5 px-1">
          <span className="flex items-center gap-2">
            <FiClock className="w-3 h-3" />{fmtTime(elapsed)}
            <span className="hidden sm:inline">· {bookmarks.length} bookmark{bookmarks.length!==1?"s":""}</span>
          </span>
          <button type="button" onClick={() => setShowGoTo(true)} className="hover:text-white transition px-2 py-0.5 rounded hover:bg-white/8" title="Go to page (Ctrl+G)">
            {currentPage} / {numPages ?? "…"}
          </button>
        </div>
        <div className="flex items-center justify-center gap-0.5 sm:gap-1 flex-wrap">
          {doublePage && (
            <>
              <button type="button" onClick={goToPrev} disabled={!canGoPrev} className={`${dockBtn()} disabled:opacity-30 disabled:cursor-not-allowed`} title="Previous"><FiChevronLeft /></button>
              <button type="button" onClick={goToNext} disabled={!canGoNext} className={`${dockBtn()} disabled:opacity-30 disabled:cursor-not-allowed`} title="Next"><FiChevronRight /></button>
              <div className="h-6 w-px bg-white/12 mx-0.5" />
            </>
          )}
          <button type="button" onClick={() => setScale((s) => +(Math.max(MIN_SCALE, s - 0.15).toFixed(2)))} disabled={scale<=MIN_SCALE} className={`${dockBtn()} disabled:opacity-30 disabled:cursor-not-allowed`} title="Zoom out"><FiMinus /></button>
          <button type="button" onClick={() => setScale(1)} className="text-[11px] text-white/55 hover:text-white min-w-[42px] text-center transition tabular-nums" title="Reset zoom">{Math.round(scale * 100)}%</button>
          <button type="button" onClick={() => setScale((s) => +(Math.min(MAX_SCALE, s + 0.15).toFixed(2)))} disabled={scale>=MAX_SCALE} className={`${dockBtn()} disabled:opacity-30 disabled:cursor-not-allowed`} title="Zoom in"><FiPlus /></button>
          <button type="button" onClick={() => setScale(1)} className={dockBtn()} title="Reset zoom"><FiRotateCcw /></button>
          <div className="h-6 w-px bg-white/12 mx-0.5" />
          <button type="button" onClick={() => setSidebarOpen((p) => !p)} className={dockBtn(sidebarOpen)} title="Page thumbnails"><FiGrid /></button>
          <button type="button" onClick={switchToSingle} className={dockBtn(!doublePage)} title="Single page"><FiFileText /></button>
          <button type="button" onClick={switchToDouble} className={dockBtn(doublePage)}  title="Double page"><FiColumns /></button>
          <div className="h-6 w-px bg-white/12 mx-0.5" />
          <button type="button" onClick={() => setHlSidebarOpen((p) => !p)} className={`${dockBtn(hlSidebarOpen)} relative`} title="Highlight panel">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 12.5L5.5 9 3 6.5l5-5 6.5 6.5-5 5-2.5-2.5-3.5 3.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
              <path d="M1 15h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            {highlights.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center rounded-full bg-amber-400 text-black text-[8px] font-black min-w-[15px] h-[15px] px-0.5 leading-none shadow-md">
                {highlights.length > 99 ? "99+" : highlights.length}
              </span>
            )}
          </button>
          <div className="h-6 w-px bg-white/12 mx-0.5" />
          <button type="button" onClick={() => setFocusMode((p) => !p)} className={dockBtn(focusMode)} title={focusMode?"Exit focus mode":"Focus mode"}>
            {focusMode ? <RiFocusMode /> : <FiMaximize2 />}
          </button>
        </div>
      </footer>
    </div>
  );
}
