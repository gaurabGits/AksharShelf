import { Link } from "react-router-dom";
import { HiArrowRight, HiOutlineBookOpen } from "react-icons/hi2";

export default function CTASection() {
  const token = localStorage.getItem("token");

  return (
    <section className="py-24 px-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
      <div className="max-w-2xl mx-auto text-center flex flex-col items-center gap-5">
          <span className="text-xs font-semibold uppercase tracking-widest text-indigo-500 dark:text-indigo-400">
            Get started for free
          </span>

          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white leading-tight">
            Your next reading platform is here
          </h2>

          <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base max-w-md leading-relaxed">
            Join on AksharShelf. Build your shelf, track your reading, and discover books you'll love — all in one place.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3 mt-2">
            {!token && (
              <Link
                to="/auth/signup"
                className="flex items-center gap-2 px-7 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all hover:-translate-y-px"
              >
                <HiOutlineBookOpen className="text-base" />
                Create Free Account
              </Link>
            )}
            <Link
              to="/books"
              className="flex items-center gap-2 px-7 py-3 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm font-semibold rounded-xl transition-all hover:-translate-y-px"
            >
              Browse Books <HiArrowRight className="text-sm" />
            </Link>
          </div>
      </div>
    </section>
  );
}