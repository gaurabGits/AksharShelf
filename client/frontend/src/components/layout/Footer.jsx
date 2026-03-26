import { Link } from "react-router-dom";
import SystemLogo from "../Logo/SystemLogo";

const LINKS = [
  { to: "/",       label: "Home"  },
  { to: "/books",  label: "Books" },
  { to: "/about",  label: "About" },
];

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800/60">
      <div className="page-container py-12">

        {/* Top row */}
        <div className="flex flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">

          {/* Brand */}
          <div className="flex w-full flex-col gap-4 sm:max-w-sm">
            <div className="flex items-center gap-2.5">
              <SystemLogo className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
              <span className="text-sm font-semibold tracking-tight text-gray-900 dark:text-white">
                AksharShelf
              </span>
            </div>
            <p className="text-xs leading-relaxed text-gray-400 dark:text-gray-500">
              A full-stack reading platform built as a BCA 6th semester
              final-year project. Discover, track, and share the books
              that shape your world.
            </p>
          </div>

          {/* Nav + Project (mobile: spaced between) */}
          <div className="flex w-full justify-between gap-10 sm:w-auto sm:gap-14">
            {/* Nav */}
            <div className="flex flex-col gap-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-300 dark:text-gray-600">
                Navigation
              </p>
              <nav className="flex flex-col gap-2.5">
                {LINKS.map((l) => (
                  <Link
                    key={l.to}
                    to={l.to}
                    className="text-sm text-gray-500 dark:text-gray-400
                               hover:text-indigo-600 dark:hover:text-indigo-400
                               transition-colors duration-150 w-fit"
                  >
                    {l.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Project info */}
            <div className="flex flex-col gap-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-300 dark:text-gray-600">
                Project
              </p>
              <div className="flex flex-col gap-2.5">
                {[
                  { label: "Program",   value: "BCA"  },
                  { label: "Semester",  value: "6th"  },
                  { label: "Stack",     value: "MERN" },
                  { label: "Year",      value: "2026" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 dark:text-gray-500 w-16 shrink-0">
                      {label}
                    </span>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Divider */}
        <div className="h-px bg-gray-100 dark:bg-gray-800/60 my-10" />

        {/* Bottom row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="w-full sm:w-auto text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
            © {new Date().getFullYear()}{" "}
            <span className="font-medium text-gray-600 dark:text-gray-400">AksharShelf</span>
            {" "}· Built by{" "}
            <span className="font-medium text-indigo-600 dark:text-indigo-400">
              Gaurab Lohar
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}
