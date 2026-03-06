import { Link } from "react-router-dom";
import SystemLogo from "../Logo/SystemLogo";

export default function Footer() {
  const links = [
    { to: "/", label: "Home" },
    { to: "/books", label: "Browse" },
    { to: "/about", label: "About" },
  ];

  return (
    <footer className="bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800">
      <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col items-center gap-8">
        
        <SystemLogo className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />

        {/* Navigation */}
        <nav aria-label="Footer navigation" className="flex flex-wrap justify-center gap-4">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="text-sm text-gray-500 dark:text-gray-400 
                         hover:text-indigo-600 dark:hover:text-indigo-400 
                         px-3 py-1.5 rounded-lg 
                         hover:bg-indigo-50 dark:hover:bg-indigo-950/50 
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400
                         transition-colors duration-200"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="w-64 h-px bg-gray-200 dark:bg-gray-800" />

        <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
          © {new Date().getFullYear()}{" "}
          <span className="font-semibold text-indigo-600 dark:text-indigo-400">AksharShelf</span>. 
          A college project by{" "}
          <span className="font-medium text-indigo-600 dark:text-indigo-400">Gaurab Lohar</span>
        </p>
      </div>
    </footer>
  );
}