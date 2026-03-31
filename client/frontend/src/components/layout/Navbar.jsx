import { Link, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { HiOutlineMoon, HiOutlineSun } from "react-icons/hi2";
import { HiOutlineMenuAlt3, HiOutlineX } from "react-icons/hi";
import SystemLogo from "../Logo/SystemLogo";
import ProfileLogo from "../Logo/ProfileLogo";
import { useAuth } from "../../hooks/useAuth";

function Navbar() {
  const [darkMode, setDarkMode] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const { token } = useAuth();
  const lastScrollYRef = useRef(0);
  const tickingRef = useRef(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY || 0;
      setScrolled(y > 8);

      if (menuOpen) return;
      if (tickingRef.current) return;
      tickingRef.current = true;

      window.requestAnimationFrame(() => {
        const lastY = lastScrollYRef.current || 0;
        const delta = y - lastY;

        if (y < 64) {
          setHidden(false);
        } else if (delta > 12) {
          setHidden(true);
        } else if (delta < -12) {
          setHidden(false);
        }

        lastScrollYRef.current = y;
        tickingRef.current = false;
      });
    };

    lastScrollYRef.current = window.scrollY || 0;
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [menuOpen]);

  // Close menu on route change
  useEffect(() => {
    const id = window.setTimeout(() => setMenuOpen(false), 0);
    return () => window.clearTimeout(id);
  }, [location.pathname]);

  // Lock body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (menuOpen) setHidden(false);
  }, [menuOpen]);

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { to: "/", label: "Home" },
    ...(!token ? [{ to: "/about", label: "About" }] : []),
    { to: "/books", label: "Browse" },
    ...(token ? [{ to: "/my-library", label: "My Library" }] : []),
  ];

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 border-b border-gray-200/80 bg-white/90 shadow-[0_1px_0_rgba(15,23,42,0.04),0_10px_30px_rgba(15,23,42,0.05)] backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:border-gray-800/80 dark:bg-gray-950/80 dark:shadow-[0_1px_0_rgba(255,255,255,0.04),0_10px_30px_rgba(0,0,0,0.28)] supports-[backdrop-filter]:dark:bg-gray-950/70 transition-[transform,opacity,box-shadow,border-color,background-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none will-change-transform ${
          hidden ? "-translate-y-[108%] opacity-0 pointer-events-none" : "translate-y-0 opacity-100"
        } ${scrolled ? "border-gray-200 dark:border-gray-800 shadow-[0_1px_0_rgba(15,23,42,0.05),0_16px_36px_rgba(15,23,42,0.08)] dark:shadow-[0_1px_0_rgba(255,255,255,0.05),0_16px_36px_rgba(0,0,0,0.34)]" : ""}`}
      >
        <div className="page-container flex h-16 items-center gap-4">

          <Link to="/" onClick={() => setMenuOpen(false)}>
            <SystemLogo />
          </Link>

          <div className="flex-1" />

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-all duration-150 ${
                  isActive(l.to)
                    ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-900"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>
          
          <div className="hidden md:block w-px h-5 bg-gray-200 dark:bg-gray-800" />

          <button
            onClick={() => setDarkMode(!darkMode)}
            title="Toggle theme"
            className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all border-0 bg-transparent cursor-pointer"
          >
            {darkMode ? <HiOutlineSun className="w-5 h-5" /> : <HiOutlineMoon className="w-5 h-5" />}
          </button>

          {/* Auth — desktop only */}
          <div className="hidden md:flex items-center gap-1.5">
            {token ? (
              <ProfileLogo />
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/auth/login"
                  className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 px-3 py-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-all"
                >
                  Login
                </Link>
                <Link
                  to="/auth/signup"
                  className="text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-1.5 rounded-lg transition-colors shadow-sm"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>

          {/* Hamburger — mobile only */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900 transition-all border-0 bg-transparent cursor-pointer"
            aria-label="Toggle menu"
          >
            {menuOpen ? <HiOutlineX className="w-5 h-5" /> : <HiOutlineMenuAlt3 className="w-5 h-5" />}
          </button>

        </div>

        {/* Mobile Menu Drawer */}
        <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          menuOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
        }`}>
          <div className="page-container border-t border-gray-100 bg-white pb-5 pt-2 dark:border-gray-800 dark:bg-gray-950 flex flex-col gap-1">

            {/* Nav links */}
            {navLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={`text-sm px-3 py-2.5 rounded-lg font-medium transition-all duration-150 ${
                  isActive(l.to)
                    ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-900"
                }`}
              >
                {l.label}
              </Link>
            ))}

            {/* Divider */}
            <div className="my-2 h-px bg-gray-100 dark:bg-gray-800" />

            {/* Auth */}
            {token ? (
              <ProfileLogo mobile />
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  to="/auth/login"
                  className="text-sm font-medium text-center text-gray-700 dark:text-gray-300 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 transition-all"
                >
                  Login
                </Link>
                <Link
                  to="/auth/signup"
                  className="text-sm font-semibold text-center text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 rounded-lg transition-colors shadow-sm"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>


      {menuOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/20 dark:bg-black/40 backdrop-blur-sm"
          onClick={() => setMenuOpen(false)}
        />
      )}
    </>
  );
}

export default Navbar;
