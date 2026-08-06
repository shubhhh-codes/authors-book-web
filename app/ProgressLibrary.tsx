"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { catalog, findBookIndexBySlug } from "./catalog";
import { ShelfEngine, type ShelfMode } from "./ShelfEngine";
import { siteConfig } from "./site-config";

function ArrowIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <span aria-hidden="true" className={`arrow-icon arrow-icon--${direction}`}>
      <span />
    </span>
  );
}

function getSlugFromLocation(): string | null {
  if (typeof window === "undefined") return null;
  // Check ?book= query param first (used by /book/[slug] redirect)
  const params = new URLSearchParams(window.location.search);
  const queryBook = params.get("book");
  if (queryBook) return queryBook;
  // Fallback: check /book/[slug] path (used when SPA pushState is active)
  const path = window.location.pathname;
  if (path.startsWith("/book/")) {
    return path.replace("/book/", "");
  }
  return null;
}


interface ProgressLibraryProps {
  initialSlug?: string;
  onFocusChange?: (isFocused: boolean) => void;
}

export function ProgressLibrary({ initialSlug, onFocusChange }: ProgressLibraryProps = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<ShelfEngine | null>(null);

  // Deep-link boot: when initialSlug is present, pre-seed React state so the
  // very first paint renders in inspection mode (CSS class "is-focused",
  // details panel visible, browse caption hidden, no preloader).
  const isDeepLink = Boolean(initialSlug);
  const deepLinkIdx = initialSlug ? findBookIndexBySlug(initialSlug) : -1;

  const [activeIndex, setActiveIndex] = useState(
    deepLinkIdx !== -1 ? deepLinkIdx : 0,
  );
  const [selectedIndex, setSelectedIndex] = useState<number | null>(
    deepLinkIdx !== -1 ? deepLinkIdx : null,
  );
  const [mode, setMode] = useState<ShelfMode>(
    isDeepLink ? "inspect" : "browse",
  );
  const [ready, setReady] = useState(isDeepLink);

  useEffect(() => {
    if (!isDeepLink && typeof window !== "undefined" && sessionStorage.getItem("shelf-ready") === "1") {
      setReady(true);
    }
  }, [isDeepLink]);
  const [status, setStatus] = useState(
    isDeepLink ? "Loading volume" : "Preparing the complete catalog",
  );
  const activeBook = catalog[activeIndex];
  const selectedBook = useMemo(
    () => (selectedIndex === null ? null : catalog[selectedIndex]),
    [selectedIndex],
  );
  const isFocused = mode !== "browse";

  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    const el = e.currentTarget;
    const maxScroll = el.scrollHeight - el.clientHeight;
    if (maxScroll > 0) {
      const progress = el.scrollTop / maxScroll;
      engineRef.current?.setDetailScrollProgress(progress);
    }
  };

  useEffect(() => {
    let cancelled = false;
    let engine: ShelfEngine | null = null;

    async function start() {
      if (!canvasRef.current) return;
      await document.fonts.ready;
      if (cancelled || !canvasRef.current) return;

      engine = new ShelfEngine(canvasRef.current, catalog, {
        onActiveIndex: setActiveIndex,
        onMode: (nextMode, index) => {
          setMode(nextMode);
          setSelectedIndex(index);
          const isFocusedNow = nextMode !== "browse";
          onFocusChange?.(isFocusedNow);

          if (typeof window !== "undefined") {
            if (isFocusedNow && index !== null && catalog[index]) {
              const bookSlug = catalog[index].id;
              const targetPath = `/book/${bookSlug}`;
              if (window.location.pathname !== targetPath) {
                // Always use replaceState — never pushState.  pushState creates
                // a history entry that crosses Next.js route boundaries
                // ("/" ↔ "/book/[slug]").  When the user presses Back, both our
                // popstate handler AND Next.js's internal handler fire, causing
                // a full component remount + engine rebuild + preloader flash.
                // replaceState updates the URL without adding a history entry,
                // so the Back button goes to the previous site/page instead.
                window.history.replaceState({ bookSlug }, "", targetPath);
              }
            } else if (!isFocusedNow) {
              // Return to homepage — replace current history entry so the
              // back button takes the user to whatever was before the shelf,
              // not to another /book/* URL.
              if (window.location.pathname !== "/") {
                window.history.replaceState({ bookSlug: null }, "", "/");
              }
            }
          }
        },
        onStatus: setStatus,
        // onReady fires synchronously inside the ShelfEngine constructor,
        // BEFORE the `engine = new ShelfEngine(...)` assignment completes.
        // So we only mark the UI as ready here; the actual focusBook call
        // happens below, after the engine reference is fully assigned.
        onReady: () => {
          setReady(true);
          // Mark this tab as having booted the shelf so that future navigations
          // back to "/" (e.g., from a product page) skip the branded preloader.
          if (typeof window !== "undefined") {
            sessionStorage.setItem("shelf-ready", "1");
          }
        },
      });
      engineRef.current = engine;

      // Deep-link: use focusBookInstant to skip ALL animation and place the
      // engine directly into inspect mode on the first rendered frame.
      // Regular navigation: use focusBook for the animated transition.
      const targetSlug = initialSlug || getSlugFromLocation();
      if (targetSlug) {
        const initialIdx = findBookIndexBySlug(targetSlug);
        if (initialIdx !== -1) {
          if (isDeepLink) {
            engine.focusBookInstant(initialIdx);
          } else {
            engine.focusBook(initialIdx);
          }
        }
      }
    }

    void start();
    return () => {
      cancelled = true;
      engine?.dispose();
      engineRef.current = null;
    };
  }, [initialSlug]);

  // NOTE: The popstate listener was intentionally removed.
  // We use replaceState exclusively (never pushState), so no popstate events
  // are generated by our navigation.  The "Return to Shelf" button and
  // Escape key are the primary mechanisms to exit inspection mode.

  return (
    <main
      className={`press-experience ${ready ? "is-ready" : ""} ${
        mode === "returning"
          ? "is-focused is-returning"
          : isFocused
          ? "is-focused"
          : "is-browsing"
      }`}
    >
      <canvas
        ref={canvasRef}
        className="shelf-canvas"
        data-testid="shelf-canvas"
        role="application"
        tabIndex={0}
        aria-label={`Interactive three-dimensional shelf of ${catalog.length} books. Drag or use the arrow keys to browse. Press Enter to inspect the selected book.`}
      />

      <header className="site-header">
        <div
          className="wordmark"
          aria-label={`${siteConfig.wordmark}, ${siteConfig.collectionName}`}
        >
          <span>{siteConfig.wordmark}</span>
        </div>
        <div className="header-actions">
          <div className="edition-mark">
            <span>BOOK SHELF </span>
          </div>
        </div>
      </header>

      <section
        className="browse-caption"
        aria-hidden={isFocused}
        data-testid="browse-caption"
      >
        <p className="eyebrow">
          <span>{String(activeIndex + 1).padStart(2, "0")}</span>
          <span className="eyebrow__line" />
          <span>{String(catalog.length).padStart(2, "0")}</span>
        </p>
        <h1>{activeBook.shortTitle}</h1>
        <p className="browse-caption__author">{activeBook.author}</p>
        <button
          type="button"
          className="inspect-button"
          data-testid="inspect-active"
          disabled={isFocused}
          onClick={() => engineRef.current?.focusBook(activeIndex)}
          aria-label={`Inspect ${activeBook.title}`}
        >
          <span>Inspect volume</span>
          <span aria-hidden="true">↗</span>
        </button>
      </section>

      <button
        type="button"
        className="shelf-arrow shelf-arrow--left"
        data-testid="browse-previous"
        aria-label="Previous book"
        disabled={isFocused || activeIndex === 0}
        onClick={() => engineRef.current?.browseBy(-1)}
      >
        <ArrowIcon direction="left" />
      </button>
      <button
        type="button"
        className="shelf-arrow shelf-arrow--right"
        data-testid="browse-next"
        aria-label="Next book"
        disabled={isFocused || activeIndex === catalog.length - 1}
        onClick={() => engineRef.current?.browseBy(1)}
      >
        <ArrowIcon direction="right" />
      </button>

      <nav className="shelf-index" aria-label="Catalog position">
        <div className="shelf-index__ticks">
          {catalog.map((book, index) => (
            <button
              key={book.id}
              type="button"
              className={index === activeIndex ? "is-active" : ""}
              aria-label={`Browse to ${book.title}`}
              aria-current={index === activeIndex ? "true" : undefined}
              disabled={isFocused}
              onClick={() => engineRef.current?.browseTo(index)}
            >
              <span />
            </button>
          ))}
        </div>
        <div className="input-hint" aria-hidden="true">
          <span>DRAG</span>
          <i />
          <span>SCROLL</span>
          <i />
          <span>ARROW KEYS</span>
        </div>
      </nav>

      <aside
        className="book-details"
        aria-hidden={!isFocused}
        aria-label={selectedBook ? `Details for ${selectedBook.title}` : "Book details"}
        data-testid="book-details"
        onScroll={handleScroll}
      >
        {selectedBook ? (
          <div className="book-details__inner">
            <button
              type="button"
              className="back-button"
              data-testid="return-to-shelf"
              onClick={() => engineRef.current?.returnToShelf()}
            >
              <ArrowIcon direction="left" />
              <span>Return to shelf</span>
            </button>

            <div className="book-details__position">
              <button
                type="button"
                className="detail-nav-btn"
                disabled={selectedIndex === 0}
                onClick={() => engineRef.current?.inspectNext(-1)}
                aria-label="Previous book"
              >
                ←
              </button>
              <span>{String(selectedIndex! + 1).padStart(2, "0")}</span>
              <span>{String(catalog.length).padStart(2, "0")}</span>
              <button
                type="button"
                className="detail-nav-btn"
                disabled={selectedIndex === catalog.length - 1}
                onClick={() => engineRef.current?.inspectNext(1)}
                aria-label="Next book"
              >
                →
              </button>
            </div>

            <div key={selectedBook.id} className="book-details__copy" onScroll={handleScroll}>
              <p className="eyebrow">{siteConfig.editionEyebrow}</p>
              <h2>{selectedBook.title}</h2>
              <p className="book-details__author">{selectedBook.author}</p>
              <p className="book-details__description">
                {selectedBook.description}
              </p>

              <blockquote>
                <p>“{selectedBook.quote}”</p>
                <cite>{selectedBook.quoteBy}</cite>
              </blockquote>

              <dl>
                <div>
                  <dt>Format</dt>
                  <dd>{selectedBook.format}</dd>
                </div>
                <div>
                  <dt>Availability</dt>
                  <dd>{selectedBook.availability}</dd>
                </div>
              </dl>

              <a
                className="official-link"
                data-testid="official-link"
                href={selectedBook.url}
                target="_blank"
                rel="noreferrer"
              >
                <span>
                  {selectedBook.linkLabel ?? siteConfig.bookLinkLabel}
                </span>
                <span aria-hidden="true">↗</span>
              </a>

              <div className="focus-controls" aria-label="Inspection controls">
                <span>Drag to orbit</span>
                <span>Pinch or scroll to zoom</span>
                <button
                  type="button"
                  data-testid="reset-view"
                  onClick={() => engineRef.current?.resetFocusView()}
                >
                  Reset view
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </aside>

      <div
        className="experience-status"
        role="status"
        aria-live="polite"
        data-testid="experience-status"
      >
        <span className="experience-status__dot" />
        <span>{status}</span>
      </div>

      {/* Preloader: only shown on homepage (browse mode boot).
          Deep-link routes skip the branded splash entirely. */}
      {!isDeepLink && (
        <>
          <div className="loading-screen" aria-hidden={ready}>
            <div className="bookshelf-loader" aria-hidden="true">
              <div className="bookshelf-loader__books">
                <div className="book-spine book-spine--1">
                  <i className="book-spine__stripe" />
                </div>
                <div className="book-spine book-spine--2">
                  <i className="book-spine__stripe" />
                  <div className="book-spine__bookmark" />
                </div>
                <div className="book-spine book-spine--3">
                  <i className="book-spine__stripe" />
                </div>
                <div className="book-spine book-spine--4">
                  <i className="book-spine__stripe" />
                </div>
                <div className="book-spine book-spine--5">
                  <i className="book-spine__stripe" />
                </div>
              </div>
              <div className="bookshelf-loader__shelf" />
            </div>
            <p className="loading-screen__branding">Authors Book &amp; Bookmarks</p>
          </div>

          <div className="curtain-layer" aria-hidden={ready} />
        </>
      )}

      <div className="sr-only" aria-live="polite">
        {isFocused && selectedBook
          ? `Inspecting ${selectedBook.title} by ${selectedBook.author}.`
          : `Selected ${activeBook.title} by ${activeBook.author}.`}
      </div>
    </main>
  );
}
