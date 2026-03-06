import { Link, useLocation,} from "react-router-dom";
import { useEffect, useState } from "react";
import { HiOutlineMoon, HiOutlineSun, HiOutlineUser } from "react-icons/hi2";
import SystemLogo from "../Logo/SystemLogo";
import ProfileLogo from "../Logo/ProfileLogo";


function Navbar() {
  const [darkMode, setDarkMode] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation(); // Get current path for active link styling
  const token = localStorage.getItem("token");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/books", label: "Browse" },
    ...(token ? [{ to: "/my-library", label: "My Library" }] : []),
  ];


  return (
    <nav className={`sticky top-0 z-50 bg-white dark:bg-gray-950 transition-all duration-300 ${scrolled ? "border-b border-gray-200 dark:border-gray-800 shadow-sm" : "border-b border-transparent"}`}>
      
      <div className="max-w-9xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">

        {/* Logo */}
        <Link to="/">
          <SystemLogo />
        </Link>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Nav Links — desktop */}
        <div className="flex items-center gap-1">
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

        {/* Divider */}
        <div className="w-px h-5 bg-gray-200 dark:bg-gray-800" />

        {/* Dark mode toggle */}
        <button onClick={() => setDarkMode(!darkMode)}
         title="Toggle theme"
         className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all text-base border-0 bg-transparent cursor-pointer">
         {darkMode ? <HiOutlineSun className="w-6 h-6" /> : <HiOutlineMoon className="w-6 h-6"/>}
        </button>


        {/* Auth + icons */}
        <div className="flex items-center gap-1.5">
         {token ? (
            <ProfileLogo />
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/auth/login"
                className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 px-3 py-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-all">
                Login
              </Link>
              <Link to="/auth/signup"
                className="text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-1.5 rounded-lg transition-colors shadow-sm">
                Sign up
              </Link>
            </div>
          )}         
        </div>

      </div>
    </nav>
  );
}

export default Navbar;