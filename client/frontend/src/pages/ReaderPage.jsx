import React, {
  useState, useRef, useEffect, useCallback, useMemo, memo,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Document, Page, pdfjs } from "react-pdf";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

const BATCH        = 5;
const LOAD_TRIGGER = 3;
const API          = "http://localhost:3000/api";
const PAGE_W       = 750;


// ─── Utilities ────────────────────────────────────────────────────────────────

function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

// customTextRenderer for react-pdf — simple pass-through
// We'll handle highlighting separately via DOM manipulation in useEffect
function makeTextRenderer() {
  return function ({ str }) {
    return str;  // Return original string as-is
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

// NOT memo'd — re-renders when customTextRenderer or scale changes.
// The key on <Page> forces react-pdf to fully remount the page
// when searchQuery changes, so customTextRenderer is called fresh.
function PDFPage({ num, scale, setRef, customTextRenderer }) {
  const w = Math.round(PAGE_W * scale);
  return (
    <div
      ref={(el) => setRef(el, num)}
      data-page={num}
      className="shadow-2xl shadow-black/60 rounded ring-1 ring-gray-800"
      style={{ position: "relative", lineHeight: 0, fontSize: 0 }}
    >
      <Page
        key={num}
        pageNumber={num}
        width={w}
        renderTextLayer={true}
        renderAnnotationLayer={false}
        customTextRenderer={customTextRenderer}
        loading={
          <div
            className="bg-gray-800 animate-pulse rounded"
            style={{ width: w, aspectRatio: "1 / 1.414" }}
          />
        }
      />
    </div>
  );
}

// Memo'd — thumbnails don't need search updates.
const LazyThumb = memo(({ num, file, options, isActive, onClick, thumbRef }) => {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <button
      ref={(el) => { ref.current = el; if (thumbRef) thumbRef(el); }}
      onClick={onClick}
      className="flex flex-col items-center gap-1 w-full px-2"
    >
      <div className={`w-full rounded overflow-hidden border-2 transition-colors
        ${isActive ? "border-blue-500" : "border-transparent"}`}>
        {visible ? (
          <Document file={file} options={options} loading={null} error={null}>
            <Page
              pageNumber={num}
              width={96}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              loading={<div className="w-24 h-32 bg-gray-800 animate-pulse rounded" />}
            />
          </Document>
        ) : (
          <div className="w-24 h-32 bg-gray-800 rounded" />
        )}
      </div>
      <span className={`text-xs tabular-nums ${isActive ? "text-blue-400 font-semibold" : "text-gray-500"}`}>
        {num}
      </span>
    </button>
  );
});

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ReaderPage() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const scrollRef      = useRef(null);
  const containerRef   = useRef(null);
  const pdfDocRef      = useRef(null);
  const pageRefs       = useRef({});
  const thumbRefs      = useRef({});
  const searchInputRef = useRef(null);
  const debouncedRef   = useRef(null);

  const [numPages,      setNumPages]      = useState(null);
  const [loaded,        setLoaded]        = useState(BATCH);
  const [scale,         setScale]         = useState(1.0);
  const [currentPage,   setCurrentPage]   = useState(1);
  const [isFullscreen,  setIsFullscreen]  = useState(false);
  const [jumpInput,     setJumpInput]     = useState("");
  const [darkMode,      setDarkMode]      = useState(false);
  const [sidebar,       setSidebar]       = useState(false);
  const [searchOpen,    setSearchOpen]    = useState(false);
  const [searchQuery,   setSearchQuery]   = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchCurrent, setSearchCurrent] = useState(0);
  const [searching,     setSearching]     = useState(false);
  const [textLayerReady, setTextLayerReady] = useState(false);
  const [bookError,     setBookError]     = useState(null);

  const token    = localStorage.getItem("token");
  const PROGRESS_KEY = `reader-progress-${id}`;                          // ── ADDED
  const progress = numPages ? Math.round((currentPage / numPages) * 100) : 0;

  const file = useMemo(() => ({
    url: `${API}/books/${id}/read`,
    httpHeaders: { Authorization: `Bearer ${token}` },
  }), [id, token]);

  const options = useMemo(() => ({
    cMapUrl: "https://unpkg.com/pdfjs-dist/cmaps/",
    cMapPacked: true,
    standardFontDataUrl: "https://unpkg.com/pdfjs-dist/standard_fonts/",
  }), []);

  // ─── Scroll to page ──────────────────────────────────────────────────────────

  const scrollToPage = useCallback((page) => {
    const el = pageRefs.current[page];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    } else if (page <= (numPages ?? 0)) {
      setLoaded(Math.min(Math.ceil(page / BATCH) * BATCH, numPages));
      setTimeout(() => pageRefs.current[page]?.scrollIntoView({ behavior: "smooth" }), 500);
    }
  }, [numPages]);


  // ─── Fullscreen listener ──────────────────────────────────────────────────────

  useEffect(() => {
    const h = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", h);
    return () => document.removeEventListener("fullscreenchange", h);
  }, []);

  // ─── PDF load success ─────────────────────────────────────────────────────────

  const onLoadSuccess = useCallback((pdf) => {
    pdfDocRef.current = pdf;
    setNumPages(pdf.numPages);
    setBookError(null);

    // ── ADDED: restore saved position ────────────────────────────────────────
    const saved = parseInt(localStorage.getItem(PROGRESS_KEY), 10);
    if (saved && saved > 1 && saved <= pdf.numPages) {
      setLoaded(Math.min(Math.ceil(saved / BATCH) * BATCH + BATCH, pdf.numPages));
      setTimeout(() => pageRefs.current[saved]?.scrollIntoView({ behavior: "auto", block: "start" }), 600);
    } else {
      setLoaded(Math.min(BATCH, pdf.numPages));
    }
    // ─────────────────────────────────────────────────────────────────────────
  }, [PROGRESS_KEY]);

  // ─── PDF load error ───────────────────────────────────────────────────────────

  const onLoadError = useCallback((error) => {
    console.error("PDF load error:", error);
    setBookError("The PDF file for this book is not available. Please check with the administrator.");
  }, []);

  // ─── Intersection observer (page tracking + lazy load) ────────────────────────

  useEffect(() => {
    if (!numPages || !scrollRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const top = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!top) return;
        const page = parseInt(top.target.dataset.page, 10);
        setCurrentPage(page);
        thumbRefs.current[page]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
        if (page >= loaded - LOAD_TRIGGER && loaded < numPages) {
          setLoaded((prev) => Math.min(prev + BATCH, numPages));
        }
      },
      { root: scrollRef.current, threshold: 0.4 }
    );
    Object.values(pageRefs.current).forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [numPages, loaded]);

  useEffect(() => {
    if (!numPages || currentPage < 1) return;
    localStorage.setItem(PROGRESS_KEY, String(currentPage));
  }, [PROGRESS_KEY, currentPage, numPages]);

  const setRef = useCallback((el, num) => {
    if (el) pageRefs.current[num] = el;
  }, []);

  // ─── Fullscreen toggle ────────────────────────────────────────────────────────

  const toggleFullscreen = useCallback(() =>
    document.fullscreenElement
      ? document.exitFullscreen()
      : containerRef.current?.requestFullscreen()
  , []);

  // ─── Jump to page ─────────────────────────────────────────────────────────────

  const handleJump = (e) => {
    e.preventDefault();
    const page = parseInt(jumpInput, 10);
    if (page >= 1 && page <= numPages) scrollToPage(page);
    setJumpInput("");
  };

  // ─── Search open / close ──────────────────────────────────────────────────────

  const openSearch = useCallback(() => {
    setSearchOpen(true);
    setTimeout(() => searchInputRef.current?.focus(), 50);
  }, []);

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
    setSearchCurrent(0);
  }, []);

  useEffect(() => {
    const h = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        setSearchOpen((v) => {
          if (!v) setTimeout(() => searchInputRef.current?.focus(), 50);
          return !v;
        });
      }
      if (e.key === "Escape") closeSearch();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [closeSearch]);

  // ─── Core PDF text search ─────────────────────────────────────────────────────

  const runSearch = useCallback(async (query) => {
    if (!query.trim() || !pdfDocRef.current) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    const results = [];
    const q       = query.toLowerCase();
    const total   = pdfDocRef.current.numPages;

    for (let pageNum = 1; pageNum <= total; pageNum++) {
      try {
        const page    = await pdfDocRef.current.getPage(pageNum);
        const content = await page.getTextContent();
        const text    = content.items.map((i) => i.str).join("");
        const lower   = text.toLowerCase();
        let startIdx  = 0;
        while (true) {
          const idx = lower.indexOf(q, startIdx);
          if (idx === -1) break;
          results.push({
            page:    pageNum,
            snippet: text.slice(Math.max(0, idx - 25), idx + q.length + 25),
          });
          startIdx = idx + q.length;
        }
      } catch {
        // Silently skip pages that fail to load text content
      }
    }

    setSearchResults(results);
    setSearchCurrent(0);
    setSearching(false);

    if (results.length > 0) {
      const firstPage = results[0].page;
      setLoaded((prev) => Math.max(prev, firstPage + 2));
      setTimeout(() => scrollToPage(firstPage), 300);
    }
  }, [scrollToPage]);

  // ─── Monitor text layer rendering ─────────────────────────────────────────────
  useEffect(() => {
    const checkTextLayer = () => {
      if (!scrollRef.current) return;
      
      const textLayers = scrollRef.current.querySelectorAll(".react-pdf__Page__textContent");
      const textLayersWithContent = Array.from(textLayers).filter(layer => {
        const textNodes = layer.querySelectorAll("span");
        return textNodes.length > 0;
      });
      
      // Consider text layer ready if at least 50% of visible layers have content
      const visibleLayerCount = Math.min(2, loaded); // Check visible pages
      setTextLayerReady(textLayersWithContent.length >= visibleLayerCount);
    };
    
    const interval = setInterval(checkTextLayer, 300);
    checkTextLayer(); // Check immediately
    
    return () => clearInterval(interval);
  }, [loaded]);

  useEffect(() => {
    debouncedRef.current = debounce(runSearch, 500);
  }, [runSearch]);

  const handleSearchChange = (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (!q.trim()) { setSearchResults([]); return; }
    debouncedRef.current?.(q);
  };

  const goToResult = useCallback((index) => {
    if (!searchResults.length) return;
    const i    = (index + searchResults.length) % searchResults.length;
    const page = searchResults[i].page;
    setSearchCurrent(i);
    setLoaded((prev) => Math.max(prev, page + 2));
    setTimeout(() => scrollToPage(page), 100);
  }, [searchResults, scrollToPage]);

  const handleSearchKey = (e) => {
    if (e.key === "Enter") {
      e.shiftKey ? goToResult(searchCurrent - 1) : goToResult(searchCurrent + 1);
    }
  };

  // ─── Highlight active search query in DOM ─────────────────────────────────────
  useEffect(() => {
    if (!searchQuery.trim() || !scrollRef.current) {
      // Clear all marks
      document.querySelectorAll(".react-pdf__Page__textContent mark").forEach((mark) => {
        const text = mark.textContent;
        const parent = mark.parentNode;
        parent.replaceChild(document.createTextNode(text), mark);
        parent.normalize();
      });
      return;
    }

    const q = searchQuery.toLowerCase();
    const textLayers = scrollRef.current.querySelectorAll(".react-pdf__Page__textContent");
    
    textLayers.forEach((layer) => {
      // Remove existing marks first
      const existingMarks = layer.querySelectorAll("mark");
      existingMarks.forEach((mark) => {
        const text = mark.textContent;
        const parent = mark.parentNode;
        parent.replaceChild(document.createTextNode(text), mark);
      });
      layer.normalize();
      
      // Use TreeWalker to efficiently traverse ALL text
      const walker = document.createTreeWalker(
        layer,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );

      // Collect all text nodes first to avoid iterator invalidation
      const textNodes = [];
      let currentNode;
      while ((currentNode = walker.nextNode())) {
        if (currentNode.textContent.trim()) {
          textNodes.push(currentNode);
        }
      }
      
      if (textNodes.length === 0) return;
      
      // Get all the text combined
      let fullText = textNodes.map(n => n.textContent).join("");
      let fullLower = fullText.toLowerCase();
      let matchFound = fullLower.indexOf(q) !== -1;
      
      if (!matchFound) return;
      
      // Process each text node
      textNodes.forEach((textNode) => {
        const originalText = textNode.textContent;
        const lowerText = originalText.toLowerCase();
        
        let idx = lowerText.indexOf(q);
        if (idx === -1) return;
        
        // Build fragment with marks
        const fragment = document.createDocumentFragment();
        let lastIdx = 0;
        
        while ((idx = lowerText.indexOf(q, lastIdx)) !== -1) {
          if (idx > lastIdx) {
            fragment.appendChild(
              document.createTextNode(originalText.slice(lastIdx, idx))
            );
          }
          
          const mark = document.createElement("mark");
          mark.textContent = originalText.slice(idx, idx + q.length);
          fragment.appendChild(mark);
          
          lastIdx = idx + q.length;
        }
        
        if (lastIdx < originalText.length) {
          fragment.appendChild(
            document.createTextNode(originalText.slice(lastIdx))
          );
        }
        
        textNode.parentNode.replaceChild(fragment, textNode);
      });
    });
  }, [searchQuery]);

  // ─── Memos ────────────────────────────────────────────────────────────────────

  // customTextRenderer recreated when searchQuery changes
  const customTextRenderer = useMemo(() => makeTextRenderer(), []);

  const pageNums = useMemo(() => Array.from({ length: loaded }, (_, i) => i + 1), [loaded]);

  const uniqueResultPages = useMemo(() =>
    [...new Map(searchResults.map((r, i) => [r.page, { page: r.page, i }])).values()]
  , [searchResults]);

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div ref={containerRef} className="flex flex-col h-screen overflow-hidden bg-gray-950 text-white">

      {/* TOOLBAR */}
      <div className="flex-shrink-0 flex flex-wrap items-center justify-between gap-2
                      px-4 py-2 bg-gray-900 border-b border-gray-800 shadow-md z-20">
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-gray-800 transition-colors"
        >
          ← Back
        </button>

        <button
          onClick={() => setSidebar((v) => !v)}
          className={`text-sm px-2 py-1 rounded transition-colors
            ${sidebar ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white hover:bg-gray-800"}`}
        >
          ☰ Pages
        </button>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setScale((s) => Math.max(0.5, +(s - 0.2).toFixed(1)))}
            className="w-8 h-8 flex items-center justify-center bg-gray-800 hover:bg-gray-700 rounded text-lg font-bold"
          >−</button>
          <span className="text-sm text-gray-300 w-12 text-center tabular-nums">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => setScale((s) => Math.min(3.0, +(s + 0.2).toFixed(1)))}
            className="w-8 h-8 flex items-center justify-center bg-gray-800 hover:bg-gray-700 rounded text-lg font-bold"
          >+</button>
        </div>

        <form onSubmit={handleJump} className="flex items-center gap-1.5">
          <input
            type="number"
            min={1}
            max={numPages ?? 1}
            value={jumpInput}
            onChange={(e) => setJumpInput(e.target.value)}
            placeholder={`${currentPage} / ${numPages ?? "…"}`}
            className="w-24 px-2 py-1 text-sm bg-gray-800 border border-gray-700
                       rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            className="text-sm px-2 py-1 bg-blue-600 hover:bg-blue-500 rounded transition-colors"
          >
            Go
          </button>
        </form>

        <button
          onClick={searchOpen ? closeSearch : openSearch}
          className={`text-sm px-2 py-1 rounded transition-colors
            ${searchOpen ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white hover:bg-gray-800"}`}
        >
          🔍 Search
        </button>

        <button
          onClick={() => setDarkMode((v) => !v)}
          className={`text-sm px-2 py-1 rounded transition-colors
            ${darkMode ? "bg-yellow-500 text-gray-900 font-semibold" : "text-gray-400 hover:text-white hover:bg-gray-800"}`}
        >
          {darkMode ? "☀ Day" : "🌙 Night"}
        </button>

        <button
          onClick={toggleFullscreen}
          className="text-sm text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-gray-800 transition-colors"
        >
          {isFullscreen ? "✕ Exit" : "⛶ Full"}
        </button>
      </div>

      {/* SEARCH BAR */}
      {searchOpen && (
        <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-gray-900 border-b border-gray-800">
          <div className="relative flex-1 min-w-40">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyDown={handleSearchKey}
              placeholder="Search in PDF…"
              className="w-full px-3 py-1.5 text-sm bg-gray-800 border border-gray-700
                         rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
            {searching && (
              <div className="absolute right-2 top-2.5 w-3.5 h-3.5 border border-gray-600 border-t-blue-400 rounded-full animate-spin" />
            )}
          </div>

          <span className="text-xs text-gray-400 tabular-nums whitespace-nowrap min-w-[70px]">
            {!textLayerReady
              ? "Loading text…"
              : searching
                ? "Searching…"
                : searchResults.length > 0
                  ? `${searchCurrent + 1} / ${searchResults.length} found`
                  : searchQuery && !searching
                    ? "No results"
                    : ""}
          </span>

          <button
            onClick={() => goToResult(searchCurrent - 1)}
            disabled={!searchResults.length}
            className="px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded text-sm disabled:opacity-30 transition-colors"
          >↑</button>
          <button
            onClick={() => goToResult(searchCurrent + 1)}
            disabled={!searchResults.length}
            className="px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded text-sm disabled:opacity-30 transition-colors"
          >↓</button>
          <button
            onClick={closeSearch}
            className="text-gray-500 hover:text-white px-2 py-1 rounded hover:bg-gray-800 text-sm transition-colors"
          >✕</button>
        </div>
      )}

      {/* Search result page chips */}
      {searchOpen && searchResults.length > 0 && (
        <div className="flex-shrink-0 flex gap-1.5 px-4 py-1.5 bg-gray-950 border-b border-gray-800 overflow-x-auto">
          {uniqueResultPages.map(({ page, i }) => (
            <button
              key={page}
              onClick={() => goToResult(i)}
              className={`flex-shrink-0 text-xs px-2 py-0.5 rounded transition-colors
                ${searchResults[searchCurrent]?.page === page
                  ? "bg-yellow-400 text-gray-900 font-semibold"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}
            >
              p.{page}
            </button>
          ))}
        </div>
      )}

      {/* Progress bar */}
      <div className="flex-shrink-0 h-1 bg-gray-800">
        <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      {/* Text Layer Loading Indicator */}
      {numPages && !textLayerReady && (
        <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-gray-800 border-b border-gray-700">
          <div className="w-3 h-3 border border-gray-600 border-t-blue-400 rounded-full animate-spin" />
          <p className="text-xs text-gray-400">Loading text layer for search…</p>
        </div>
      )}

      {/* BODY */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar thumbnails */}
        {sidebar && (
          <div className="flex-shrink-0 w-36 bg-gray-900 border-r border-gray-800
                          overflow-y-auto flex flex-col items-center py-3 gap-3">
            {numPages && Array.from({ length: numPages }, (_, i) => i + 1).map((num) => (
              <LazyThumb
                key={num}
                num={num}
                file={file}
                options={options}
                isActive={currentPage === num}
                onClick={() => scrollToPage(num)}
                thumbRef={(el) => { if (el) thumbRefs.current[num] = el; }}
              />
            ))}
          </div>
        )}

        {/* PDF scroll area */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto overflow-x-auto bg-gray-950"
          style={{ willChange: "scroll-position", contain: "strict" }}
        >
          {bookError ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="text-center max-w-md">
                <p className="text-red-400 text-lg font-semibold mb-2">⚠ Unable to Load Book</p>
                <p className="text-gray-400 text-sm mb-6">{bookError}</p>
                <button
                  onClick={() => window.history.back()}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm transition-colors"
                >
                  ← Go Back
                </button>
              </div>
            </div>
          ) : (
            <div style={darkMode ? { filter: "invert(1) hue-rotate(180deg)" } : {}}>
              <Document
                file={file}
                options={options}
                onLoadSuccess={onLoadSuccess}
                onError={onLoadError}
                loading={
                  <div className="flex flex-col items-center justify-center h-96 gap-3">
                    <div className="w-8 h-8 border-2 border-gray-700 border-t-blue-500 rounded-full animate-spin" />
                    <p className="text-gray-400 text-sm">Loading PDF…</p>
                  </div>
                }
                error={
                  <div className="flex flex-col items-center justify-center h-96 gap-3">
                    <p className="text-red-400">Failed to load PDF</p>
                    <button
                      onClick={() => window.location.reload()}
                      className="text-sm px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded"
                    >
                      Retry
                    </button>
                  </div>
                }
              >
                <div className="flex flex-col items-center py-8 gap-5">
                  {pageNums.map((num) => (
                    <PDFPage
                      key={num}
                      num={num}
                      scale={scale}
                      setRef={setRef}
                      customTextRenderer={customTextRenderer}
                    />
                  ))}

                  {loaded < (numPages ?? 0) && (
                    <div className="flex items-center gap-2 py-6 text-gray-500 text-sm">
                      <div className="w-4 h-4 border border-gray-600 border-t-blue-400 rounded-full animate-spin" />
                      Loading more…
                    </div>
                  )}

                  {numPages && loaded >= numPages && (
                    <p className="text-gray-700 text-xs py-6 tracking-widest uppercase">
                      ── End of Document ──
                    </p>
                  )}
                </div>
              </Document>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
