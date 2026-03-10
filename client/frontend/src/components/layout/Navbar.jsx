import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { HiOutlineMoon, HiOutlineSun } from "react-icons/hi2";
import { HiOutlineMenuAlt3, HiOutlineX } from "react-icons/hi";
import SystemLogo from "../Logo/SystemLogo";
import ProfileLogo from "../Logo/ProfileLogo";

function Navbar() {
  const [darkMode, setDarkMode] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const token = localStorage.getItem("token");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/books", label: "Browse" },
    ...(token ? [{ to: "/my-library", label: "My Library" }] : []),
  ];

  return (
    <>
      <nav className={`sticky top-0 z-50 bg-white dark:bg-gray-950 transition-all duration-300 ${
        scrolled ? "border-b border-gray-200 dark:border-gray-800 shadow-sm" : "border-b border-transparent"
      }`}>
        <div className="max-w-9xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">

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
          <div className="px-4 pb-5 pt-2 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 flex flex-col gap-1">

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
              <div className="flex items-center gap-3 px-3 py-2">
                <ProfileLogo />
              </div>
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
