import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

const FALLBACK_OFFSET = 88;
const MAX_RETRIES = 10;
const RETRY_DELAY = 120;

function getNavbarOffset() {
  const navbar = document.querySelector('[data-app-navbar="true"]');
  if (!navbar) return FALLBACK_OFFSET;
  return Math.ceil(navbar.getBoundingClientRect().height) + 12;
}

function scrollToHashTarget(hash, behavior = "smooth") {
  const targetId = decodeURIComponent(hash.replace(/^#/, ""));
  if (!targetId) return false;

  const target = document.getElementById(targetId);
  if (!target) return false;

  const top = window.scrollY + target.getBoundingClientRect().top - getNavbarOffset();
  window.scrollTo({
    top: Math.max(0, top),
    behavior,
  });

  return true;
}

export default function HashScrollManager() {
  const location = useLocation();
  const previousPathRef = useRef(location.pathname);
  const previousHashRef = useRef(location.hash);

  useEffect(() => {
    let timeoutId;

    if (location.hash) {
      let attempts = 0;

      const tryScroll = () => {
        attempts += 1;

        if (scrollToHashTarget(location.hash)) return;
        if (attempts >= MAX_RETRIES) return;

        timeoutId = window.setTimeout(tryScroll, RETRY_DELAY);
      };

      tryScroll();
    } else if (previousPathRef.current !== location.pathname || previousHashRef.current) {
      window.scrollTo({ top: 0, behavior: "auto" });
    }

    previousPathRef.current = location.pathname;
    previousHashRef.current = location.hash;

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [location.hash, location.pathname]);

  return null;
}
